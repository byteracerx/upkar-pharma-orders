
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
type Doctor = {
  id: string;
  name: string;
  email?: string; // Make email optional since it's not in the database
  phone: string;
  gst_number: string;
  created_at: string;
  is_approved: boolean;
  address?: string;
};

type Order = {
  id: string;
  doctor_id: string;
  doctor_name?: string;
  doctor_phone?: string;
  doctor_email?: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  invoice_number?: string;
  invoice_generated?: boolean;
  invoice_url?: string;
};

// Fetch pending doctor registrations
export const fetchPendingDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", false);

    if (error) throw error;
    
    // Transform data to add email field (use name to generate placeholder email if needed)
    const doctorsWithEmail = data?.map(doctor => ({
      ...doctor,
      email: doctor.name ? `${doctor.name.toLowerCase().replace(/\s+/g, '.')}@example.com` : undefined
    })) || [];
    
    return doctorsWithEmail;
  } catch (error: any) {
    console.error("Error fetching pending doctors:", error);
    toast.error("Failed to load pending doctors");
    throw error;
  }
};

// Fetch approved doctors
export const fetchApprovedDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", true);

    if (error) throw error;
    
    // Transform data to add email field (use name to generate placeholder email if needed)
    const doctorsWithEmail = data?.map(doctor => ({
      ...doctor,
      email: doctor.name ? `${doctor.name.toLowerCase().replace(/\s+/g, '.')}@example.com` : undefined
    })) || [];
    
    return doctorsWithEmail;
  } catch (error: any) {
    console.error("Error fetching approved doctors:", error);
    toast.error("Failed to load approved doctors");
    throw error;
  }
};

// Approve a doctor
export const approveDoctor = async (doctorId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("doctors")
      .update({ is_approved: true })
      .eq("id", doctorId);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error("Error approving doctor:", error);
    toast.error("Failed to approve doctor");
    return false;
  }
};

// Reject a doctor
export const rejectDoctor = async (doctorId: string): Promise<boolean> => {
  try {
    // Instead of deleting, we could add a "rejected" status field
    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", doctorId);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error("Error rejecting doctor:", error);
    toast.error("Failed to reject doctor");
    return false;
  }
};

// Fetch all orders with doctor information
export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    // Use the RPC function to get all orders
    const { data, error } = await supabase.rpc('get_all_orders');

    if (error) {
      console.error("RPC error:", error);
      // Fall back to direct query
      const { data: directData, error: directError } = await supabase
        .from("orders")
        .select(`
          *,
          doctor:doctor_id (
            name,
            phone,
            id
          )
        `)
        .order("created_at", { ascending: false });
      
      if (directError) throw directError;
      
      // Transform the data to match the expected format
      return (directData || []).map(order => ({
        ...order,
        doctor_name: order.doctor?.name || "Unknown",
        doctor_phone: order.doctor?.phone || "N/A",
        doctor_email: order.doctor?.id ? `${order.doctor.name?.toLowerCase().replace(/\s+/g, '.')}@example.com` : "N/A"
      }));
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error fetching all orders:", error);
    toast.error("Failed to load orders");
    return [];
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
  try {
    // Use the RPC function to update status and record in history
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: orderId,
      p_status: newStatus,
      p_notes: `Status updated to ${newStatus} by admin`
    });

    if (error) throw error;
    
    // After updating status, if approved, notify the doctor
    if (newStatus === 'approved' || newStatus === 'processing' || newStatus === 'shipped' || newStatus === 'delivered') {
      // Get doctor information for notification
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          doctor:doctor_id (
            name,
            phone,
            id
          )
        `)
        .eq('id', orderId)
        .single();
        
      if (!orderError && orderData?.doctor) {
        // Generate email from name if needed
        const doctorEmail = orderData.doctor.name ? 
          `${orderData.doctor.name.toLowerCase().replace(/\s+/g, '.')}@example.com` : 
          `doctor-${orderData.doctor.id.substring(0, 8)}@example.com`;
          
        // Send notification to doctor
        try {
          await supabase.functions.invoke('notify-doctor-status-update', {
            body: {
              orderId,
              doctorName: orderData.doctor.name || "Doctor",
              doctorPhone: orderData.doctor.phone || "",
              doctorEmail: doctorEmail
            }
          });
        } catch (notifyError) {
          console.error("Error notifying doctor:", notifyError);
          // Don't fail the status update just because notification failed
        }
      }
    }
    
    return true;
  } catch (error: any) {
    console.error("Error updating order status:", error);
    toast.error("Failed to update order status");
    return false;
  }
};

// Generate invoice for an order
export const generateInvoice = async (orderId: string): Promise<boolean> => {
  try {
    // Call the edge function to generate invoice
    const { data, error } = await supabase.functions.invoke('generate-invoice', {
      body: { orderId }
    });

    if (error) throw error;
    
    if (!data?.success) {
      throw new Error(data?.message || "Failed to generate invoice");
    }
    
    return true;
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    toast.error("Failed to generate invoice");
    return false;
  }
};

// Synchronize all pending orders
export const synchronizeOrders = async (): Promise<boolean> => {
  try {
    // This would check for any inconsistencies in orders
    // For example, orders that are stuck in certain statuses
    console.log("Synchronizing orders...");
    
    // For now, we'll just fetch all pending orders to ensure they're all visible
    const { error } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "pending");
      
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error("Error synchronizing orders:", error);
    toast.error("Failed to synchronize orders");
    return false;
  }
};
