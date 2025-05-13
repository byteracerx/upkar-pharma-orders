
import { supabase } from "@/integrations/supabase/client";

export interface CreditSummary {
  doctor_id: string;
  total_credit: number;
  doctor_name: string;
  doctor_phone: string;
  doctor_email: string;
}

export interface Payment {
  id: string;
  doctor_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
}

export interface CreditTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference_id: string | null;
}



// Fetch credit summary for a doctor
export const fetchDoctorCreditSummary = async (doctorId: string): Promise<CreditSummary | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_summary', { 
        p_doctor_id: doctorId 
      });
    
    if (error) {
      console.error("Error fetching doctor credit summary:", error);
      return null;
    }
    
    return data as CreditSummary;
  } catch (error) {
    console.error("Error in fetchDoctorCreditSummary:", error);
    return null;
  }
};

// Fetch all doctor payments
export const fetchDoctorPayments = async (doctorId: string): Promise<Payment[]> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('payment_date', { ascending: false });
    
    if (error) {
      console.error("Error fetching doctor payments:", error);
      return [];
    }
    
    return data as Payment[];
  } catch (error) {
    console.error("Error in fetchDoctorPayments:", error);
    return [];
  }
};

// Get credit transactions (orders and payments) for a doctor
export const fetchCreditTransactions = async (doctorId: string): Promise<CreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_transactions', { 
        p_doctor_id: doctorId 
      });
    
    if (error) {
      console.error("Error fetching credit transactions:", error);
      return [];
    }
    
    return data as CreditTransaction[];
  } catch (error) {
    console.error("Error in fetchCreditTransactions:", error);
    return [];
  }
};

// Record a new payment for a doctor
export const recordDoctorPayment = async (doctorId: string, amount: number, notes?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('payments')
      .insert({
        doctor_id: doctorId,
        amount,
        notes: notes || null
      });
    
    if (error) {
      console.error("Error recording payment:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in recordDoctorPayment:", error);
    return false;
  }
};

// Fetch credit summaries for all doctors (admin only)
export const fetchAllDoctorCredits = async (): Promise<CreditSummary[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_doctor_credit_summaries', {});
    
    if (error) {
      console.error("Error fetching all doctor credits:", error);
      return [];
    }
    
    return data as CreditSummary[];
  } catch (error) {
    console.error("Error in fetchAllDoctorCredits:", error);
    return [];
  }
};
