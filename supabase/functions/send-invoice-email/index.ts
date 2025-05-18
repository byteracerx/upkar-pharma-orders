
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Add email service information here (for example, using SendGrid or Mailgun)
// const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequestBody {
  doctorEmail: string;
  doctorName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  orderId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: EmailRequestBody = await req.json();
    
    const { doctorEmail, doctorName, invoiceNumber, invoiceUrl, orderId } = body;
    
    console.log(`Sending invoice email for order ${orderId} to ${doctorEmail}`);
    
    // Create email content
    const emailSubject = `Your Upkar Pharma Invoice #${invoiceNumber}`;
    
    const emailContent = `
      <h1>Hello ${doctorName},</h1>
      <p>Thank you for your order with Upkar Pharma. Your invoice is ready and attached below.</p>
      <p>Invoice Number: ${invoiceNumber}</p>
      <p>You can download your invoice by clicking <a href="${invoiceUrl}" target="_blank">here</a>.</p>
      <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The Upkar Pharma Team</p>
    `;
    
    // In a production environment, we would use an email service like SendGrid, Mailgun, etc.
    // For this demo, we'll just log what we would send
    console.log(`Would send email to ${doctorEmail} with subject "${emailSubject}" and link to invoice ${invoiceUrl}`);
    
    /*
    // Example using SendGrid:
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: doctorEmail }]
          }
        ],
        from: { email: "invoices@upkarpharma.com", name: "Upkar Pharma Invoices" },
        subject: emailSubject,
        content: [
          {
            type: "text/html",
            value: emailContent
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`SendGrid API error: ${JSON.stringify(errorData)}`);
    }
    */
    
    // Log the email send attempt in our system
    await supabase
      .from("order_notifications")
      .insert({
        order_id: orderId,
        notification_type: 'invoice_email',
        recipient: doctorEmail,
        content: `Invoice ${invoiceNumber} email notification`,
        status: 'sent'
      });
      
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error) {
    console.error('Error in send-invoice-email function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
