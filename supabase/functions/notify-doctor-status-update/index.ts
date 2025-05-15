
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
  invoiceUrl?: string;
  invoiceNumber?: string;
}

// Helper to get status message
function getStatusMessage(status: string, invoiceNumber?: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return "Your order has been received and is pending review.";
    case 'accepted':
    case 'approved':
      return "Good news! Your order has been approved. We're preparing it for processing.";
    case 'processing':
      return "Your order is being processed and will be shipped soon.";
    case 'shipped':
      return "Your order is on the way! Expect delivery within 24-48 hours.";
    case 'delivered':
      return "Your order has been delivered. Thank you for choosing Upkar Pharma!";
    case 'declined':
    case 'cancelled':
      return "Your order was cancelled. Please contact us for more information.";
    case 'invoice_generated':
      return invoiceNumber 
        ? `Your invoice ${invoiceNumber} has been generated and sent to your email.`
        : "Your invoice has been generated and sent to your email.";
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
    
    const { 
      orderId, 
      doctorName, 
      doctorPhone, 
      doctorEmail, 
      newStatus,
      invoiceUrl,
      invoiceNumber
    } = await req.json() as StatusUpdateRequest
    
    console.log(`Status update notification: Order ${orderId} for ${doctorName} is now ${newStatus}`)
    
    // Get order details if needed
    const { data: orderData } = await supabase
      .from('orders')
      .select('total_amount, created_at, invoice_number')
      .eq('id', orderId)
      .single();
    
    const statusMessage = getStatusMessage(newStatus, invoiceNumber || orderData?.invoice_number);
    
    // Format WhatsApp message
    let messageText = `📋 Order Status Update\n\nHi Dr. ${doctorName},\n\n${statusMessage}\n\nOrder ID: ${orderId}\nStatus: ${newStatus.toUpperCase()}\n\n`;
    
    // Add order details if available
    if (orderData) {
      messageText += `Amount: ₹${orderData.total_amount?.toFixed(2) || 'N/A'}\nDate: ${new Date(orderData.created_at).toLocaleDateString() || 'N/A'}\n\n`;
    }
    
    // Add invoice info if available
    if (newStatus === 'invoice_generated' && invoiceNumber) {
      messageText += `Invoice #: ${invoiceNumber}\n`;
      
      if (invoiceUrl) {
        messageText += `View invoice: ${invoiceUrl}\n\n`;
      }
    }
    
    messageText += "Thank you for choosing Upkar Pharma!";
    
    console.log("WhatsApp message to be sent to doctor:")
    console.log(messageText)
    console.log(`Will be sent to: ${doctorPhone}`)
    
    // Send WhatsApp message using Twilio
    if (twilioAccountSid && twilioAuthToken && twilioFromNumber && doctorPhone) {
      try {
        const twilioClient = twilio(twilioAccountSid, twilioAuthToken)
        
        // Clean and format the phone number
        let formattedPhone = doctorPhone;
        if (!formattedPhone.startsWith('+')) {
          // Add India country code if not present
          formattedPhone = '+91' + formattedPhone.replace(/\D/g, '');
        }
        
        // Send WhatsApp message
        const message = await twilioClient.messages.create({
          body: messageText,
          from: `whatsapp:${twilioFromNumber}`,
          to: `whatsapp:${formattedPhone}`
        })
        
        console.log('WhatsApp notification sent successfully to doctor:', message.sid)
        
        // Record notification in database
        const { error: notificationError } = await supabase
          .from('order_notifications')
          .insert({
            order_id: orderId,
            notification_type: 'whatsapp',
            recipient: doctorPhone,
            content: messageText,
            status: 'sent'
          });
          
        if (notificationError) {
          console.error("Error recording notification:", notificationError);
        }
      } catch (twilioError) {
        console.error('Error sending WhatsApp notification to doctor:', twilioError)
        
        // Record failed notification attempt
        await supabase
          .from('order_notifications')
          .insert({
            order_id: orderId,
            notification_type: 'whatsapp',
            recipient: doctorPhone,
            content: messageText,
            status: 'failed'
          });
      }
    } else {
      console.log('Twilio configuration missing or doctor phone not available. WhatsApp notification not sent.')
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
