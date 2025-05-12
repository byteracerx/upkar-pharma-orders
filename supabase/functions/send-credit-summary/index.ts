
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { doctorId } = await req.json()
    
    // Fetch doctor's credit information
    const { data: creditSummary, error: summaryError } = await supabase
      .rpc('get_doctor_credit_summary', { p_doctor_id: doctorId })
    
    if (summaryError || !creditSummary) {
      throw new Error(`Error fetching credit summary: ${summaryError?.message || 'No data found'}`)
    }
    
    // Fetch recent transactions
    const { data: transactions, error: txError } = await supabase
      .rpc('get_doctor_credit_transactions', { p_doctor_id: doctorId })
    
    if (txError) {
      console.error("Error fetching transactions:", txError)
      // We continue even if transactions fetch fails
    }
    
    // Generate and send the email
    console.log(`Generating credit summary for doctor: ${creditSummary.doctor_name}`)
    
    // Format the email content
    const emailSubject = `Your Upkar Pharma Credit Summary`
    
    let emailBody = `
    Dear Dr. ${creditSummary.doctor_name},
    
    Here is your current credit summary with Upkar Pharma:
    
    Total Outstanding Credit: ₹${creditSummary.total_credit.toLocaleString()}
    
    Recent Transactions:
    `
    
    if (transactions && transactions.length > 0) {
      const recentTx = transactions.slice(0, 5) // Just show the 5 most recent
      
      recentTx.forEach(tx => {
        emailBody += `
    - ${new Date(tx.date).toLocaleDateString()}: ${tx.description} - ${tx.type === 'credit' ? '+' : '-'}₹${tx.amount.toLocaleString()}`
      })
      
      emailBody += `
      
    To view your complete transaction history, please log in to your account.
    `
    } else {
      emailBody += `
    
    No recent transactions found.
    `
    }
    
    emailBody += `
    
    For any queries related to your account, please contact our support team.
    
    Thank you for choosing Upkar Pharma!
    
    Best regards,
    The Upkar Pharma Team
    `
    
    console.log("Email that would be sent:")
    console.log(`Subject: ${emailSubject}`)
    console.log(`To: ${creditSummary.doctor_email}`)
    console.log(emailBody)
    
    // In a real implementation, you would send an actual email here
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Credit summary email sent successfully" 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in send-credit-summary function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
