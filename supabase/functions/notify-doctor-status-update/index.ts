
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import twilio from 'https://esm.sh/twilio@4.19.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Twilio configuration
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatusUpdateRequest {
  orderId: string;
  doctorName: string;
  doctorPhone: string;
  doctorEmail: string;
  newStatus: string;
}

// Helper to get status message
function getStatusMessage(status: string): string {
  switch (status.toLowerCase()) {
    case 'accepted':
      return "Your order has been accepted! We're preparing it for delivery.";
    case 'processing':
      return "Good news! Your order is being processed and will be shipped soon.";
    case 'shipped':
      return "Your order is on the way! Expect delivery within 24-48 hours.";
    case 'delivered':
      return "Your order has been delivered. Thank you for choosing Upkar Pharma!";
    case 'declined':
      return "Your order was declined. Please contact us for more information.";
    default:
      return `Your order status has been updated to: ${status}`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { orderId, doctorName, doctorPhone, doctorEmail, newStatus } = await req.json() as StatusUpdateRequest
    
    console.log(`Status update notification: Order ${orderId} for ${doctorName} is now ${newStatus}`)
    
    const statusMessage = getStatusMessage(newStatus)
    
    // Format WhatsApp message
    const messageText = `📋 Order Status Update\n\nHi Dr. ${doctorName},\n\n${statusMessage}\n\nOrder ID: ${orderId}\nStatus: ${newStatus.toUpperCase()}\n\nThank you for choosing Upkar Pharma!`
    
    console.log("WhatsApp message to be sent to doctor:")
    console.log(messageText)
    console.log(`Will be sent to: ${doctorPhone}`)
    
    // Send WhatsApp message using Twilio
    if (twilioAccountSid && twilioAuthToken && twilioFromNumber && doctorPhone) {
      try {
        const twilioClient = twilio(twilioAccountSid, twilioAuthToken)
        
        // Send WhatsApp message
        const message = await twilioClient.messages.create({
          body: messageText,
          from: `whatsapp:${twilioFromNumber}`,
          to: `whatsapp:${doctorPhone}`
        })
        
        console.log('WhatsApp notification sent successfully to doctor:', message.sid)
      } catch (twilioError) {
        console.error('Error sending WhatsApp notification to doctor:', twilioError)
        // We don't fail the function just because WhatsApp notification failed
      }
    } else {
      console.log('Twilio configuration missing or doctor phone not available. WhatsApp notification not sent.')
    }
    
    // If we have the doctor's email, also send an email notification
    if (doctorEmail) {
      // Email notification logic would go here
      console.log(`Email notification would be sent to: ${doctorEmail}`)
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in notify-doctor-status-update function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
