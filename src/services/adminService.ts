
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Fetch pending doctor approvals from the database
 */
export const fetchPendingDoctors = async () => {
  try {
    console.log("Fetching pending doctors...");
    
    // Add a timestamp parameter to bypass cache
    const timestamp = new Date().getTime();
    
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending doctors:", error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} pending doctors`);
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
    console.log("Fetching approved doctors...");
    
    // Add a timestamp parameter to bypass cache
    const timestamp = new Date().getTime();
    
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching approved doctors:", error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} approved doctors`);
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
    console.log(`Approving doctor with ID: ${doctorId}`);
    
    // First, check if the doctor exists
    const { data: doctorData, error: fetchError } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", doctorId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching doctor:", fetchError);
      throw fetchError;
    }
    
    if (!doctorData) {
      console.error("Doctor not found with ID:", doctorId);
      throw new Error("Doctor not found");
    }
    
    console.log("Current doctor data:", doctorData);
    
    // Check if this is a test/mock doctor
    const isMockDoctor = doctorData.name?.toLowerCase().includes('mock') || 
                         doctorData.name?.toLowerCase().includes('test');
                         
    if (isMockDoctor) {
      console.log("This appears to be a mock/test doctor. Removing instead of approving.");
      
      // Delete the mock doctor
      const { error: deleteError } = await supabase
        .from("doctors")
        .delete()
        .eq("id", doctorId);
        
      if (deleteError) {
        console.error("Error deleting mock doctor:", deleteError);
        throw deleteError;
      }
      
      console.log("Mock doctor deleted successfully");
      return true;
    }
    
    // For real doctors, update the approval status
    // Use RPC function if available for more reliable updates
    try {
      const { error: rpcError } = await supabase.rpc('approve_doctor', {
        doctor_id: doctorId
      });
      
      if (!rpcError) {
        console.log("Doctor approved via RPC function");
        return true;
      }
    } catch (rpcError) {
      console.warn("RPC function approve_doctor failed, falling back to direct update:", rpcError);
    }
    
    // Fallback to direct update
    const { data: updateData, error } = await supabase
      .from("doctors")
      .update({ 
        is_approved: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", doctorId)
      .select();

    if (error) {
      console.error("Error approving doctor:", error);
      throw error;
    }
    
    console.log("Doctor approval update result:", updateData);
    
    // Double-check that the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from("doctors")
      .select("is_approved")
      .eq("id", doctorId)
      .single();
      
    if (verifyError) {
      console.error("Error verifying doctor approval:", verifyError);
    } else {
      console.log("Verification result:", verifyData);
      if (!verifyData.is_approved) {
        console.warn("Doctor approval may not have been saved correctly!");
        
        // Try one more time with a different approach
        const { error: finalAttemptError } = await supabase
          .from("doctors")
          .update({ is_approved: true })
          .match({ id: doctorId });
          
        if (finalAttemptError) {
          console.error("Final attempt to approve doctor failed:", finalAttemptError);
        } else {
          console.log("Final approval attempt completed");
        }
      }
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
    console.log("Fetching all orders...");
    
    // Try using the enhanced RPC function first
    try {
      const { data, error } = await supabase.rpc('get_all_orders_enhanced');
      
      if (!error && data) {
        console.log(`Found ${data.length} orders via enhanced RPC`);
        return data;
      }
    } catch (rpcError) {
      console.warn("RPC function get_all_orders_enhanced failed, falling back to standard RPC:", rpcError);
    }
    
    // Try using the standard RPC function
    try {
      const { data, error } = await supabase.rpc('get_all_orders');
      
      if (!error && data) {
        console.log(`Found ${data.length} orders via standard RPC`);
        return data;
      }
    } catch (rpcError) {
      console.warn("RPC function get_all_orders failed, falling back to direct query:", rpcError);
    }
    
    // Fallback to direct query with doctor information only
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          id,
          name,
          phone,
          gst_number
        )
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${data.length} orders via direct query`);
    
    // Check if we have any pending orders
    const pendingOrders = data.filter(order => order.status === 'pending');
    console.log(`Found ${pendingOrders.length} pending orders`);
    
    // Process the data to ensure consistent format
    const processedOrders = data.map(order => {
      return {
        ...order,
        doctor_name: order.doctor?.name || "Unknown",
        doctor_phone: order.doctor?.phone || "N/A"
      };
    });
    
    return processedOrders || [];
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
 * Synchronize orders between doctor and admin views
 * This function ensures that all orders are properly visible in both views
 */
export const synchronizeOrders = async (): Promise<boolean> => {
  try {
    console.log("Starting order synchronization...");
    
    // First, get all orders
    const { data: allOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, doctor_id, status, created_at")
      .order("created_at", { ascending: false });
      
    if (ordersError) {
      console.error("Error fetching all orders:", ordersError);
      throw ordersError;
    }
    
    console.log(`Found ${allOrders.length} total orders`);
    
    // Check for pending orders
    const pendingOrders = allOrders.filter(order => order.status === 'pending');
    console.log(`Found ${pendingOrders.length} pending orders`);
    
    // Check for orders without a status
    const ordersWithoutStatus = allOrders.filter(order => !order.status);
    console.log(`Found ${ordersWithoutStatus.length} orders without a status`);
    
    // Fix orders without a status
    if (ordersWithoutStatus.length > 0) {
      console.log("Fixing orders without a status...");
      
      for (const order of ordersWithoutStatus) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: 'pending' })
          .eq("id", order.id);
          
        if (updateError) {
          console.error(`Error updating order ${order.id} status:`, updateError);
        } else {
          console.log(`Fixed order ${order.id} by setting status to pending`);
        }
      }
    }
    
    // Check for orders with invalid doctor_id
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select("id");
      
    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError);
    } else {
      const validDoctorIds = doctors.map(doctor => doctor.id);
      const ordersWithInvalidDoctor = allOrders.filter(order => !validDoctorIds.includes(order.doctor_id));
      
      console.log(`Found ${ordersWithInvalidDoctor.length} orders with invalid doctor_id`);
      
      // These orders might be orphaned and causing issues
      if (ordersWithInvalidDoctor.length > 0) {
        console.log("Orders with invalid doctor_id:", ordersWithInvalidDoctor);
      }
    }
    
    console.log("Order synchronization completed");
    return true;
  } catch (error) {
    console.error("Error in synchronizeOrders:", error);
    return false;
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
      .select("id, name, phone, email")
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
        doctor_email: doctor.email || "No email provided",
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
