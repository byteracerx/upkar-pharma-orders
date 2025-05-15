
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import * as puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
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
    
    // 4. Generate HTML invoice
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); }
          .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
          .invoice-box table td { padding: 5px; vertical-align: top; }
          .invoice-box table tr td:nth-child(2) { text-align: right; }
          .invoice-box table tr.top table td { padding-bottom: 20px; }
          .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
          .invoice-box table tr.information table td { padding-bottom: 40px; }
          .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
          .invoice-box table tr.details td { padding-bottom: 20px; }
          .invoice-box table tr.item td{ border-bottom: 1px solid #eee; }
          .invoice-box table tr.item.last td { border-bottom: none; }
          .invoice-box table tr.total td:nth-child(4) { border-top: 2px solid #eee; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table cellpadding="0" cellspacing="0">
            <tr class="top">
              <td colspan="4">
                <table>
                  <tr>
                    <td class="title">
                      <img src="https://hohfvjzagukucseffpmc.supabase.co/storage/v1/object/public/public/logo.png" style="width:100px; max-width:300px;">
                    </td>
                    <td>
                      Invoice #: ${invoiceNumber}<br>
                      Created: ${new Date(orderData.created_at).toLocaleDateString()}<br>
                      Due: ${new Date(new Date(orderData.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <tr class="information">
              <td colspan="4">
                <table>
                  <tr>
                    <td>
                      Upkar Pharma<br>
                      123 Pharma Street<br>
                      New Delhi, 110001<br>
                      GSTIN: 07AABCU9603R1ZX
                    </td>
                    <td>
                      ${orderData.doctor?.name || ''}<br>
                      ${orderData.doctor?.address || ''}<br>
                      ${orderData.doctor?.phone || ''}<br>
                      GSTIN: ${orderData.doctor?.gst_number || 'N/A'}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <tr class="heading">
              <td>Payment Method</td>
              <td colspan="3">Credit Account</td>
            </tr>
            
            <tr class="details">
              <td>Credit</td>
              <td colspan="3">₹${orderData.total_amount.toFixed(2)}</td>
            </tr>
            
            <tr class="heading">
              <td>Item</td>
              <td>Quantity</td>
              <td>Price</td>
              <td>Total</td>
            </tr>
            
            ${orderItems.map(item => `
              <tr class="item">
                <td>${item.product?.name || 'Unknown Product'}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price_per_unit.toFixed(2)}</td>
                <td>₹${item.total_price.toFixed(2)}</td>
              </tr>
            `).join('')}
            
            <tr class="total">
              <td colspan="3"></td>
              <td>Total: ₹${orderData.total_amount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    let pdfUrl = null;
    
    try {
      // Try to generate PDF with Puppeteer
      const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'a4' });
      await browser.close();

      // Convert PDF buffer to blob for storage
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      
      // Upload PDF to storage
      const pdfFileName = `invoices/${invoiceNumber}.pdf`;
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(pdfFileName, pdfBlob);
        
      if (storageError) {
        console.error("Error uploading PDF:", storageError);
      } else {
        // Get public URL for the PDF
        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(pdfFileName);
          
        if (publicUrlData) {
          pdfUrl = publicUrlData.publicUrl;
        }
      }
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      // Continue without PDF if there's an error
    }
    
    // Save invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        doctor_id: orderData.doctor_id,
        invoice_number: invoiceNumber,
        pdf_url: pdfUrl
      })
      .select()
      .single()
    
    if (invoiceError) {
      throw new Error(`Error creating invoice record: ${invoiceError.message}`)
    }
    
    // Update the order with invoice information
    await supabase
      .from('orders')
      .update({
        invoice_number: invoiceNumber,
        invoice_generated: true,
        invoice_url: pdfUrl
      })
      .eq('id', orderId)
    
    // Add a status history entry
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: 'invoice_generated',
        notes: `Invoice generated: ${invoiceNumber}`
      })
    
    console.log(`Invoice ${invoiceNumber} created for order ${orderId}`)
    
    // Trigger email notification with invoice
    if (orderData.doctor?.email) {
      try {
        // Call another edge function to send email with invoice
        await supabase.functions.invoke('send-invoice-email', {
          body: {
            email: orderData.doctor.email,
            name: orderData.doctor.name,
            invoiceNumber: invoiceNumber,
            orderId: orderId,
            pdfUrl: pdfUrl
          }
        });
        
        console.log(`Email notification sent to ${orderData.doctor.email}`);
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
    }
    
    // Trigger WhatsApp notification
    if (orderData.doctor?.phone) {
      try {
        // Call another edge function to send WhatsApp notification
        await supabase.functions.invoke('notify-doctor-status-update', {
          body: {
            orderId: orderId,
            doctorName: orderData.doctor.name,
            doctorPhone: orderData.doctor.phone,
            doctorEmail: orderData.doctor.email,
            newStatus: 'invoice_generated'
          }
        });
        
        console.log(`WhatsApp notification sent to ${orderData.doctor.phone}`);
      } catch (whatsappError) {
        console.error("Error sending WhatsApp notification:", whatsappError);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      invoiceNumber,
      pdfUrl,
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
