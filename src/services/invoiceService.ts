
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supabase } from "@/integrations/supabase/client";
import { fetchOrderItems } from "./orderService";
import { toast } from "sonner";

// Define types for invoice data
interface InvoiceData {
  invoiceNumber: string;
  orderDate: string;
  orderItems: any[];
  doctorName: string;
  doctorAddress: string;
  doctorGST: string;
  totalAmount: number;
  orderId: string;
}

/**
 * Generate a PDF invoice for an order
 * @param orderId The ID of the order to generate an invoice for
 * @returns A promise that resolves to the URL of the generated invoice
 */
export const generatePDFInvoice = async (orderId: string): Promise<string> => {
  try {
    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          id,
          name,
          address,
          gst_number,
          phone,
          email
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("Error fetching order for invoice:", orderError);
      throw orderError;
    }

    // Fetch order items
    const orderItems = await fetchOrderItems(orderId);

    if (!orderItems || orderItems.length === 0) {
      throw new Error("No items found for this order");
    }

    // Generate invoice number if not already present
    const invoiceNumber = order.invoice_number || `INV-${Date.now()}-${orderId.substring(0, 8)}`;

    // Create invoice data object
    const invoiceData: InvoiceData = {
      invoiceNumber,
      orderDate: new Date(order.created_at).toLocaleDateString(),
      orderItems,
      doctorName: order.doctor?.name || "Unknown Doctor",
      doctorAddress: order.doctor?.address || "Address not provided",
      doctorGST: order.doctor?.gst_number || "GST not provided",
      totalAmount: order.total_amount,
      orderId
    };

    // Generate PDF
    const pdfBlob = await createInvoicePDF(invoiceData);

    // Store PDF in Supabase Storage
    const fileName = `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '')}.pdf`;
    const filePath = `invoices/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('invoices')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error("Error uploading invoice to storage:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = await supabase
      .storage
      .from('invoices')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update order with invoice information
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        invoice_number: invoiceNumber,
        invoice_generated: true,
        invoice_url: publicUrl
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order with invoice info:", updateError);
      throw updateError;
    }

    return publicUrl;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

/**
 * Create a PDF invoice using jsPDF
 * @param invoiceData The data to include in the invoice
 * @returns A promise that resolves to a Blob containing the PDF
 */
const createInvoicePDF = (invoiceData: InvoiceData): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document (A4 size)
      const doc = new jsPDF();

      // Add company logo and header
      doc.setFontSize(20);
      doc.text('Upkar Pharma', doc.internal.pageSize.width / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text('Quality Medicines & Healthcare Products', doc.internal.pageSize.width / 2, 27, { align: 'center' });

      doc.setFontSize(12);
      doc.text('123 Medical Street, Pharma District', doc.internal.pageSize.width / 2, 35, { align: 'center' });
      doc.text('Delhi, India - 110001', doc.internal.pageSize.width / 2, 42, { align: 'center' });
      doc.text('GST: 27AADCU0000R1ZV', doc.internal.pageSize.width / 2, 49, { align: 'center' });

      // Add a horizontal line
      doc.line(15, 55, doc.internal.pageSize.width - 15, 55);

      // Add invoice title and number
      doc.setFontSize(16);
      doc.text('TAX INVOICE', doc.internal.pageSize.width / 2, 65, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, doc.internal.pageSize.width - 15, 75, { align: 'right' });
      doc.text(`Date: ${invoiceData.orderDate}`, doc.internal.pageSize.width - 15, 82, { align: 'right' });
      doc.text(`Order ID: ${invoiceData.orderId}`, doc.internal.pageSize.width - 15, 89, { align: 'right' });

      // Add customer information
      doc.setFontSize(14);
      doc.text('Bill To:', 15, 75);

      doc.setFontSize(12);
      doc.text(`${invoiceData.doctorName}`, 15, 82);
      doc.text(`${invoiceData.doctorAddress}`, 15, 89);
      doc.text(`GST: ${invoiceData.doctorGST}`, 15, 96);

      // Add table for order items
      const tableColumn = ["S.No", "Item Description", "Quantity", "Price", "Amount"];
      const tableRows: any[] = [];

      let subtotal = 0;

      // Prepare table data
      invoiceData.orderItems.forEach((item, i) => {
        const itemTotal = item.price_per_unit * item.quantity;
        subtotal += itemTotal;

        tableRows.push([
          i + 1,
          item.product?.name || 'Unknown Product',
          item.quantity,
          `₹${item.price_per_unit.toFixed(2)}`,
          `₹${itemTotal.toFixed(2)}`
        ]);
      });

      // Add the table
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 105,
        theme: 'grid',
        headStyles: { fillColor: [66, 135, 245], textColor: 255 },
        styles: { overflow: 'linebreak', cellWidth: 'auto' },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        }
      });

      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Add totals
      const gstRate = 0.18; // 18% GST
      const gstAmount = subtotal * gstRate;
      const total = subtotal + gstAmount;

      doc.text('Subtotal:', 140, finalY);
      doc.text(`₹${subtotal.toFixed(2)}`, doc.internal.pageSize.width - 15, finalY, { align: 'right' });

      doc.text('GST (18%):', 140, finalY + 7);
      doc.text(`₹${gstAmount.toFixed(2)}`, doc.internal.pageSize.width - 15, finalY + 7, { align: 'right' });

      doc.setFont(undefined, 'bold');
      doc.text('Total:', 140, finalY + 14);
      doc.text(`₹${total.toFixed(2)}`, doc.internal.pageSize.width - 15, finalY + 14, { align: 'right' });
      doc.setFont(undefined, 'normal');

      // Add footer
      const footerY = doc.internal.pageSize.height - 30;
      doc.line(15, footerY, doc.internal.pageSize.width - 15, footerY);

      doc.setFontSize(10);
      doc.text('Thank you for your business!', doc.internal.pageSize.width / 2, footerY + 7, { align: 'center' });

      doc.setFontSize(8);
      doc.text('This is a computer-generated invoice and does not require a signature.',
        doc.internal.pageSize.width / 2, footerY + 14, { align: 'center' });

      // Generate the PDF as a blob
      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Send an invoice to a doctor via email
 * @param orderId The ID of the order to send an invoice for
 * @returns A promise that resolves to a boolean indicating success
 */
export const sendInvoiceEmail = async (orderId: string): Promise<boolean> => {
  try {
    // Check if an invoice has been generated
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("invoice_url, invoice_number, doctor_id")
      .eq("id", orderId)
      .single();
    
    if (orderError) {
      throw orderError;
    }
    
    // If no invoice URL, generate one first
    if (!order.invoice_url) {
      toast.info("Generating invoice first...");
      await generatePDFInvoice(orderId);
      
      // Fetch the updated order info
      const { data: updatedOrder, error: fetchError } = await supabase
        .from("orders")
        .select("invoice_url, invoice_number, doctor_id")
        .eq("id", orderId)
        .single();
        
      if (fetchError) {
        throw fetchError;
      }
      
      // Use the updated order data
      order.invoice_url = updatedOrder.invoice_url;
      order.invoice_number = updatedOrder.invoice_number;
    }
    
    // Get doctor details
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("name, email")
      .eq("id", order.doctor_id)
      .single();
      
    if (doctorError || !doctor?.email) {
      throw new Error("Could not find doctor's email address");
    }
    
    // Send email via edge function
    const { error: emailError } = await supabase.functions.invoke('send-invoice-email', {
      body: {
        doctorEmail: doctor.email,
        doctorName: doctor.name,
        invoiceNumber: order.invoice_number,
        invoiceUrl: order.invoice_url,
        orderId: orderId
      }
    });
    
    if (emailError) {
      throw emailError;
    }
    
    // Record the notification in our database
    await supabase
      .from("order_notifications")
      .insert({
        order_id: orderId,
        notification_type: 'invoice_email',
        recipient: doctor.email,
        status: 'sent',
        content: `Invoice ${order.invoice_number} sent by email`
      });
    
    return true;
  } catch (error) {
    console.error("Error sending invoice email:", error);
    toast.error("Failed to send invoice email");
    return false;
  }
};

/**
 * Download an invoice PDF
 * @param invoiceUrl The URL of the invoice to download
 * @param fileName Optional filename for the downloaded file
 */
export const downloadInvoice = async (invoiceUrl: string, fileName?: string): Promise<void> => {
  try {
    const response = await fetch(invoiceUrl);
    const blob = await response.blob();
    
    // Create a temporary link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'invoice.pdf';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error("Error downloading invoice:", error);
    toast.error("Failed to download invoice");
  }
};
