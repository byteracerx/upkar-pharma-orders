
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import * as pdf from 'https://esm.sh/pdfkit@0.13.0'
import { Buffer } from 'https://deno.land/std@0.168.0/node/buffer.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { orderId } = await req.json()
    
    console.log(`Generating invoice for order ID: ${orderId}`)
    
    // 1. Fetch the order details with doctor information
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        doctor:doctor_id (
          id,
          name, 
          email,
          phone,
          address,
          gst_number
        )
      `)
      .eq('id', orderId)
      .single()
    
    if (orderError || !orderData) {
      throw new Error(`Error fetching order: ${orderError?.message || 'Order not found'}`)
    }
    
    // 2. Fetch the order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:product_id (
          name,
          price,
          category
        )
      `)
      .eq('order_id', orderId)
    
    if (itemsError) {
      throw new Error(`Error fetching order items: ${itemsError.message}`)
    }
    
    // 3. Create an invoice record
    const invoiceNumber = `INV-${Date.now().toString().substring(3)}`
    
    // 4. Generate PDF invoice
    const pdfBuffer = await generatePdfInvoice(invoiceNumber, orderData, orderItems)
    
    // 5. Store the PDF in Supabase Storage
    const fileName = `invoices/${invoiceNumber}.pdf`
    const { error: uploadError } = await supabase
      .storage
      .from('public')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })
      
    if (uploadError) {
      throw new Error(`Error uploading invoice PDF: ${uploadError.message}`)
    }
    
    // 6. Get the public URL for the uploaded PDF
    const { data: { publicUrl } } = supabase
      .storage
      .from('public')
      .getPublicUrl(fileName)
    
    // 7. Create the invoice record in database
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        doctor_id: orderData.doctor_id,
        invoice_number: invoiceNumber,
        pdf_url: publicUrl
      })
      .select()
      .single()
    
    if (invoiceError) {
      throw new Error(`Error creating invoice record: ${invoiceError.message}`)
    }
    
    // 8. Update the order with invoice information
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        invoice_number: invoiceNumber,
        invoice_generated: true,
        invoice_url: publicUrl
      })
      .eq('id', orderId)
    
    if (updateOrderError) {
      throw new Error(`Error updating order with invoice info: ${updateOrderError.message}`)
    }
    
    // 9. Add status history record
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: 'invoice_generated',
        notes: `Invoice ${invoiceNumber} generated and sent to the doctor.`
      })
    
    // 10. Notify the doctor via email (if email service is set up)
    if (orderData.doctor?.email) {
      // Email functionality would be implemented here
      console.log(`Would send email to: ${orderData.doctor.email} with invoice ${invoiceNumber}`)
    }
    
    console.log(`Invoice ${invoiceNumber} created for order ${orderId}`)
    
    return new Response(JSON.stringify({ 
      success: true,
      invoiceNumber,
      invoiceUrl: publicUrl,
      message: "Invoice generated successfully" 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in generate-invoice function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})

// Function to generate PDF invoice
async function generatePdfInvoice(invoiceNumber: string, order: any, items: any[]) {
  // Create a PDF document
  const doc = new pdf({
    margin: 50,
    size: 'A4'
  });
  
  // Collect PDF chunks as buffer
  const chunks: Uint8Array[] = [];
  doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
  
  // Add content to PDF
  addPdfContent(doc, invoiceNumber, order, items);
  
  // Finalize the PDF
  doc.end();
  
  // Wait for PDF generation to complete and collect all chunks
  return new Promise<Uint8Array>((resolve) => {
    doc.on('end', () => {
      const result = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      );
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      resolve(result);
    });
  });
}

// Add content to PDF document
function addPdfContent(doc: any, invoiceNumber: string, order: any, items: any[]) {
  const doctor = order.doctor || {};
  const currentDate = new Date().toLocaleDateString();
  
  // Logo and Title
  doc.fontSize(20).text('Upkar Pharma', { align: 'right' });
  doc.fontSize(10).text('123 Pharma Street, New Delhi, 110001', { align: 'right' });
  doc.moveDown();

  // Invoice details
  doc.fontSize(16).text('Invoice', { underline: true });
  doc.fontSize(10)
    .text(`Invoice Number: ${invoiceNumber}`)
    .text(`Date: ${currentDate}`)
    .text(`Order ID: ${order.id}`)
    .moveDown();

  // Doctor information
  doc.fontSize(12).text('Bill To:', { underline: true });
  doc.fontSize(10)
    .text(`Name: ${doctor.name || 'N/A'}`)
    .text(`Address: ${doctor.address || 'N/A'}`)
    .text(`Phone: ${doctor.phone || 'N/A'}`)
    .text(`Email: ${doctor.email || 'N/A'}`)
    .text(`GST Number: ${doctor.gst_number || 'N/A'}`)
    .moveDown();

  // Table for items
  doc.fontSize(12).text('Order Items:', { underline: true });
  
  // Table headers
  const tableTop = doc.y + 10;
  const itemX = 50;
  const qtyX = 250;
  const priceX = 340;
  const amountX = 420;
  
  doc.fontSize(10)
    .text('Item', itemX, tableTop)
    .text('Quantity', qtyX, tableTop)
    .text('Price', priceX, tableTop)
    .text('Amount', amountX, tableTop)
    .moveDown();
  
  // Draw table header line
  const lineY = doc.y;
  doc
    .moveTo(itemX, lineY)
    .lineTo(amountX + 80, lineY)
    .stroke();
  
  // Table content
  let tableY = lineY + 10;
  let totalAmount = 0;
  
  items.forEach((item) => {
    const product = item.product || {};
    const quantity = item.quantity || 0;
    const price = item.price_per_unit || 0;
    const amount = item.total_price || 0;
    totalAmount += amount;
    
    doc
      .text(product.name || 'Unknown Product', itemX, tableY)
      .text(quantity.toString(), qtyX, tableY)
      .text(`₹${price.toFixed(2)}`, priceX, tableY)
      .text(`₹${amount.toFixed(2)}`, amountX, tableY);
    
    tableY += 20;
  });
  
  // Summary
  doc
    .moveTo(itemX, tableY)
    .lineTo(amountX + 80, tableY)
    .stroke();
  
  tableY += 10;
  doc
    .fontSize(10)
    .text('Subtotal:', 350, tableY)
    .text(`₹${totalAmount.toFixed(2)}`, amountX, tableY);
  
  tableY += 15;
  doc
    .text('GST (if applicable):', 350, tableY)
    .text('Included', amountX, tableY);
  
  tableY += 15;
  doc
    .fontSize(12)
    .text('Total:', 350, tableY)
    .text(`₹${totalAmount.toFixed(2)}`, amountX, tableY);
  
  // Footer
  doc
    .fontSize(10)
    .text('Thank you for your business!', 50, doc.page.height - 100, {
      align: 'center',
    })
    .text('For any queries, please contact support@upkarpharma.com', {
      align: 'center',
    });
}
