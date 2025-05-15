
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Email configuration - get from environment variables
const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465')
const smtpUser = Deno.env.get('SMTP_USER') || ''
const smtpPassword = Deno.env.get('SMTP_PASSWORD') || ''
const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@upkarpharma.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  email: string;
  name: string;
  invoiceNumber: string;
  orderId: string;
  pdfUrl: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const { email, name, invoiceNumber, orderId, pdfUrl } = await req.json() as EmailRequest
    
    console.log(`Sending invoice email for ${invoiceNumber} to ${email}`)
    
    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      }
    });
    
    let attachments = [];
    
    // If we have a PDF URL, try to fetch it and attach it
    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl);
        const pdfBlob = await pdfResponse.blob();
        const pdfArrayBuffer = await pdfBlob.arrayBuffer();
        
        attachments.push({
          content: new Uint8Array(pdfArrayBuffer),
          filename: `${invoiceNumber}.pdf`,
          contentType: 'application/pdf',
        });
      } catch (pdfError) {
        console.error("Error fetching PDF for attachment:", pdfError);
        // Continue without attachment if there's an error
      }
    }
    
    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a5568;">Invoice from Upkar Pharma</h1>
        
        <p>Dear ${name},</p>
        
        <p>Thank you for your order with Upkar Pharma. Your invoice has been generated and is attached to this email.</p>
        
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          ${pdfUrl ? `<p><a href="${pdfUrl}" style="background-color: #4299e1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Invoice Online</a></p>` : ''}
        </div>
        
        <p>If you have any questions about your invoice or order, please contact us.</p>
        
        <p>Best regards,<br>The Upkar Pharma Team</p>
      </div>
    `;
    
    // Send email
    await client.send({
      from: `Upkar Pharma <${fromEmail}>`,
      to: email,
      subject: `Your Invoice ${invoiceNumber} from Upkar Pharma`,
      html: emailHtml,
      attachments: attachments
    });
    
    await client.close();
    
    // Record notification in database
    const { error: notificationError } = await supabase
      .from('order_notifications')
      .insert({
        order_id: orderId,
        notification_type: 'email_invoice',
        recipient: email,
        content: `Invoice ${invoiceNumber} sent via email`,
        status: 'sent'
      });
      
    if (notificationError) {
      console.error("Error recording notification:", notificationError);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Email sent successfully" 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in send-invoice-email function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
