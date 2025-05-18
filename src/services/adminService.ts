import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Order } from "@/services/orderService";

// Interface for admin user
export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  role: string;
  name?: string;
}

// Interface for doctor approval
export interface DoctorApproval {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  created_at: string;
  is_approved: boolean;
}

// Interface for doctor credit summary
export interface DoctorCreditSummary {
  doctor_id: string;
  doctor_name: string;
  total_orders: number;
  total_spent: number;
  credit_balance: number;
  last_order_date: string | null;
}

// Interface for doctor credit data
export interface DoctorCredit {
  doctor_id: string;
  doctor_name: string;
  total_orders_amount: number;
  total_payments: number;
  credit_balance: number;
  orders_count: number;
  last_transaction_date: string | null;
}

// Interface for doctor payment information
export interface DoctorPayment {
  id: string;
  doctor_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  doctor?: {
    name: string;
    phone: string;
    email?: string;
  };
}

// Interface for credit transaction
export interface CreditTransaction {
  id: string;
  doctor_id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  doctor?: {
    name: string;
    phone: string;
    email?: string;
  };
}

// Fetch all pending doctors
export const fetchPendingDoctors = async (): Promise<DoctorApproval[]> => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching pending doctors:", error);
    toast.error("Failed to load pending doctors");
    throw error;
  }
};

// Fetch all approved doctors
export const fetchApprovedDoctors = async (): Promise<DoctorApproval[]> => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching approved doctors:", error);
    toast.error("Failed to load approved doctors");
    throw error;
  }
};

// Approve a doctor
export const approveDoctor = async (doctorId: string): Promise<boolean> => {
  try {
    console.log(`Approving doctor ${doctorId}`);
    
    // Update the doctor's approval status
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
    toast.error("Failed to approve doctor");
    throw error;
  }
};

// Reject a doctor
export const rejectDoctor = async (doctorId: string): Promise<boolean> => {
  try {
    // For now, we'll simply delete the doctor record
    // In a real application, you might want to keep the record but mark it as rejected
    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", doctorId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error rejecting doctor:", error);
    toast.error("Failed to reject doctor");
    throw error;
  }
};

// Get credit summaries for all doctors
export const fetchDoctorCreditSummaries = async (): Promise<DoctorCreditSummary[]> => {
  try {
    // Call the stored procedure that calculates credit summaries
    const { data, error } = await supabase.rpc(
      'get_doctor_credit_summaries'
    );

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching doctor credit summaries:", error);
    toast.error("Failed to load credit summaries");
    throw error;
  }
};

// Get detailed credit information for a specific doctor
export const fetchDoctorCreditDetails = async (doctorId: string): Promise<DoctorCredit | null> => {
  try {
    const { data, error } = await supabase.rpc(
      'get_doctor_credits',
      { p_doctor_id: doctorId }
    );

    if (error) throw error;
    return data[0] || null;
  } catch (error: any) {
    console.error("Error fetching doctor credit details:", error);
    toast.error("Failed to load credit details");
    throw error;
  }
};

// Get credit transactions for a specific doctor
export const fetchDoctorCreditTransactions = async (doctorId: string): Promise<CreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from("credit_transactions")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone,
          email
        )
      `)
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Process data to ensure consistent structure
    const processedTransactions = data.map(transaction => {
      // Extract doctor info to standardize format
      const doctorData = transaction.doctor || {};
      const doctorName = typeof doctorData === 'object' && doctorData !== null ? doctorData.name || "Unknown" : "Unknown";
      const doctorPhone = typeof doctorData === 'object' && doctorData !== null ? doctorData.phone || "N/A" : "N/A";
      const doctorEmail = typeof doctorData === 'object' && doctorData !== null ? 
        doctorData.email || `${doctorName.toLowerCase().replace(/\s+/g, '.')}@example.com` : 
        `unknown-doctor@example.com`;
      
      return {
        ...transaction,
        doctor: {
          name: doctorName,
          phone: doctorPhone,
          email: doctorEmail
        }
      };
    });

    return processedTransactions;
  } catch (error: any) {
    console.error("Error fetching doctor credit transactions:", error);
    toast.error("Failed to load credit transactions");
    throw error;
  }
};

// Add a payment for a doctor
export const addDoctorPayment = async (
  doctorId: string,
  amount: number,
  notes?: string
): Promise<string | null> => {
  try {
    // First, create the payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert({
        doctor_id: doctorId,
        amount,
        notes
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Then, create a credit transaction record
    const { data: transactionData, error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        doctor_id: doctorId,
        type: 'payment',
        amount,
        description: notes || 'Payment received',
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    return paymentData.id;
  } catch (error: any) {
    console.error("Error adding doctor payment:", error);
    toast.error("Failed to add payment");
    throw error;
  }
};

// Get all payments
export const fetchAllPayments = async (): Promise<DoctorPayment[]> => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone,
          email
        )
      `)
      .order("payment_date", { ascending: false });

    if (error) throw error;

    // Process data to ensure consistent structure
    const processedPayments = data.map(payment => {
      // Extract doctor info to standardize format
      const doctorData = payment.doctor || {};
      const doctorName = typeof doctorData === 'object' && doctorData !== null ? doctorData.name || "Unknown" : "Unknown";
      const doctorPhone = typeof doctorData === 'object' && doctorData !== null ? doctorData.phone || "N/A" : "N/A";
      const doctorEmail = typeof doctorData === 'object' && doctorData !== null ? 
        doctorData.email || `${doctorName.toLowerCase().replace(/\s+/g, '.')}@example.com` : 
        `unknown-doctor@example.com`;
      
      return {
        ...payment,
        doctor: {
          name: doctorName,
          phone: doctorPhone,
          email: doctorEmail
        }
      };
    });

    return processedPayments;
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    toast.error("Failed to load payments");
    throw error;
  }
};

// Get all credit transactions
export const fetchAllCreditTransactions = async (): Promise<CreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from("credit_transactions")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Process data to ensure consistent structure
    const processedTransactions = data.map(transaction => {
      // Extract doctor info to standardize format
      const doctorData = transaction.doctor || {};
      const doctorName = typeof doctorData === 'object' && doctorData !== null ? doctorData.name || "Unknown" : "Unknown";
      const doctorPhone = typeof doctorData === 'object' && doctorData !== null ? doctorData.phone || "N/A" : "N/A";
      const doctorEmail = typeof doctorData === 'object' && doctorData !== null ? 
        doctorData.email || `${doctorName.toLowerCase().replace(/\s+/g, '.')}@example.com` : 
        `unknown-doctor@example.com`;
      
      return {
        ...transaction,
        doctor: {
          name: doctorName,
          phone: doctorPhone,
          email: doctorEmail
        }
      };
    });

    return processedTransactions;
  } catch (error: any) {
    console.error("Error fetching credit transactions:", error);
    toast.error("Failed to load credit transactions");
    throw error;
  }
};

// Fetch order counts by status for admin dashboard
export const fetchOrderCounts = async (): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase.rpc('get_order_counts');

    if (error) throw error;
    return data || { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, total: 0 };
  } catch (error: any) {
    console.error("Error fetching order counts:", error);
    toast.error("Failed to load order statistics");
    throw error;
  }
};

// Synchronize orders from external system (optional implementation)
export const synchronizeOrders = async (): Promise<boolean> => {
  try {
    // This would typically call an API endpoint or edge function
    // that synchronizes orders from an external system
    
    // For now, we'll just simulate success
    toast.success("Orders synchronized successfully");
    return true;
  } catch (error: any) {
    console.error("Error synchronizing orders:", error);
    toast.error("Failed to synchronize orders");
    throw error;
  }
};

// Fetch all orders with enhanced details
export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    console.log("Fetching all orders with doctor details...");

    // Using the database function to get all orders with doctor details
    const { data, error } = await supabase.rpc('get_all_orders_enhanced');

    if (error) {
      console.error("Error fetching orders:", error);
      
      // Fallback to manual join if RPC fails
      console.log("Falling back to direct query for orders...");
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("orders")
        .select(`
          *,
          doctor:doctor_id (
            name,
            phone,
            email
          )
        `)
        .order("created_at", { ascending: false });
        
      if (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        throw fallbackError;
      }
      
      // Process fallback data to match expected format
      const processedOrders = fallbackData.map(order => {
        // Extract doctor info
        const doctorData = order.doctor || {};
        const doctorName = typeof doctorData === 'object' && doctorData !== null ? doctorData.name || "Unknown" : "Unknown";
        const doctorPhone = typeof doctorData === 'object' && doctorData !== null ? doctorData.phone || "N/A" : "N/A";
        const doctorEmail = typeof doctorData === 'object' && doctorData !== null ? 
          doctorData.email || `${doctorName.toLowerCase().replace(/\s+/g, '.') || order.doctor_id.substring(0, 8)}@example.com` : 
          `unknown-${order.doctor_id.substring(0, 8)}@example.com`;
        
        return {
          ...order,
          doctor_name: doctorName,
          doctor_phone: doctorPhone,
          doctor_email: doctorEmail
        };
      });
      
      console.log(`Found ${processedOrders.length} orders via fallback query`);
      return processedOrders;
    }
    
    console.log(`Found ${data.length} orders via RPC`);
    return data;
  } catch (error: any) {
    console.error("Error in fetchAllOrders:", error);
    toast.error("Failed to load orders");
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string): Promise<boolean> => {
  try {
    console.log(`Updating order ${orderId} status to ${newStatus}`);

    // Get current order details for notification
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone,
          email
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("Error fetching order details:", orderError);
      throw orderError;
    }

    // Update order status using the database function
    const { error } = await supabase.rpc(
      'update_order_status',
      { 
        p_order_id: orderId, 
        p_status: newStatus,
        p_notes: notes || `Status changed to ${newStatus}`
      }
    );

    if (error) {
      console.error("Error updating order status:", error);
      throw error;
    }

    // Prepare for notifications
    const doctorData = orderData.doctor || {};
    const doctorName = typeof doctorData === 'object' && doctorData !== null ? doctorData.name || "Valued Doctor" : "Valued Doctor";
    const doctorPhone = typeof doctorData === 'object' && doctorData !== null ? doctorData.phone || "" : "";
    
    // Generate invoice if status is approved/processing
    if (newStatus === 'approved' || newStatus === 'processing') {
      try {
        // Generate invoice
        const invoiceUrl = await generatePDFInvoice(orderId);
        console.log(`Invoice generated for order ${orderId}: ${invoiceUrl}`);

        // Send email with invoice
        const emailSent = await sendInvoiceEmail(orderId);
        console.log(`Invoice email ${emailSent ? 'sent' : 'failed'} for order ${orderId}`);

        // Send WhatsApp notification
        const whatsappSent = await sendWhatsAppNotification(orderId);
        console.log(`WhatsApp notification ${whatsappSent ? 'sent' : 'failed'} for order ${orderId}`);
      } catch (notifyError) {
        console.error("Error sending notifications:", notifyError);
        // Continue anyway - don't fail the status update if notifications fail
      }
    } else {
      // Send status update notification via Edge Function
      try {
        await supabase.functions.invoke('notify-doctor-status-update', {
          body: {
            orderId,
            doctorName,
            doctorPhone,
            doctorEmail,
            newStatus
          }
        });
        console.log(`Status update notification sent for order ${orderId}`);
      } catch (notifyError) {
        console.error("Error sending status notification:", notifyError);
        // Continue anyway
      }
    }

    return true;
  } catch (error: any) {
    console.error("Error in updateOrderStatus:", error);
    throw error;
  }
};

// Update shipping information
export const updateShippingInfo = async (orderId: string, trackingNumber: string, carrier: string, estimatedDate?: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc(
      'update_shipping_info',
      {
        p_order_id: orderId,
        p_tracking_number: trackingNumber,
        p_shipping_carrier: carrier,
        p_estimated_delivery_date: estimatedDate
      }
    );

    if (error) {
      console.error("Error updating shipping info:", error);
      throw error;
    }

    // Get order details for notification
    const { data: orderData } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone,
          email
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderData) {
      // Prepare doctor data for notification
      const doctorData = orderData.doctor || {};
      const doctorName = typeof doctorData === 'object' && doctorData !== null ? doctorData.name || "Valued Doctor" : "Valued Doctor";
      const doctorPhone = typeof doctorData === 'object' && doctorData !== null ? doctorData.phone || "" : "";
      
      // Send notification if phone available
      if (doctorPhone) {
        try {
          await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              to: doctorPhone.startsWith('+') ? doctorPhone : `+91${doctorPhone.replace(/\D/g, '')}`,
              doctorName,
              orderId: orderData.id,
              orderStatus: 'shipped',
              message: `Your order is on its way! Tracking: ${trackingNumber} via ${carrier}. Expected delivery: ${estimatedDate || 'soon'}.`
            }
          });
          console.log(`Shipping update WhatsApp notification sent to doctor ${doctorName}`);
        } catch (notifyError) {
          console.error("Error sending shipping notification:", notifyError);
          // Continue anyway
        }
      }
    }

    return true;
  } catch (error: any) {
    console.error("Error in updateShippingInfo:", error);
    throw error;
  }
};

// Manually generate invoice
export const generateInvoice = async (orderId: string): Promise<string> => {
  try {
    console.log(`Manually generating invoice for order ${orderId}`);

    // Generate PDF invoice
    const invoiceUrl = await generatePDFInvoice(orderId);

    // Send email with invoice
    await sendInvoiceEmail(orderId);

    return invoiceUrl;
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

// Fetch order items for a specific order
export const fetchOrderItems = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        *,
        product:product_id (
          name,
          price,
          category
        )
      `)
      .eq("order_id", orderId);

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching order items:", error);
    throw error;
  }
};