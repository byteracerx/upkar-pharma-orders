
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import twilio from 'https://esm.sh/twilio@4.19.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Twilio configuration for WhatsApp
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || '';

// Email configuration
const emailFromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@upkarpharma.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationBody {
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
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: NotificationBody = await req.json();
    
    const { doctorId, doctorName, doctorEmail, doctorPhone, approved, reason } = body;
    
    console.log(`Processing approval notification for doctor: ${doctorName}, Status: ${approved ? 'Approved' : 'Rejected'}`);
    
    // Send email notification
    if (doctorEmail) {
      try {
        const emailSubject = approved 
          ? 'Your Upkar Pharma Application is Approved!' 
          : 'Update on Your Upkar Pharma Application';
        
        let emailContent = '';
        
        if (approved) {
          emailContent = `
            <h1>Congratulations, ${doctorName}!</h1>
            <p>Your application to join Upkar Pharma has been approved. You can now log in to your account and start placing orders.</p>
            <p>Thank you for choosing Upkar Pharma as your pharmaceutical partner.</p>
            <p><a href="${supabaseUrl.replace('.supabase.co', '.app')}/login" style="padding: 10px 20px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 4px;">Login Now</a></p>
            <p>Best regards,<br>The Upkar Pharma Team</p>
          `;
        } else {
          emailContent = `
            <h1>Hello ${doctorName},</h1>
            <p>We've reviewed your application to join Upkar Pharma and unfortunately, we are unable to approve it at this time.</p>
            ${reason ? `<p>Reason: ${reason}</p>` : ''}
            <p>If you believe this is an error or if you'd like to provide additional information, please contact our support team.</p>
            <p>Best regards,<br>The Upkar Pharma Team</p>
          `;
        }
        
        // Use Supabase Resend or Email integrations in production
        // For this demo, we'll just log the email we would send
        console.log(`Would send email to ${doctorEmail} with subject "${emailSubject}" and content: ${emailContent}`);
        
        // In a real implementation, you'd send the email here
        // For example with Resend:
        /*
        await resend.emails.send({
          from: emailFromAddress,
          to: doctorEmail,
          subject: emailSubject,
          html: emailContent,
        });
        */
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    }
    
    // Send WhatsApp notification if Twilio is configured
    if (doctorPhone && twilioAccountSid && twilioAuthToken && twilioFromNumber) {
      try {
        const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        
        const phoneNumber = doctorPhone.startsWith('+') ? doctorPhone : `+91${doctorPhone}`;
        
        const whatsappMessage = approved 
          ? `Congratulations, ${doctorName}! Your application to join Upkar Pharma has been approved. You can now log in to your account and start placing orders. Thank you for choosing Upkar Pharma as your pharmaceutical partner.` 
          : `Hello ${doctorName}, We've reviewed your application to join Upkar Pharma and unfortunately, we are unable to approve it at this time. ${reason ? `\n\nReason: ${reason}` : ''}\n\nIf you believe this is an error or if you'd like to provide additional information, please contact our support team.`;
        
        // In a production app, we would send the WhatsApp message
        // For now, we'll just log it
        console.log(`Would send WhatsApp message to ${phoneNumber}: ${whatsappMessage}`);
        
        /*
        const message = await twilioClient.messages.create({
          body: whatsappMessage,
          from: `whatsapp:${twilioFromNumber}`,
          to: `whatsapp:${phoneNumber}`
        });
        
        console.log(`WhatsApp sent with SID: ${message.sid}`);
        */
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification:', whatsappError);
      }
    }
    
    // Record the notification in the database
    await supabase
      .from('order_notifications')
      .insert({
        notification_type: approved ? 'doctor_approved' : 'doctor_rejected',
        recipient: doctorEmail || doctorPhone,
        content: approved 
          ? `Doctor application approved: ${doctorName}` 
          : `Doctor application rejected: ${doctorName} - ${reason || 'No reason provided'}`,
        status: 'sent'
      });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error) {
    console.error('Error in notify-doctor-approval function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
