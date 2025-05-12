
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentNotificationRequest {
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
      doctorEmail,
      paymentAmount, 
      paymentNotes 
    } = await req.json() as PaymentNotificationRequest
    
    console.log(`Payment notification: ${paymentAmount} from ${doctorName}`)
    
    // Format WhatsApp message
    const messageText = `💰 Payment Received\n\nHi Dr. ${doctorName},\n\nWe've received your payment of ₹${paymentAmount.toLocaleString()}.\n\n${paymentNotes ? `Notes: ${paymentNotes}\n\n` : ''}Thank you for your prompt payment!\n\nUpkar Pharma Team`
    
    console.log("WhatsApp message that would be sent:")
    console.log(messageText)
    console.log(`Would be sent to: ${doctorPhone}`)
    
    // You would add the actual WhatsApp/email sending logic here
    
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
