
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

interface NotifyDoctorPaymentRequest {
  doctorId: string;
  doctorName: string;
  doctorPhone: string;
  doctorEmail: string;
  paymentAmount: number;
  paymentNotes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { 
      doctorId, 
      doctorName, 
      doctorPhone, 
      paymentAmount,
      paymentNotes 
    } = await req.json() as NotifyDoctorPaymentRequest
    
    console.log(`Payment notification for doctor ${doctorName}: ₹${paymentAmount}`)
    
    // Create message text
    const messageText = `✅ Payment Confirmation\n\nDear Dr. ${doctorName},\n\nWe've received your payment of ₹${paymentAmount.toFixed(2)} for your Upkar Pharmaceuticals account.\n\n${paymentNotes ? `Note: ${paymentNotes}\n\n` : ''}Thank you for your prompt payment.\n\nRegards,\nUpkar Pharmaceuticals`
    
    // If Twilio credentials are configured and we have a phone number, send WhatsApp message
    if (twilioAccountSid && twilioAuthToken && twilioFromNumber && doctorPhone) {
      try {
        const twilioClient = twilio(twilioAccountSid, twilioAuthToken)
        
        // Send WhatsApp message to doctor
        const message = await twilioClient.messages.create({
          body: messageText,
          from: `whatsapp:${twilioFromNumber}`,
          to: `whatsapp:${doctorPhone}`
        })
        
        console.log('WhatsApp payment notification sent successfully:', message.sid)
      } catch (twilioError) {
        console.error('Error sending WhatsApp payment notification:', twilioError)
        // We don't fail the function just because WhatsApp notification failed
      }
    } else {
      console.log('Twilio configuration missing or phone number not available. WhatsApp notification not sent.')
    }
    
    // Also send an email notification
    try {
      await supabase.functions.invoke('doctor-email-notifications', {
        body: {
          type: 'invoice',
          doctorId,
          additionalData: {
            invoiceNumber: `PMT-${Date.now().toString().substring(0, 8)}`,
            invoiceUrl: 'https://upkar.com/payment-receipt'
          }
        }
      })
      
      console.log('Email payment notification sent successfully')
    } catch (emailError) {
      console.error('Error sending email payment notification:', emailError)
      // We don't fail the function just because email notification failed
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in notify-doctor-payment function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
