
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

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
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        doctor_id: orderData.doctor_id,
        invoice_number: invoiceNumber,
        // In a real implementation, we would generate a PDF and store it in Supabase Storage
        pdf_url: null
      })
      .select()
      .single()
    
    if (invoiceError) {
      throw new Error(`Error creating invoice record: ${invoiceError.message}`)
    }
    
    console.log(`Invoice ${invoiceNumber} created for order ${orderId}`)
    
    // 4. Generate a simple HTML invoice
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
          .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
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
                      Due: ${new Date(orderData.created_at).toLocaleDateString()}
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
                      New Delhi, 110001
                    </td>
                    <td>
                      ${orderData.doctor.name}<br>
                      ${orderData.doctor.email || ''}<br>
                      ${orderData.doctor.phone || ''}
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
                <td>${item.product.name}</td>
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
    
    // In a real implementation, we would:
    // 1. Convert this HTML to PDF using a library like puppeteer
    // 2. Upload the PDF to Supabase Storage
    // 3. Update the invoice record with the PDF URL
    // 4. Send the PDF via email
    
    // For now, we'll just log what would be sent
    console.log("Email that would be sent to doctor:");
    console.log(`
      Subject: Your Invoice ${invoiceNumber} from Upkar Pharma
      
      Dear ${orderData.doctor.name},
      
      Thank you for your order with Upkar Pharma. Your invoice is attached.
      
      Invoice Number: ${invoiceNumber}
      Order ID: ${orderId}
      Order Date: ${new Date(orderData.created_at).toLocaleDateString()}
      Total Amount: ₹${orderData.total_amount.toFixed(2)}
      
      This amount has been added to your credit account.
      
      Regards,
      Upkar Pharma Team
    `);
    
    // In a production environment, we would use a service like SendGrid or AWS SES to send the email with the PDF attachment
    
    return new Response(JSON.stringify({ 
      success: true,
      invoiceNumber,
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
