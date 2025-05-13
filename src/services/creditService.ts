import { supabase } from './supabase';

// Define the RPC parameter types
type RPCParams = Record<string, unknown>;

// Update the functions that were causing TS errors
export const getCreditHistory = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_history', { doctor_id: doctorId } as RPCParams);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting credit history:", error);
    throw error;
  }
};

export const getCreditSummary = async (doctorId: string) => {
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

export const recordPayment = async (doctorId: string, amount: number, paymentMethod: string, notes: string) => {
  try {
    const { data, error } = await supabase
      .rpc('record_doctor_payment', { 
        doctor_id: doctorId, 
        payment_amount: amount, 
        payment_method: paymentMethod, 
        payment_notes: notes 
      } as RPCParams);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error recording payment:", error);
    throw error;
  }
};
