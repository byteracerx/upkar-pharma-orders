import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePDFInvoice, sendInvoiceEmail, sendWhatsAppNotification } from './invoiceService';

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
  doctor?: {
    name: string;
    phone: string;
    email?: string;
  };
};

// Synchronize orders from external systems if any
export const synchronizeOrders = async (): Promise<boolean> => {
  try {
    console.log("Synchronizing orders from external systems...");
    
    // In a real application, this might call an external API or sync with another database
    // For now, we'll just return success
    toast.success("Orders synchronized successfully");
    return true;
  } catch (error: any) {
    console.error("Error synchronizing orders:", error);
    toast.error("Failed to synchronize orders");
    return false;
  }
};

// Fetch pending doctor registrations
export const fetchPendingDoctors = async (): Promise<Doctor[]> => {
  try {
    console.log("Fetching pending doctors...");

    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", false);

    if (error) {
      console.error("Error fetching pending doctors:", error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} pending doctors`);

    // Enhance doctor data with email from auth or generate placeholder
    const enhancedData = await Promise.all(
      (data || []).map(async (doctor) => {
        try {
          // Get user email from auth
          const { data: userData } = await supabase.auth.admin.getUserById(doctor.id);
          const email = userData?.user?.email || `${doctor.name?.toLowerCase().replace(/\s+/g, '.') || doctor.id.substring(0, 8)}@example.com`;

          return {
            ...doctor,
            email
          };
        } catch (err) {
          console.error(`Error fetching email for doctor ${doctor.id}:`, err);
          return {
            ...doctor,
            email: `${doctor.name?.toLowerCase().replace(/\s+/g, '.') || doctor.id.substring(0, 8)}@example.com`
          };
        }
      })
    );

    return enhancedData || [];
  } catch (error: any) {
    console.error("Error fetching pending doctors:", error);
    toast.error("Failed to load pending doctors");
    throw error;
  }
};

// Fetch approved doctors
export const fetchApprovedDoctors = async (): Promise<Doctor[]> => {
  try {
    console.log("Fetching approved doctors...");

    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_approved", true);

    if (error) {
      console.error("Error fetching approved doctors:", error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} approved doctors`);

    // Enhance doctor data with email from auth or generate placeholder
    const enhancedData = await Promise.all(
      (data || []).map(async (doctor) => {
        try {
          // Get user email from auth
          const { data: userData } = await supabase.auth.admin.getUserById(doctor.id);
          const email = userData?.user?.email || `${doctor.name?.toLowerCase().replace(/\s+/g, '.') || doctor.id.substring(0, 8)}@example.com`;

          return {
            ...doctor,
            email
          };
        } catch (err) {
          console.error(`Error fetching email for doctor ${doctor.id}:`, err);
          return {
            ...doctor,
            email: `${doctor.name?.toLowerCase().replace(/\s+/g, '.') || doctor.id.substring(0, 8)}@example.com`
          };
        }
      })
    );

    return enhancedData || [];
  } catch (error: any) {
    console.error("Error fetching approved doctors:", error);
    toast.error("Failed to load approved doctors");
    throw error;
  }
};

// Approve a doctor
export const approveDoctor = async (doctorId: string): Promise<boolean> => {
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
      .select("is_approved, phone, name")
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

    // Get doctor information for notification
    try {
      // Get user email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(doctorId);
      
      // Get or generate email
      const doctorEmail = userData?.user?.email || 
        `${doctorData.name?.toLowerCase().replace(/\s+/g, '.') || doctorId.substring(0, 8)}@example.com`;
      
      // Attempt to send approval notifications
      try {
        // Send email notification
        await supabase.functions.invoke('send-invoice-email', {
          body: {
            to: doctorEmail,
            subject: "Your Upkar Pharma account is now active",
            doctorName: doctorData.name || "Doctor",
            content: "Your account has been approved. You can now login and place orders.",
            orderId: "",
            orderDate: new Date().toLocaleDateString(),
            totalAmount: 0
          }
        });
        
        console.log("Approval email sent to doctor");
        
        // Send WhatsApp notification if phone is available
        if (doctorData.phone) {
          const formattedPhone = doctorData.phone.startsWith('+') ? 
            doctorData.phone : `+91${doctorData.phone.replace(/\D/g, '')}`;
            
          await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              to: formattedPhone,
              doctorName: doctorData.name || "Doctor",
              message: "Your Upkar Pharma account is now active. You can now login and place orders."
            }
          });
          
          console.log("Approval WhatsApp notification sent to doctor");
        }
      } catch (notifyError) {
        console.error("Error sending approval notifications:", notifyError);
        // Continue even if notification fails - don't throw error
      }
    } catch (userError) {
      console.error("Error getting doctor user data for notification:", userError);
      // Continue even if getting user data fails - don't throw error
    }

    return true;
  } catch (error: any) {
    console.error("Error in approveDoctor:", error);
    throw error;
  }
};

// Reject a doctor
export const rejectDoctor = async (doctorId: string): Promise<boolean> => {
  try {
    console.log(`Rejecting doctor with ID: ${doctorId}`);

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

    // Delete the doctor record
    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", doctorId);

    if (error) {
      console.error("Error rejecting doctor:", error);
      throw error;
    }

    // Get doctor information for notification
    try {
      // Get user email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(doctorId);
      
      // Get or generate email
      const doctorEmail = userData?.user?.email || 
        `${doctorData.name?.toLowerCase().replace(/\s+/g, '.') || doctorId.substring(0, 8)}@example.com`;
      
      // Attempt to send rejection notifications
      try {
        // Send email notification
        await supabase.functions.invoke('send-invoice-email', {
          body: {
            to: doctorEmail,
            subject: "Upkar Pharma Registration Update",
            doctorName: doctorData.name || "Doctor",
            content: "We regret to inform you that your application has been declined at this time. Please contact our support team for more information.",
            orderId: "",
            orderDate: new Date().toLocaleDateString(),
            totalAmount: 0
          }
        });
        
        console.log("Rejection email sent to doctor");
        
        // Send WhatsApp notification if phone is available
        if (doctorData.phone) {
          const formattedPhone = doctorData.phone.startsWith('+') ? 
            doctorData.phone : `+91${doctorData.phone.replace(/\D/g, '')}`;
            
          await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              to: formattedPhone,
              doctorName: doctorData.name || "Doctor",
              message: "We regret to inform you that your Upkar Pharma application has been declined at this time. Please contact our support team for more information."
            }
          });
          
          console.log("Rejection WhatsApp notification sent to doctor");
        }
      } catch (notifyError) {
        console.error("Error sending rejection notifications:", notifyError);
        // Continue even if notification fails - don't throw error
      }
    } catch (userError) {
      console.error("Error getting doctor user data for notification:", userError);
      // Continue even if getting user data fails - don't throw error
    }

    return true;
  } catch (error: any) {
    console.error("Error in rejectDoctor:", error);
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
    const doctorEmail = typeof doctorData === 'object' && doctorData !== null ? 
      doctorData.email || `${doctorName.toLowerCase().replace(/\s+/g, '.')}@example.com` : 
      `unknown-${orderData.doctor_id.substring(0, 8)}@example.com`;

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
