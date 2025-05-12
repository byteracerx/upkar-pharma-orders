
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
    
    // 4. In a real implementation, we would:
    // - Generate a PDF using a library
    // - Upload it to Supabase Storage
    // - Update the invoice record with the PDF URL
    // - Send the PDF via email
    
    console.log("Email that would be sent to doctor:")
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
    `)
    
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
