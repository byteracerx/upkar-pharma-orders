import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Fetch pending doctor approvals from the database
 */
export const fetchPendingDoctors = async () => {
  try {
    console.log("Fetching pending doctors...");
    
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
    
    // Update the approval status directly
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
      throw verifyError;
    } 
    
    console.log("Verification result:", verifyData);
    if (!verifyData.is_approved) {
      console.warn("Doctor approval may not have been saved correctly!");
      throw new Error("Doctor approval failed to save");
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
    // Instead of deleting, we update the status to rejected
    const { error } = await supabase
      .from("doctors")
      .update({
        is_approved: false,
        updated_at: new Date().toISOString()
      })
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
    
    // First try direct query with all needed fields
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          id,
          name,
          phone
        )
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching orders:", error);
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
        doctor_phone: order.doctor?.phone || "N/A",
        doctor_email: `${order.doctor?.name?.toLowerCase().replace(/\s+/g, '.') || order.doctor_id?.substring(0, 8)}@example.com` 
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
 * Generate invoice for an order
 */
export const generateInvoice = async (orderId: string) => {
  try {
    // Generate invoice number
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
 * Synchronize orders to ensure visibility
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
    
    return true;
  } catch (error) {
    console.error("Error in synchronizeOrders:", error);
    return false;
  }
};
