
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Doctor {
  id: string;
  name: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Starting weekly credit report generation')
    
    // Get list of approved doctors with outstanding credit
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id, name, email')
      .eq('is_approved', true)
    
    if (doctorsError) {
      throw new Error(`Failed to fetch doctors: ${doctorsError.message}`)
    }
    
    console.log(`Found ${doctors?.length || 0} doctors to process`)
    
    // Process each doctor
    const results = await Promise.allSettled((doctors || []).map(async (doctor: Doctor) => {
      try {
        // Get doctor's credit balance
        const { data: creditSummary, error: creditError } = await supabase
          .rpc('get_doctor_credit_summary', { p_doctor_id: doctor.id } as Record<string, any>)
        
        if (creditError || !creditSummary) {
          throw new Error(`Failed to fetch credit summary for doctor ${doctor.id}: ${creditError?.message || 'No data returned'}`)
        }
        
        // Get recent transactions
        const { data: recentTransactions, error: transactionsError } = await supabase
          .rpc('get_doctor_credit_transactions', { p_doctor_id: doctor.id } as Record<string, any>)
          .limit(5)
        
        if (transactionsError) {
          console.error(`Failed to fetch transactions for doctor ${doctor.id}: ${transactionsError.message}`)
          // Continue with empty transactions
        }
        
        // Send email notification
        await supabase.functions.invoke('doctor-email-notifications', {
          body: {
            type: 'credit_report',
            doctorId: doctor.id,
            additionalData: {
              creditBalance: creditSummary.total_credit,
              transactions: recentTransactions || []
            }
          }
        })
        
        return { doctorId: doctor.id, success: true }
      } catch (error) {
        console.error(`Error processing doctor ${doctor.id}:`, error)
        return { doctorId: doctor.id, success: false, error: error.message }
      }
    }))
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length
    
    console.log(`Weekly report job completed. Successfully processed: ${successful}, Failed: ${failed}`)
    
    return new Response(JSON.stringify({
      success: true,
      summary: { total: doctors?.length || 0, successful, failed }
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
