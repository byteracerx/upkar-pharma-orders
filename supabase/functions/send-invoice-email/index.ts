// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { EmailClient } from "https://esm.sh/@azure/communication-email"

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Email service configuration
const connectionString = Deno.env.get('EMAIL_CONNECTION_STRING') || ''
const emailClient = new EmailClient(connectionString)
const sender = Deno.env.get('EMAIL_SENDER') || 'noreply@upkarpharma.com'

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, doctorName, invoiceUrl, orderId, orderDate, totalAmount } = await req.json()

    if (!to || !subject || !invoiceUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create email content
    const emailContent = {
      subject,
      senderAddress: sender,
      content: {
        kind: 'Html',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4a90e2; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Upkar Pharma</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
              <p>Dear ${doctorName},</p>
              <p>Thank you for your order. Your invoice is ready and can be downloaded using the link below.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceUrl}" style="background-color: #4a90e2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Download Invoice
                </a>
              </div>
              
              <p>If you have any questions about your order, please contact our customer service team.</p>
              
              <p>Best regards,<br>Upkar Pharma Team</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>© 2025 Upkar Pharma. All rights reserved.</p>
              <p>123 Medical Street, Pharma District, Delhi, India - 110001</p>
            </div>
          </div>
        `
      },
      recipients: {
        to: [
          {
            address: to,
            displayName: doctorName
          }
        ]
      }
    }

    // Send email
    const poller = await emailClient.beginSend(emailContent)
    const response = await poller.pollUntilDone()

    // Update order with email sent status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ invoice_email_sent: true })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
    }

    return new Response(
      JSON.stringify({ success: true, messageId: response.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})