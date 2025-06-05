
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreditSummary {
  total_credit: number;
  total_paid: number;
  current_balance: number;
  pending_orders_amount: number;
  last_payment?: {
    amount: number;
    date: string;
    notes?: string;
  };
}

export interface CreditTransaction {
  id: string;
  doctor_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: string;
  reference_id?: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  doctor_id: string;
  amount: number;
  notes?: string;
  payment_date: string;
}

export const getDoctorCreditSummary = async (doctorId: string): Promise<CreditSummary | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_summary_enhanced', {
        p_doctor_id: doctorId
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching doctor credit summary:', error);
    toast.error('Failed to load credit summary');
    return null;
  }
};

export const getCreditTransactions = async (doctorId: string): Promise<CreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    toast.error('Failed to load credit transactions');
    return [];
  }
};

export const recordPayment = async (
  doctorId: string,
  amount: number,
  notes?: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('record_payment_enhanced', {
        p_doctor_id: doctorId,
        p_amount: amount,
        p_notes: notes
      });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Failed to record payment');
    }

    toast.success("Payment Recorded", {
      description: `Payment of ₹${amount} has been recorded successfully.`
    });

    return true;
  } catch (error: any) {
    console.error('Error recording payment:', error);
    toast.error("Failed to record payment", {
      description: error.message || "Please try again."
    });
    return false;
  }
};

export const getAllDoctorsCredits = async () => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        id,
        name,
        phone,
        email,
        gst_number
      `)
      .eq('is_approved', true)
      .neq('gst_number', 'ADMIN00000000000');

    if (error) throw error;

    // Get credit summary for each doctor
    const doctorsWithCredits = await Promise.all(
      (data || []).map(async (doctor) => {
        const creditSummary = await getDoctorCreditSummary(doctor.id);
        return {
          ...doctor,
          creditSummary
        };
      })
    );

    return doctorsWithCredits;
  } catch (error) {
    console.error('Error fetching all doctors credits:', error);
    toast.error('Failed to load doctors credits');
    return [];
  }
};
