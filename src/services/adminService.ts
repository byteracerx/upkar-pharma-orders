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
    
    // Send welcome email to doctor
    try {
      await supabase.functions.invoke('doctor-email-notifications', {
        body: {
          type: 'welcome',
          doctorId
        }
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the approval just because email failed
    }
    
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
        doctor:doctor_id (
          id,
          name,
          phone,
          email
        )
      `)
      .eq("id", orderId)
      .single();
    
    if (orderError || !orderData) {
      console.error("Error fetching order details:", orderError);
      return false;
    }
    
    // Notify doctor about the status update
    try {
      if (orderData.doctor) {
        await supabase.functions.invoke('notify-doctor-status-update', {
          body: {
            orderId,
            doctorId: orderData.doctor.id,
            doctorName: orderData.doctor.name,
            doctorPhone: orderData.doctor.phone,
            doctorEmail: orderData.doctor.email,
            newStatus,
            totalAmount: orderData.total_amount
          }
        });
      }
    } catch (notifyError) {
      console.error("Error notifying doctor about status update:", notifyError);
      // Don't fail the update just because notification failed
    }
    
    // Generate invoice if status is "delivered"
    if (newStatus === "delivered") {
      try {
        await supabase.functions.invoke('generate-invoice', {
          body: {
            orderId,
            doctorId: orderData.doctor.id
          }
        });
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
      .select("name, email, phone")
      .eq("id", doctorId)
      .single();
    
    if (doctorError) {
      console.error("Error fetching doctor information:", doctorError);
      // Continue without doctor info
    } else {
      // Notify doctor about the payment
      try {
        await supabase.functions.invoke('notify-doctor-payment', {
          body: {
            doctorId,
            doctorName: doctor?.name,
            doctorPhone: doctor?.phone,
            doctorEmail: doctor?.email,
            paymentAmount: amount,
            paymentNotes: notes
          }
        });
      } catch (notifyError) {
        console.error("Error notifying doctor about payment:", notifyError);
        // Don't fail the payment just because notification failed
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in markCreditPaid:", error);
    return false;
  }
};
