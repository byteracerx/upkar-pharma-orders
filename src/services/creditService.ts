import { supabase } from "@/integrations/supabase/client";

// Define the types for credit-related data
export interface CreditTransaction {
  id: string;
  doctor_id: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference_id?: string;
}

export interface CreditSummary {
  doctor_id: string;
  doctor_name: string;
  doctor_phone: string;
  doctor_email: string;
  total_credit: number;
}

// Define the parameter types for RPC functions
interface DoctorIdParam {
  p_doctor_id: string;
}

// Get credit history for a doctor
export const fetchCreditTransactions = async (doctorId: string): Promise<CreditTransaction[]> => {
  try {
    // We're not using RPC since get_doctor_credit_history is not available
    // Instead we'll directly query the credit_transactions table
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("doctor_id", doctorId);
    
    if (error) throw error;
    
    // Transform the data to match the CreditTransaction interface
    const transactions = data.map(item => ({
      id: item.id,
      doctor_id: item.doctor_id,
      date: item.created_at || '',
      amount: item.amount,
      type: item.type as 'credit' | 'debit',
      description: item.description || '',
      reference_id: 'reference_id' in item ? item.reference_id : undefined
    })) as CreditTransaction[];
    
    return transactions;
  } catch (error) {
    console.error("Error getting credit history:", error);
    throw error;
  }
};

// Get credit summary for a doctor
export const fetchDoctorCreditSummary = async (doctorId: string): Promise<CreditSummary> => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_summary', { p_doctor_id: doctorId } as DoctorIdParam);
    
    if (error) throw error;
    
    // Convert the JSON response to match the CreditSummary interface
    let summary: CreditSummary = {
      doctor_id: doctorId,
      doctor_name: '',
      doctor_phone: '',
      doctor_email: '',
      total_credit: 0
    };
    
    // Get doctor information
    const { data: doctorData } = await supabase
      .from('doctors')
      .select('name, phone')
      .eq('id', doctorId)
      .single();
    
    if (doctorData) {
      summary.doctor_name = doctorData.name;
      summary.doctor_phone = doctorData.phone;
    }
    
    // Extract credit information from the response
    if (typeof data === 'object' && data !== null) {
      const jsonData = data as Record<string, any>;
      summary.total_credit = jsonData.available_credit || jsonData.total_credit || 0;
    }
    
    return summary;
  } catch (error) {
    console.error("Error getting credit summary:", error);
    throw error;
  }
};

// Get credit summaries for all doctors (admin view)
export const fetchAllDoctorCredits = async (): Promise<CreditSummary[]> => {
  try {
    // First try using the RPC function
    try {
      const { data, error } = await supabase
        .rpc('get_all_doctor_credits');
      
      if (!error && data) {
        return data as CreditSummary[] || [];
      }
    } catch (rpcError) {
      console.warn("RPC function get_all_doctor_credits failed, falling back to direct query:", rpcError);
    }
    
    // Fallback to direct query if RPC fails
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select("id, name, phone")
      .eq("is_approved", true);
    
    if (doctorsError) throw doctorsError;
    
    // Get credit transactions for each doctor
    const creditSummaries: CreditSummary[] = [];
    
    for (const doctor of doctors) {
      try {
        const { data: transactions, error: transactionsError } = await supabase
          .from("credit_transactions")
          .select("amount, type")
          .eq("doctor_id", doctor.id);
        
        if (transactionsError) throw transactionsError;
        
        // Calculate total credit
        const totalCredit = transactions.reduce((total, transaction) => {
          if (transaction.type === 'credit') {
            return total + transaction.amount;
          } else if (transaction.type === 'debit') {
            return total - transaction.amount;
          }
          return total;
        }, 0);
        
        creditSummaries.push({
          doctor_id: doctor.id,
          doctor_name: doctor.name,
          doctor_phone: doctor.phone,
          doctor_email: 'N/A', // Email not available in database schema
          total_credit: totalCredit
        });
      } catch (error) {
        console.error(`Error processing credit for doctor ${doctor.id}:`, error);
        // Continue with other doctors even if one fails
      }
    }
    
    return creditSummaries;
  } catch (error) {
    console.error("Error getting all doctor credits:", error);
    throw error;
  }
};

// Define interface for payment parameters
interface PaymentParams {
  doctor_id: string;
  payment_amount: number;
  payment_notes: string;
}

// Record a payment for a doctor
export const recordDoctorPayment = async (
  doctorId: string, 
  amount: number, 
  notes: string
): Promise<boolean> => {
  try {
    // Insert directly into payments table
    const { error } = await supabase
      .from('payments')
      .insert({
        doctor_id: doctorId,
        amount: amount,
        notes: notes
      });
    
    if (error) throw error;
    
    // Also create a credit transaction for this payment
    const { error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        doctor_id: doctorId,
        amount: amount,
        type: 'credit', // Payment increases credit
        description: `Payment received: ${notes}`,
        reference_id: `payment-${Date.now()}`
      });
      
    if (txError) {
      console.error("Error recording credit transaction:", txError);
      // Continue even if credit transaction recording fails
    }
    
    return true;
  } catch (error) {
    console.error("Error recording payment:", error);
    throw error;
  }
};

// Keeping the old functions for backwards compatibility
export const getCreditHistory = fetchCreditTransactions;
export const getCreditSummary = fetchDoctorCreditSummary;
export const recordPayment = recordDoctorPayment;
