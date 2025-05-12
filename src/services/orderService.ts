
import { supabase } from "@/integrations/supabase/client";

export interface Order {
  id: string;
  doctor_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    name: string;
    phone: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product?: {
    name: string;
    image_url: string;
  };
}

// Fetch orders for a doctor
export const fetchDoctorOrders = async (doctorId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching doctor orders:", error);
      throw error;
    }
    
    return data as Order[];
  } catch (error) {
    console.error("Error in fetchDoctorOrders:", error);
    throw error;
  }
};

// Fetch order details including items
export const fetchOrderDetails = async (orderId: string): Promise<{ order: Order; items: OrderItem[] }> => {
  try {
    // Fetch the order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    
    if (orderError) {
      console.error("Error fetching order:", orderError);
      throw orderError;
    }
    
    // Fetch the order items with their products
    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        product:product_id (
          name,
          image_url
        )
      `)
      .eq("order_id", orderId);
    
    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      throw itemsError;
    }
    
    return {
      order: orderData as Order,
      items: itemsData as OrderItem[]
    };
  } catch (error) {
    console.error("Error in fetchOrderDetails:", error);
    throw error;
  }
};

// Fetch all orders (for admin)
export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
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
      console.error("Error fetching all orders:", error);
      throw error;
    }
    
    return data as Order[];
  } catch (error) {
    console.error("Error in fetchAllOrders:", error);
    throw error;
  }
};

// Update order status (for admin)
export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
  try {
    // First, get the order details to get doctor information
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone
        )
      `)
      .eq("id", orderId)
      .single();
    
    if (orderError || !orderData) {
      console.error("Error fetching order details:", orderError);
      return false;
    }
    
    // Update the order status
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    
    if (error) {
      console.error("Error updating order status:", error);
      return false;
    }
    
    // If status changed to 'accepted', generate invoice
    if (newStatus === 'accepted') {
      try {
        // Call edge function to generate invoice and send email
        await supabase.functions.invoke('generate-invoice', {
          body: { orderId }
        });
      } catch (invoiceError) {
        console.error("Error generating invoice:", invoiceError);
        // We don't fail the status update just because invoice generation failed
      }
    }
    
    // Notify doctor about status update
    try {
      await supabase.functions.invoke('notify-doctor-status-update', {
        body: {
          orderId,
          doctorName: orderData.doctor?.name,
          doctorPhone: orderData.doctor?.phone,
          newStatus,
          // We don't have email in the doctor object from this query
          doctorEmail: null
        }
      });
    } catch (notifyError) {
      console.error("Error notifying doctor:", notifyError);
      // We don't fail the status update just because notification failed
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return false;
  }
};
