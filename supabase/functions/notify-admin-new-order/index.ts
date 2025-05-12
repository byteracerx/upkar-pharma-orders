
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import twilio from 'https://esm.sh/twilio@4.19.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Twilio configuration
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || ''
const adminPhoneNumber = Deno.env.get('ADMIN_PHONE_NUMBER') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyAdminRequest {
  orderId: string;
  doctorName: string;
  doctorPhone: string;
  totalAmount: number;
  itemCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { orderId, doctorName, doctorPhone, totalAmount, itemCount } = await req.json() as NotifyAdminRequest
    
    console.log(`New order notification: Order ${orderId} from ${doctorName}`)
    
    // Create message content
    const messageText = `🆕 New Order Alert!\n\nOrder ID: ${orderId}\nDoctor: ${doctorName}\nPhone: ${doctorPhone}\nTotal Amount: ₹${totalAmount.toFixed(2)}\nItems: ${itemCount}\n\nPlease review this order in the admin panel.`
    
    // Log message that would be sent
    console.log("WhatsApp message content:", messageText)
    
    // Initialize Twilio client if credentials are available
    if (twilioAccountSid && twilioAuthToken && twilioFromNumber && adminPhoneNumber) {
      try {
        const twilioClient = twilio(twilioAccountSid, twilioAuthToken)
        
        // Send WhatsApp message using Twilio
        const message = await twilioClient.messages.create({
          body: messageText,
          from: `whatsapp:${twilioFromNumber}`,
          to: `whatsapp:${adminPhoneNumber}`
        })
        
        console.log('WhatsApp notification sent successfully:', message.sid)
      } catch (twilioError) {
        console.error('Error sending WhatsApp notification:', twilioError)
        // We don't fail the function just because WhatsApp notification failed
      }
    } else {
      console.log('Twilio configuration missing. WhatsApp notification not sent.')
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in notify-admin function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
