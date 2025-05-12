
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import sgMail from 'https://esm.sh/@sendgrid/mail@7.7.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY') || ''
const fromEmail = Deno.env.get('FROM_EMAIL') || 'notifications@upkar.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'welcome' | 'credit_report' | 'invoice';
  doctorId: string;
  additionalData?: {
    invoiceUrl?: string;
    invoiceNumber?: string;
    creditBalance?: number;
    transactions?: any[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  if (!sendgridApiKey) {
    return new Response(
      JSON.stringify({ error: 'SendGrid API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
  
  // Configure SendGrid
  sgMail.setApiKey(sendgridApiKey)
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { type, doctorId, additionalData } = await req.json() as EmailRequest
    
    // Get doctor information
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('name, email, phone')
      .eq('id', doctorId)
      .single()
    
    if (doctorError || !doctor) {
      throw new Error(`Doctor not found: ${doctorError?.message || 'Unknown error'}`)
    }
    
    let emailContent
    let subject
    
    switch (type) {
      case 'welcome':
        subject = 'Welcome to Upkar Pharmaceuticals!'
        emailContent = createWelcomeEmail(doctor.name)
        break
        
      case 'credit_report':
        if (!additionalData?.creditBalance) {
          throw new Error('Credit balance not provided for credit report')
        }
        subject = 'Your Weekly Credit Report from Upkar'
        emailContent = createCreditReportEmail(
          doctor.name, 
          additionalData.creditBalance,
          additionalData.transactions || []
        )
        break
        
      case 'invoice':
        if (!additionalData?.invoiceUrl || !additionalData?.invoiceNumber) {
          throw new Error('Invoice details not provided')
        }
        subject = `Invoice #${additionalData.invoiceNumber} from Upkar Pharmaceuticals`
        emailContent = createInvoiceEmail(
          doctor.name,
          additionalData.invoiceNumber,
          additionalData.invoiceUrl
        )
        break
        
      default:
        throw new Error(`Unknown email type: ${type}`)
    }
    
    // Send email via SendGrid
    const msg = {
      to: doctor.email || '',
      from: fromEmail,
      subject,
      html: emailContent,
    }
    
    if (!doctor.email) {
      throw new Error('Doctor email not available')
    }
    
    console.log(`Sending ${type} email to ${doctor.email}`)
    await sgMail.send(msg)
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in doctor-email-notifications function:', error)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})

// Email template functions
function createWelcomeEmail(doctorName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #476cff; padding: 20px; color: white; text-align: center;">
        <h1>Welcome to Upkar Pharmaceuticals</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eee; background-color: #fff;">
        <h2>Hello, Dr. ${doctorName}!</h2>
        <p>Thank you for registering with Upkar Pharmaceuticals. We're excited to have you on board.</p>
        <p>Here's what you can do with your new account:</p>
        <ul>
          <li>Browse our extensive catalog of high-quality medicines</li>
          <li>Place orders easily through our online platform</li>
          <li>Track your order status in real-time</li>
          <li>Manage your credit balance</li>
          <li>Access your invoices and transaction history</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://upkar.com/login" style="background-color: #476cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Your Account</a>
        </div>
      </div>
      <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; 2025 Upkar Pharmaceuticals. All rights reserved.</p>
      </div>
    </div>
  `;
}

function createCreditReportEmail(doctorName: string, creditBalance: number, transactions: any[]): string {
  // Generate transaction rows
  let transactionRows = '';
  if (transactions.length > 0) {
    transactions.slice(0, 5).forEach(tx => {
      const amountText = tx.type === 'debit' 
        ? `<span style="color: red;">-₹${tx.amount.toFixed(2)}</span>`
        : `<span style="color: green;">+₹${tx.amount.toFixed(2)}</span>`;
      
      transactionRows += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">${new Date(tx.date).toLocaleDateString()}</td>
          <td style="padding: 8px;">${tx.description}</td>
          <td style="padding: 8px; text-align: right;">${amountText}</td>
        </tr>
      `;
    });
  } else {
    transactionRows = `
      <tr>
        <td colspan="3" style="padding: 8px; text-align: center;">No recent transactions</td>
      </tr>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #476cff; padding: 20px; color: white; text-align: center;">
        <h1>Your Weekly Credit Report</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eee; background-color: #fff;">
        <h2>Hello, Dr. ${doctorName}!</h2>
        <p>Here's a summary of your current credit status with Upkar Pharmaceuticals:</p>
        
        <div style="background-color: ${creditBalance > 10000 ? '#ffeeee' : '#f8f8f8'}; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: #333;">Current Credit Balance</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 10px 0; color: ${creditBalance > 10000 ? 'red' : 'black'};">
            ₹${creditBalance.toFixed(2)}
          </p>
        </div>
        
        <h3>Recent Transactions</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th style="padding: 8px; text-align: left;">Date</th>
              <th style="padding: 8px; text-align: left;">Description</th>
              <th style="padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://upkar.com/credit-history" style="background-color: #476cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Full Credit History</a>
        </div>
        
        <p style="margin-top: 20px;">Thank you for your continued partnership with Upkar Pharmaceuticals.</p>
      </div>
      <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; 2025 Upkar Pharmaceuticals. All rights reserved.</p>
      </div>
    </div>
  `;
}

function createInvoiceEmail(doctorName: string, invoiceNumber: string, invoiceUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #476cff; padding: 20px; color: white; text-align: center;">
        <h1>Invoice from Upkar Pharmaceuticals</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eee; background-color: #fff;">
        <h2>Hello, Dr. ${doctorName}!</h2>
        <p>Your invoice <strong>#${invoiceNumber}</strong> has been generated and is ready for your review.</p>
        <p>You can view and download the invoice by clicking the button below:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${invoiceUrl}" style="background-color: #476cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Invoice</a>
        </div>
        
        <p>If you have any questions about this invoice, please contact our accounts department.</p>
        <p>Thank you for your business!</p>
      </div>
      <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; 2025 Upkar Pharmaceuticals. All rights reserved.</p>
      </div>
    </div>
  `;
}
