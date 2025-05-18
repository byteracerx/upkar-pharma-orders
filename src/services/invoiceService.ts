
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadInvoice = (invoiceUrl: string, fileName: string) => {
  // Handle invoice download
  window.open(invoiceUrl, '_blank');
};

/**
 * Generate a PDF invoice for an order
 * @param orderId The ID of the order to generate an invoice for
 * @returns The URL of the generated invoice
 */
export const generatePDFInvoice = async (orderId: string): Promise<string> => {
  try {
    // Get order details to prepare invoice
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, doctor:doctor_id(*)')
      .eq('id', orderId)
      .single();
      
    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found");
    
    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product:product_id(*)')
      .eq('order_id', orderId);
      
    if (itemsError) throw itemsError;
    
    // Generate PDF invoice using jsPDF
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    // Add invoice number and date
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${order.invoice_number || `INV-${orderId.substring(0, 8)}`}`, 20, 40);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 45);
    
    // Add company info
    doc.setFontSize(12);
    doc.text("Upkar Pharma", 140, 40);
    doc.setFontSize(10);
    doc.text("123 Pharma Street", 140, 45);
    doc.text("Mumbai, India", 140, 50);
    doc.text("GST: 27AABCU9603R1ZN", 140, 55);
    
    // Add doctor info
    doc.setFontSize(12);
    doc.text("Bill To:", 20, 60);
    doc.setFontSize(10);
    doc.text(`${order.doctor?.name || "Doctor"}`, 20, 65);
    doc.text(`${order.doctor?.address || ""}`, 20, 70);
    doc.text(`Phone: ${order.doctor?.phone || ""}`, 20, 75);
    doc.text(`GST: ${order.doctor?.gst_number || ""}`, 20, 80);
    
    // Add items table
    const tableColumn = ["Item", "Quantity", "Price", "Amount"];
    const tableRows = items.map(item => [
      item.product?.name || "Unknown Product",
      item.quantity,
      `₹${item.price_per_unit.toFixed(2)}`,
      `₹${item.total_price.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 90,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });
    
    // Add total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ₹${order.total_amount.toFixed(2)}`, 140, finalY);
    doc.text(`Shipping: ₹${order.shipping_cost?.toFixed(2) || "0.00"}`, 140, finalY + 5);
    doc.text(`Total: ₹${(order.total_amount + (order.shipping_cost || 0)).toFixed(2)}`, 140, finalY + 10);
    
    // Add footer
    doc.setFontSize(8);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });
    
    // Save as a data URL
    const pdfDataUri = doc.output('datauristring');
    
    // In a real implementation, you would upload this PDF to storage
    // For now, we'll just return the data URI
    
    // Update the order with the "invoice URL"
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        invoice_url: pdfDataUri,
        invoice_generated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (updateError) console.error('Error updating order with invoice URL:', updateError);
    
    return pdfDataUri;
  } catch (error) {
    console.error('Error generating PDF invoice:', error);
    toast.error("Failed to generate invoice");
    return '';
  }
};

export const sendInvoiceEmail = async (orderId: string): Promise<boolean> => {
  try {
    // Get order details to prepare email
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, doctor:doctor_id(*)')
      .eq('id', orderId)
      .single();
      
    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found");
    
    // Invoke the Supabase Edge Function to send the email
    const { data, error } = await supabase.functions.invoke('send-invoice-email', {
      body: {
        doctorEmail: order.doctor.email,
        doctorName: order.doctor.name,
        invoiceNumber: order.invoice_number || `INV-${orderId.substring(0, 8)}`,
        invoiceUrl: order.invoice_url || '#',
        orderId: orderId
      }
    });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    toast.error("Failed to send invoice email");
    return false;
  }
};

export const sendWhatsAppNotification = async (orderId: string, notificationType: string = 'order_status'): Promise<boolean> => {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, doctor:doctor_id(*)')
      .eq('id', orderId)
      .single();
      
    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found");
    
    // Invoke the Supabase Edge Function to send WhatsApp notification
    const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body: {
        phone: order.doctor.phone,
        name: order.doctor.name,
        orderId: orderId,
        notificationType: notificationType,
        orderStatus: order.status
      }
    });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    toast.error("Failed to send WhatsApp notification");
    return false;
  }
};
