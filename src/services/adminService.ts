import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePDFInvoice, sendInvoiceEmail, sendWhatsAppNotification } from './invoiceService';

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

    // Enhance doctor data with email from auth
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
          return doctor;
        }
      })
    );

    return enhancedData || [];
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

    // Enhance doctor data with email from auth
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
          return doctor;
        }
      })
    );

    return enhancedData || [];
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

    // Get user email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctorId);
    const userEmail = userError ? null : userData?.user?.email;

    // Send email notification
    try {
      if (userEmail) {
        await supabase.functions.invoke('send-doctor-approval-email', {
          body: {
            to: userEmail,
            doctorName: verifyData.name,
            subject: "Your Upkar Pharma Account is Now Active"
          }
        });
        console.log(`Approval email sent to ${userEmail}`);
      }
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Don't fail the approval if email sending fails
    }

    // Send WhatsApp notification
    try {
      if (verifyData.phone) {
        // Format phone number for WhatsApp (add +91 if not present)
        const phoneNumber = verifyData.phone.startsWith('+')
          ? verifyData.phone
          : `+91${verifyData.phone.replace(/\D/g, '')}`;

        await supabase.functions.invoke('send-whatsapp-notification', {
          body: {
            to: phoneNumber,
            doctorName: verifyData.name,
            messageType: 'account_approval',
            message: "Your Upkar Pharma account is now active. You can now place orders through our platform."
          }
        });
        console.log(`Approval WhatsApp sent to ${phoneNumber}`);
      }
    } catch (whatsappError) {
      console.error("Error sending approval WhatsApp:", whatsappError);
      // Don't fail the approval if WhatsApp sending fails
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
          phone,
          email
        ),
        order_items (
          id,
          product_id,
          quantity,
          price_per_unit,
          total_price,
          product:product_id (
            name,
            category
          )
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
    const processedOrders = await Promise.all(data.map(async (order) => {
      // Get user email from auth if not available in doctor record
      let doctorEmail = '';
      let doctorName = 'Unknown';
      let doctorPhone = 'N/A';

      // Get doctor info safely
      const doctor = order.doctor as any;
      if (doctor && typeof doctor === 'object') {
        doctorName = doctor.name || 'Unknown';
        doctorPhone = doctor.phone || 'N/A';
        doctorEmail = doctor.email || '';
      }

      if (!doctorEmail) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(order.doctor_id);
          doctorEmail = userData?.user?.email || '';
        } catch (err) {
          console.error(`Error fetching email for doctor ${order.doctor_id}:`, err);
        }
      }

      // Calculate total items and create product summary
      const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
      const totalItems = orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

      const productSummary = orderItems.map(item => {
        const productName = item.product && typeof item.product === 'object' ?
          (item.product.name || 'Unknown') : 'Unknown';
        return `${productName} (${item.quantity || 0})`;
      }).join(', ');

      return {
        ...order,
        doctor_name: doctorName,
        doctor_phone: doctorPhone,
        doctor_email: doctorEmail || `${doctorName.toLowerCase().replace(/\s+/g, '.') || order.doctor_id?.substring(0, 8)}@example.com`,
        total_items: totalItems,
        product_summary: productSummary
      };
    }));

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

    // If the order is approved (status = processing or delivered), generate an invoice automatically
    if (newStatus === 'processing' || newStatus === 'delivered') {
      try {
        console.log(`Order ${orderId} approved. Generating invoice automatically...`);
        await generateInvoice(orderId);
      } catch (invoiceError) {
        console.error("Error auto-generating invoice:", invoiceError);
        // Don't fail the status update if invoice generation fails
      }
    }

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
    // Generate PDF invoice and get the URL
    const invoiceUrl = await generatePDFInvoice(orderId);
    console.log(`Invoice generated with URL: ${invoiceUrl}`);

    // Get the invoice number from the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("invoice_number")
      .eq("id", orderId)
      .single();

    if (orderError) {
      throw orderError;
    }

    // Add status history entry
    await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: 'invoice_generated',
        notes: `Invoice generated: ${order.invoice_number}, URL: ${invoiceUrl}`
      });

    // Send email with invoice
    try {
      await sendInvoiceEmail(orderId);
    } catch (emailError) {
      console.error("Error sending invoice email:", emailError);
      // Don't fail the whole process if email fails
    }

    // Send WhatsApp notification
    try {
      await sendWhatsAppNotification(orderId);
    } catch (whatsappError) {
      console.error("Error sending WhatsApp notification:", whatsappError);
      // Don't fail the whole process if WhatsApp fails
    }

    return invoiceUrl;
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
