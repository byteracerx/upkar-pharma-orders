
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

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
    
    // TODO: Integrate with a real WhatsApp API (Twilio or similar)
    // For now we'll just log the message that would be sent
    
    const messageText = `🆕 New Order Alert!\n\nOrder ID: ${orderId}\nDoctor: ${doctorName}\nPhone: ${doctorPhone}\nTotal Amount: ₹${totalAmount.toFixed(2)}\nItems: ${itemCount}\n\nPlease review this order in the admin panel.`
    
    console.log("WhatsApp message that would be sent to admin:")
    console.log(messageText)
    
    // You would add the actual WhatsApp sending logic here using Twilio or any other provider
    
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
