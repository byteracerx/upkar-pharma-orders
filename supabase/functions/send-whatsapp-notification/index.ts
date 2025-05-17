// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Create a single supabase client for interacting with your database
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Twilio configuration
const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || ''

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, doctorName, orderId, orderStatus, invoiceNumber, totalAmount } = await req.json()

    if (!to || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create WhatsApp message content
    let messageBody = `Hello Dr. ${doctorName},\n\n`
    
    if (orderStatus === 'processing' || orderStatus === 'approved') {
      messageBody += `Your order (ID: ${orderId.substring(0, 8)}) has been approved and is now being processed.\n\n`
      
      if (invoiceNumber) {
        messageBody += `Invoice Number: ${invoiceNumber}\n`
      }
      
      messageBody += `Total Amount: ₹${totalAmount.toFixed(2)}\n\n`
      messageBody += `We will notify you once your order is ready for delivery.\n\n`
    } else if (orderStatus === 'delivered') {
      messageBody += `Your order (ID: ${orderId.substring(0, 8)}) has been delivered.\n\n`
      messageBody += `Thank you for your business!\n\n`
    } else {
      messageBody += `Your order (ID: ${orderId.substring(0, 8)}) status has been updated to: ${orderStatus}.\n\n`
    }
    
    messageBody += `For any queries, please contact our customer support.\n\nRegards,\nUpkar Pharma Team`

    // Send WhatsApp message using Twilio
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('To', `whatsapp:${to}`)
    formData.append('From', `whatsapp:${fromNumber}`)
    formData.append('Body', messageBody)

    const twilioResponse = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
      },
      body: formData
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      throw new Error(`Twilio error: ${JSON.stringify(twilioData)}`)
    }

    // Update order with WhatsApp notification sent status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ whatsapp_notification_sent: true })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
    }

    return new Response(
      JSON.stringify({ success: true, messageId: twilioData.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})