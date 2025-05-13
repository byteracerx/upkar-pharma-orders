import { supabase } from '@/integrations/supabase/client';

// Define the types for credit-related data
export interface CreditTransaction {
  id: string;
  doctor_id: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
}

export interface CreditSummary {
  doctor_id: string;
  doctor_name: string;
  doctor_phone: string;
  doctor_email: string;
  total_credit: number;
}

// Define the RPC parameter types
type RPCParams = Record<string, unknown>;

// Get credit history for a doctor
export const fetchCreditTransactions = async (doctorId: string): Promise<CreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_history', { doctor_id: doctorId } as RPCParams);
    
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
      .rpc('get_doctor_credit_summary', { doctor_id: doctorId } as RPCParams);
    
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
    const { data, error } = await supabase
      .rpc('get_all_doctor_credits');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting all doctor credits:", error);
    throw error;
  }
};

// Record a payment for a doctor
export const recordDoctorPayment = async (
  doctorId: string, 
  amount: number, 
  notes: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('record_doctor_payment', { 
        doctor_id: doctorId, 
        payment_amount: amount,
        payment_method: 'cash', // Default payment method
        payment_notes: notes 
      } as RPCParams);
    
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
