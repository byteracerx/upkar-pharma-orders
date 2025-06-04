
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
    console.log('Fetching credit transactions for doctor:', doctorId);
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("doctor_id", doctorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transactions = data.map(item => ({
      id: item.id,
      doctor_id: item.doctor_id,
      date: item.created_at || '',
      amount: item.amount,
      type: item.type as 'credit' | 'debit',
      description: item.description || '',
      reference_id: 'reference_id' in item ? item.reference_id : undefined
    })) as CreditTransaction[];

    console.log('Fetched transactions:', transactions);
    return transactions;
  } catch (error) {
    console.error("Error getting credit history:", error);
    throw error;
  }
};

// Get credit summary for a doctor
export const fetchDoctorCreditSummary = async (doctorId: string): Promise<CreditSummary> => {
  try {
    console.log('Fetching credit summary for doctor:', doctorId);
    
    // Get doctor information first
    const { data: doctorData, error: doctorError } = await supabase
      .from('doctors')
      .select('name, phone, email')
      .eq('id', doctorId)
      .single();

    if (doctorError) {
      console.error('Error fetching doctor data:', doctorError);
    }

    // Get credit transactions
    const { data: transactions, error: txError } = await supabase
      .from('credit_transactions')
      .select('amount, type')
      .eq('doctor_id', doctorId);

    if (txError) {
      console.error('Error fetching transactions:', txError);
    }

    // Calculate total credit
    const totalCredit = (transactions || []).reduce((total, transaction) => {
      if (transaction.type === 'credit') {
        return total + transaction.amount;
      } else if (transaction.type === 'debit') {
        return total - transaction.amount;
      }
      return total;
    }, 0);

    const summary: CreditSummary = {
      doctor_id: doctorId,
      doctor_name: doctorData?.name || 'Unknown Doctor',
      doctor_phone: doctorData?.phone || 'No phone',
      doctor_email: doctorData?.email || 'No email',
      total_credit: totalCredit
    };

    console.log('Credit summary:', summary);
    return summary;
  } catch (error) {
    console.error("Error getting credit summary:", error);
    throw error;
  }
};

// Get credit summaries for all doctors (admin view) - excluding admins
export const fetchAllDoctorCredits = async (): Promise<CreditSummary[]> => {
  try {
    console.log('Fetching all doctor credits...');
    
    // Get all doctors (excluding admins)
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select("id, name, phone, email, is_approved")
      .neq('gst_number', 'ADMIN00000000000'); // Exclude admin users

    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError);
      throw doctorsError;
    }

    console.log('Found doctors for credit summary:', doctors);

    const creditSummaries: CreditSummary[] = [];

    for (const doctor of doctors || []) {
      try {
        // Get credit transactions for each doctor
        const { data: transactions, error: transactionsError } = await supabase
          .from("credit_transactions")
          .select("amount, type")
          .eq("doctor_id", doctor.id);

        if (transactionsError) {
          console.error(`Error fetching transactions for doctor ${doctor.id}:`, transactionsError);
        }

        // Calculate total credit
        const totalCredit = (transactions || []).reduce((total, transaction) => {
          if (transaction.type === 'credit') {
            return total + transaction.amount;
          } else if (transaction.type === 'debit') {
            return total - transaction.amount;
          }
          return total;
        }, 0);

        creditSummaries.push({
          doctor_id: doctor.id,
          doctor_name: doctor.name || 'Unknown Doctor',
          doctor_phone: doctor.phone || 'No phone',
          doctor_email: doctor.email || 'No email',
          total_credit: totalCredit
        });
      } catch (error) {
        console.error(`Error processing credit for doctor ${doctor.id}:`, error);
        continue;
      }
    }

    console.log('Final credit summaries:', creditSummaries);
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
