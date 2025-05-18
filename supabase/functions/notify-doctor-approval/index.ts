
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import twilio from 'https://esm.sh/twilio@4.19.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Twilio configuration
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyDoctorRequest {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  doctorPhone: string;
  approved: boolean;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { doctorId, doctorName, doctorEmail, doctorPhone, approved, reason } = await req.json() as NotifyDoctorRequest
    
    console.log(`Doctor ${doctorName} (${doctorId}) was ${approved ? 'approved' : 'rejected'}`)
    
    // Create message content based on approval status
    const messageText = approved ?
      `Dear ${doctorName},\n\nCongratulations! Your Upkar Pharma account has been approved. You can now log in and start placing orders.\n\nThank you for choosing Upkar Pharma!` :
      `Dear ${doctorName},\n\nWe regret to inform you that your Upkar Pharma account registration has been declined.\n\n${reason ? `Reason: ${reason}` : 'If you have any questions, please contact our support team.'}\n\nRegards,\nUpkar Pharma Team`;
    
    // Email notification logic could be added here
    // For now, just log the email that would be sent
    console.log(`Would send email to: ${doctorEmail} with message: ${messageText}`);
    
    // Send WhatsApp message using Twilio if credentials are available
    if (twilioAccountSid && twilioAuthToken && twilioFromNumber && doctorPhone) {
      try {
        const twilioClient = twilio(twilioAccountSid, twilioAuthToken)
        
        // Clean up phone number format
        const formattedPhone = doctorPhone.startsWith('+') ? 
          doctorPhone : 
          `+91${doctorPhone.replace(/\D/g, '')}`;
        
        // Send WhatsApp message
        const message = await twilioClient.messages.create({
          body: messageText,
          from: `whatsapp:${twilioFromNumber}`,
          to: `whatsapp:${formattedPhone}`
        })
        
        console.log('WhatsApp notification sent successfully:', message.sid)
      } catch (twilioError) {
        console.error('Error sending WhatsApp notification:', twilioError)
        // We don't fail the function just because WhatsApp notification failed
      }
    } else {
      console.log('Twilio configuration missing. WhatsApp notification not sent.')
    }
    
    // Record the notification in the database
    const { error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: null,  // No order ID for approval notifications
        notification_type: approved ? 'doctor_approved' : 'doctor_rejected',
        recipient: doctorName,
        content: messageText,
        status: twilioAccountSid && twilioAuthToken && twilioFromNumber && doctorPhone ? 'sent' : 'pending'
      })
    
    if (notificationError) {
      console.error('Error recording notification:', notificationError)
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in notify-doctor-approval function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
