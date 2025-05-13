import { supabase } from "@/integrations/supabase/client";

// Type for RPC parameters
type RpcParams = Record<string, any>;

/**
 * Approves a doctor registration request
 */
export const approveDoctor = async (doctorId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("doctors")
      .update({ is_approved: true })
      .eq("id", doctorId);
    
    if (error) {
      console.error("Error approving doctor:", error);
      return false;
    }
    
    // Note: Removed email fetch from auth.users which is not accessible in client-side code
    // In a real application, we would use a serverless function or store email in the doctors table
    
    return true;
  } catch (error) {
    console.error("Error in approveDoctor:", error);
    return false;
  }
};

/**
 * Declines a doctor registration request
 */
export const declineDoctor = async (doctorId: string, reason?: string): Promise<boolean> => {
  try {
    // For declined doctors, we keep them in the database but mark them as not approved
    const { error } = await supabase
      .from("doctors")
      .update({ is_approved: false })
      .eq("id", doctorId);
    
    if (error) {
      console.error("Error declining doctor:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in declineDoctor:", error);
    return false;
  }
};

/**
 * Updates an order's status
 */
export const updateOrderStatus = async (
  orderId: string, 
  newStatus: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
    
    if (error) {
      console.error("Error updating order status:", error);
      return false;
    }
    
    // Fetch order details to get doctor information
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (*)
      `)
      .eq("id", orderId)
      .single();
    
    if (orderError || !orderData) {
      console.error("Error fetching order details:", orderError);
      return false;
    }
    
    // Notify doctor about the status update - simplified to avoid auth.users access
    try {
      if (orderData.doctor) {
        // Get doctor details from the doctors table
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("id, name, phone")
          .eq("id", orderData.doctor_id)
          .single();
          
        if (doctorError || !doctorData) {
          console.error("Error fetching doctor details:", doctorError);
          return false;
        }
        
        // Note: In a real application, we would use a serverless function to fetch emails
        // and send notifications. Simplified for this example.
        
        console.log(`Would notify doctor ${doctorData.name} about order status change to ${newStatus}`);
      }
    } catch (notifyError) {
      console.error("Error notifying doctor about status update:", notifyError);
      // Don't fail the update just because notification failed
    }
    
    // Generate invoice if status is "delivered"
    if (newStatus === "delivered") {
      try {
        console.log(`Would generate invoice for order ${orderId}`);
        // Would call a serverless function here in a real app
      } catch (invoiceError) {
        console.error("Error generating invoice:", invoiceError);
        // Don't fail the update just because invoice generation failed
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return false;
  }
};

/**
 * Records a payment for a doctor's credit
 */
export const markCreditPaid = async (
  doctorId: string, 
  amount: number, 
  notes: string
): Promise<boolean> => {
  try {
    // Insert a new payment record
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        doctor_id: doctorId,
        amount,
        notes
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error recording payment:", error);
      return false;
    }
    
    // Fetch doctor information
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("name, phone")
      .eq("id", doctorId)
      .single();
    
    if (doctorError || !doctor) {
      console.error("Error fetching doctor information:", doctorError);
      // Continue without doctor info
    } else {
      // Note: Email notification would be handled by a serverless function in a real app
      console.log(`Would notify doctor ${doctor.name} about payment of ${amount}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error in markCreditPaid:", error);
    return false;
  }
};
