
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Twilio configuration
const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || ''

interface NotificationRequest {
  doctorId: string;
  doctorName: string;
  doctorPhone?: string;
  doctorEmail?: string;
  subject: string;
  message: string;
  type: 'account_approval' | 'account_rejection' | 'order_update' | 'payment_received';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data: NotificationRequest = await req.json()
    
    if (!data.doctorId || !data.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    console.log(`Sending ${data.type} notification to doctor ${data.doctorId} (${data.doctorName})`)
    
    // Record notification in database
    const { error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        notification_type: data.type,
        content: data.message,
        recipient: data.doctorEmail || data.doctorPhone || data.doctorName,
        status: 'pending'
      })
    
    if (notificationError) {
      console.error("Error recording notification:", notificationError)
    }
    
    // Send WhatsApp if phone available
    let whatsappSent = false
    if (data.doctorPhone && accountSid && authToken && fromNumber) {
      try {
        // Format phone number to ensure it has country code
        const formattedPhone = data.doctorPhone.startsWith('+') ? 
          data.doctorPhone : `+91${data.doctorPhone.replace(/\D/g, '')}`
        
        // Create WhatsApp message content
        const messageBody = `Hello ${data.doctorName},\n\n${data.message}\n\nRegards,\nUpkar Pharma Team`
        
        // Send WhatsApp message using Twilio
        const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
        
        const formData = new URLSearchParams()
        formData.append('To', `whatsapp:${formattedPhone}`)
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
        
        if (twilioResponse.ok) {
          console.log(`WhatsApp sent to ${formattedPhone}:`, twilioData.sid)
          whatsappSent = true
          
          // Update notification status
          await supabase
            .from('order_notifications')
            .update({ status: 'sent' })
            .eq('recipient', data.doctorPhone || data.doctorName)
            .eq('notification_type', data.type)
        } else {
          console.error("Twilio error:", twilioData)
        }
      } catch (whatsappError) {
        console.error("Error sending WhatsApp:", whatsappError)
      }
    }
    
    // Send email if available
    let emailSent = false
    if (data.doctorEmail) {
      try {
        // Call the send-invoice-email function which can be used for general emails too
        const { error: emailError } = await supabase.functions.invoke('send-invoice-email', {
          body: {
            to: data.doctorEmail,
            subject: data.subject,
            doctorName: data.doctorName,
            content: data.message,
            orderId: "",
            orderDate: new Date().toLocaleDateString(),
            totalAmount: 0
          }
        })
        
        if (!emailError) {
          console.log(`Email sent to ${data.doctorEmail}`)
          emailSent = true
          
          // Update notification status
          await supabase
            .from('order_notifications')
            .update({ status: 'sent' })
            .eq('recipient', data.doctorEmail)
            .eq('notification_type', data.type)
        } else {
          console.error("Email error:", emailError)
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        whatsappSent,
        emailSent,
        message: `Notification sent to ${data.doctorName}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
    
  } catch (error) {
    console.error('Error in send-doctor-notification function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
