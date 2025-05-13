
import { supabase } from '@/integrations/supabase/client';

// Define the types for credit-related data
export interface CreditTransaction {
  id: string;
  doctor_id: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference_id?: string; // Added missing field
}

export interface CreditSummary {
  doctor_id: string;
  doctor_name: string;
  doctor_phone: string;
  doctor_email: string;
  total_credit: number;
}

// Define the RPC parameter types
interface DoctorIdParam {
  doctor_id: string;
}

// Get credit history for a doctor
export const fetchCreditTransactions = async (doctorId: string): Promise<CreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_history', { doctor_id: doctorId });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting credit history:", error);
    throw error;
  }
};

// Get credit summary for a doctor
export const fetchDoctorCreditSummary = async (doctorId: string): Promise<CreditSummary> => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_summary', { doctor_id: doctorId });
    
    if (error) throw error;
    return data;
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
        return data || [];
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
          doctor_email: '', // Email not available in this fallback
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
  payment_method: string;
  payment_notes: string;
}

// Record a payment for a doctor
export const recordDoctorPayment = async (
  doctorId: string, 
  amount: number, 
  notes: string
): Promise<boolean> => {
  try {
    const params: PaymentParams = {
      doctor_id: doctorId,
      payment_amount: amount,
      payment_method: 'cash', // Default payment method
      payment_notes: notes
    };
    
    const { data, error } = await supabase
      .rpc('record_doctor_payment', params);
    
    if (error) throw error;
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
