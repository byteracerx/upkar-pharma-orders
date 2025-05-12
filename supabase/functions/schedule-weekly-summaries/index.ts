
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function is designed to be triggered by a cron job (weekly)
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log("Starting weekly credit summary scheduler")
    
    // Get all doctors with outstanding credit
    const { data: doctorsWithCredit, error: doctorError } = await supabase
      .rpc('get_all_doctor_credit_summaries')
    
    if (doctorError) {
      throw new Error(`Error fetching doctors: ${doctorError.message}`)
    }
    
    console.log(`Found ${doctorsWithCredit.length} doctors with credit accounts`)
    
    // For each doctor, generate and send a credit summary
    const processedDoctors = []
    
    for (const doctor of doctorsWithCredit) {
      try {
        // In a real implementation, you'd call send-credit-summary for each doctor
        // or implement the email sending logic directly here
        console.log(`Would send weekly summary to: ${doctor.doctor_name} (${doctor.doctor_email})`)
        console.log(`Current balance: ₹${doctor.total_credit.toLocaleString()}`)
        
        processedDoctors.push({
          doctor_id: doctor.doctor_id,
          name: doctor.doctor_name,
          email: doctor.doctor_email,
          status: "queued"
        })
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (err) {
        console.error(`Error processing doctor ${doctor.doctor_id}:`, err)
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      processed: processedDoctors.length,
      total: doctorsWithCredit.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in schedule-weekly-summaries function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
