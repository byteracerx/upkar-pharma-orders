
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Fetch pending doctor approvals from the database
 */
export const fetchPendingDoctors = async () => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending doctors:", error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error("Error in fetchPendingDoctors:", error);
    throw error;
  }
};

/**
 * Fetch approved doctors from the database
 */
export const fetchApprovedDoctors = async () => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching approved doctors:", error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error("Error in fetchApprovedDoctors:", error);
    throw error;
  }
};

/**
 * Approve a doctor by setting is_approved to true
 */
export const approveDoctor = async (doctorId: string) => {
  try {
    const { error } = await supabase
      .from("doctors")
      .update({ is_approved: true })
      .eq("id", doctorId);

    if (error) {
      console.error("Error approving doctor:", error);
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error("Error in approveDoctor:", error);
    throw error;
  }
};

/**
 * Reject a doctor registration
 */
export const rejectDoctor = async (doctorId: string) => {
  try {
    // Note: Instead of deleting, we could also add a "rejected" status field
    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", doctorId);

    if (error) {
      console.error("Error rejecting doctor:", error);
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error("Error in rejectDoctor:", error);
    throw error;
  }
};

/**
 * Fetch all orders with doctor details
 */
export const fetchAllOrders = async () => {
  try {
    // Try using the RPC function
    try {
      const { data, error } = await supabase.rpc('get_all_orders');
      
      if (!error && data) {
        return data;
      }
    } catch (rpcError) {
      console.warn("RPC function get_all_orders failed, falling back to direct query:", rpcError);
    }
    
    // Fallback to direct query
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone
        )
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error in fetchAllOrders:", error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
      
    if (error) {
      throw error;
    }
    
    // Add entry to order status history
    await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: newStatus,
        notes: `Status updated to ${newStatus} by admin`
      });
      
    return true;
  } catch (error: any) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

/**
 * Generate invoice for an order
 */
export const generateInvoice = async (orderId: string) => {
  try {
    // Use the RPC function if available
    try {
      const { error } = await supabase.rpc('generate_invoice', {
        p_order_id: orderId
      });
      
      if (!error) {
        return true;
      }
    } catch (rpcError) {
      console.warn("RPC function generate_invoice failed, falling back to direct implementation:", rpcError);
    }
    
    // Fallback implementation
    const invoiceNumber = `INV-${Date.now()}-${orderId.substring(0, 8)}`;
    const invoiceUrl = `/invoices/${invoiceNumber}.pdf`;
    
    const { error } = await supabase
      .from("orders")
      .update({
        invoice_number: invoiceNumber,
        invoice_generated: true,
        invoice_url: invoiceUrl
      })
      .eq("id", orderId);
      
    if (error) {
      throw error;
    }
    
    // Add status history entry
    await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: 'invoice_generated',
        notes: `Invoice generated: ${invoiceNumber}`
      });
      
    return true;
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

/**
 * Get doctor credit summary
 */
export const getDoctorCreditSummary = async (doctorId: string) => {
  try {
    // Use RPC function
    const { data, error } = await supabase.rpc('get_doctor_credit_summary', {
      p_doctor_id: doctorId
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error("Error getting doctor credit summary:", error);
    throw error;
  }
};

/**
 * Get all doctor credits
 */
export const getAllDoctorCredits = async () => {
  try {
    // Use RPC function if available
    try {
      const { data, error } = await supabase.rpc('get_all_doctor_credits');
      
      if (!error && data) {
        return data;
      }
    } catch (rpcError) {
      console.warn("RPC function get_all_doctor_credits failed, falling back to direct query:", rpcError);
    }
    
    // Fallback to calculating credits directly
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select("id, name, phone")
      .eq("is_approved", true);
      
    if (doctorsError) {
      throw doctorsError;
    }
    
    const result = [];
    
    for (const doctor of doctors) {
      // Get credit transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("credit_transactions")
        .select("type, amount")
        .eq("doctor_id", doctor.id);
        
      if (transactionsError) {
        console.error(`Error fetching credits for doctor ${doctor.id}:`, transactionsError);
        continue;
      }
      
      // Calculate total credit
      let totalCredit = 0;
      
      for (const tx of transactions || []) {
        if (tx.type === 'credit') {
          totalCredit += tx.amount;
        } else if (tx.type === 'debit') {
          totalCredit -= tx.amount;
        }
      }
      
      result.push({
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        doctor_phone: doctor.phone,
        doctor_email: doctor.email || '',
        total_credit: totalCredit
      });
    }
    
    return result;
  } catch (error: any) {
    console.error("Error getting all doctor credits:", error);
    throw error;
  }
};

/**
 * Mark credit as paid
 */
export const markCreditPaid = async (doctorId: string, amount: number, notes: string) => {
  try {
    // Insert payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        doctor_id: doctorId,
        amount,
        notes
      });
      
    if (paymentError) {
      throw paymentError;
    }
    
    // Add credit transaction
    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        doctor_id: doctorId,
        amount,
        type: 'credit',
        description: `Payment received: ${notes}`,
        status: 'completed'
      });
      
    if (transactionError) {
      throw transactionError;
    }
    
    return true;
  } catch (error: any) {
    console.error("Error marking credit as paid:", error);
    throw error;
  }
};
