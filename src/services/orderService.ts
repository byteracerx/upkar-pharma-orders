
import { supabase } from "@/integrations/supabase/client";

export interface Order {
  id: string;
  doctor_id: string;
  doctor?: {
    name: string;
    phone: string;
    email: string;
  };
  doctor_name?: string;
  doctor_phone?: string;
  doctor_email?: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  shipping_address?: string;
  billing_address?: string;
  payment_method?: string;
  payment_status?: string;
  tracking_number?: string;
  shipping_carrier?: string;
  invoice_number?: string;
  invoice_generated?: boolean;
  invoice_url?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: {
    name: string;
    price: number;
    category?: string;
  };
  quantity: number;
  price_per_unit: number;
  total_price: number;
}

// Fetch all orders
export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
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

    if (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }

    // Transform the data to handle missing fields
    const orders = data.map(order => {
      const doctorData = order.doctor || {};
      
      return {
        ...order,
        doctor_name: typeof doctorData === 'object' ? doctorData.name || "Unknown" : "Unknown",
        doctor_phone: typeof doctorData === 'object' ? doctorData.phone || "N/A" : "N/A",
        doctor_email: typeof doctorData === 'object' ? doctorData.email || 
          `${(doctorData.name || "unknown").toLowerCase().replace(/\s+/g, '.')}@example.com` : 
          `unknown-${order.doctor_id.substring(0, 8)}@example.com`
      };
    });

    return orders;
  } catch (error) {
    console.error("Error in fetchOrders:", error);
    throw error;
  }
};

// Fetch a specific order by ID
export const fetchOrderById = async (id: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone,
          email
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Order not found
        return null;
      }
      console.error("Error fetching order:", error);
      throw error;
    }

    // Transform the doctor data to handle missing fields
    const doctorData = data.doctor || {};
    
    return {
      ...data,
      doctor_name: typeof doctorData === 'object' ? doctorData.name || "Unknown" : "Unknown",
      doctor_phone: typeof doctorData === 'object' ? doctorData.phone || "N/A" : "N/A",
      doctor_email: typeof doctorData === 'object' ? doctorData.email || 
        `${(doctorData.name || "unknown").toLowerCase().replace(/\s+/g, '.')}@example.com` : 
        `unknown-${data.doctor_id.substring(0, 8)}@example.com`
    };
  } catch (error) {
    console.error("Error in fetchOrderById:", error);
    throw error;
  }
};

// Fetch order items for a specific order
export const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
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

    if (error) {
      console.error("Error fetching order items:", error);
      throw error;
    }

    return data as OrderItem[];
  } catch (error) {
    console.error("Error in fetchOrderItems:", error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: string, notes?: string): Promise<boolean> => {
  try {
    // Use the update_order_status database function
    const { error } = await supabase.rpc("update_order_status", {
      p_order_id: orderId,
      p_status: status,
      p_notes: notes || `Status changed to ${status}`
    });

    if (error) {
      console.error("Error updating order status:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    throw error;
  }
};

// Get order status history
export const getOrderStatusHistory = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching order status history:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getOrderStatusHistory:", error);
    throw error;
  }
};

// Update shipping information
export const updateShippingInfo = async (
  orderId: string,
  trackingNumber: string,
  shippingCarrier: string,
  estimatedDeliveryDate?: string
): Promise<boolean> => {
  try {
    // Use the update_shipping_info database function
    const { error } = await supabase.rpc("update_shipping_info", {
      p_order_id: orderId,
      p_tracking_number: trackingNumber,
      p_shipping_carrier: shippingCarrier,
      p_estimated_delivery_date: estimatedDeliveryDate
    });

    if (error) {
      console.error("Error updating shipping info:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in updateShippingInfo:", error);
    throw error;
  }
};

// Generate invoice for order
export const generateInvoice = async (orderId: string): Promise<boolean> => {
  try {
    // Use the generate_invoice database function
    const { error } = await supabase.rpc("generate_invoice", {
      p_order_id: orderId
    });

    if (error) {
      console.error("Error generating invoice:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in generateInvoice:", error);
    throw error;
  }
};

// Mark order as delivered
export const markOrderDelivered = async (orderId: string): Promise<boolean> => {
  try {
    // Update the order status to 'delivered'
    return await updateOrderStatus(orderId, "delivered", "Order marked as delivered");
  } catch (error) {
    console.error("Error in markOrderDelivered:", error);
    throw error;
  }
};
