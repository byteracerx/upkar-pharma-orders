
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
  notes?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: {
    name: string;
    price: number;
    category?: string;
    image_url?: string;
  };
  quantity: number;
  price_per_unit: number;
  total_price: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  admin_name?: string;
}

export interface OrderCommunication {
  id: string;
  order_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  read: boolean;
  read_at?: string;
}

export interface Return {
  id: string;
  order_id: string;
  doctor_id: string;
  reason: string;
  status: string;
  amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  processed_by?: string;
  items?: ReturnItem[];
}

export interface ReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  reason?: string;
  condition?: string;
  product?: {
    name: string;
    price: number;
    category?: string;
  };
}

export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  communications?: OrderCommunication[];
  returns?: Return[];
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

// Alias for fetchOrders (to match imports)
export const fetchAllOrders = fetchOrders;

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
          category,
          image_url
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
export const updateOrderStatus = async (
  orderId: string, 
  status: string, 
  notes?: string,
  adminId?: string  
): Promise<boolean> => {
  try {
    // Use the update_order_status database function
    const { error } = await supabase.rpc("update_order_status", {
      p_order_id: orderId,
      p_status: status,
      p_notes: notes || `Status changed to ${status}`,
      p_admin_id: adminId
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
export const getOrderStatusHistory = async (orderId: string): Promise<OrderStatusHistory[]> => {
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

// Fetch order details (comprehensive data about an order)
export const fetchOrderDetails = async (orderId: string): Promise<OrderDetails> => {
  try {
    // Fetch basic order information
    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Fetch order items
    const items = await fetchOrderItems(orderId);

    // Fetch order status history
    const statusHistory = await getOrderStatusHistory(orderId);

    // Fetch order communications
    const { data: communications, error: commError } = await supabase
      .from("order_communications")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (commError) {
      console.error("Error fetching order communications:", commError);
      throw commError;
    }

    // Fetch returns if any
    const { data: returns, error: returnsError } = await supabase
      .from("returns")
      .select(`
        *,
        items:return_items (
          *,
          product:product_id (
            name,
            price,
            category
          )
        )
      `)
      .eq("order_id", orderId);

    if (returnsError) {
      console.error("Error fetching returns:", returnsError);
      throw returnsError;
    }

    return {
      order,
      items,
      statusHistory,
      communications: communications || [],
      returns: returns || []
    };
  } catch (error) {
    console.error("Error in fetchOrderDetails:", error);
    throw error;
  }
};

// Add communication to an order
export const addOrderCommunication = async (
  orderId: string,
  senderId: string,
  recipientId: string,
  message: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("order_communications")
      .insert({
        order_id: orderId,
        sender_id: senderId,
        recipient_id: recipientId,
        message,
        read: false
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error adding order communication:", error);
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.error("Error in addOrderCommunication:", error);
    throw error;
  }
};

// Update return status
export const updateReturnStatus = async (
  returnId: string,
  status: string,
  processedBy?: string,
  notes?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("returns")
      .update({
        status,
        processed_by: processedBy,
        notes: notes || `Status updated to ${status}`,
        updated_at: new Date().toISOString()
      })
      .eq("id", returnId);

    if (error) {
      console.error("Error updating return status:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in updateReturnStatus:", error);
    throw error;
  }
};

// Process a return request
export const processReturn = async (
  orderId: string,
  reason: string,
  items: any[],
  doctorId: string
): Promise<boolean> => {
  try {
    // Calculate total return amount
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
    
    // Insert return record
    const { data: returnData, error: returnError } = await supabase
      .from("returns")
      .insert({
        order_id: orderId,
        doctor_id: doctorId,
        reason,
        amount: totalAmount,
        status: "pending"
      })
      .select("id")
      .single();

    if (returnError) {
      console.error("Error creating return:", returnError);
      throw returnError;
    }

    // Insert return items
    const returnId = returnData.id;
    const returnItems = items.map(item => ({
      return_id: returnId,
      product_id: item.product_id,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      total_price: item.total_price,
      reason: item.reason || reason
    }));

    const { error: itemsError } = await supabase
      .from("return_items")
      .insert(returnItems);

    if (itemsError) {
      console.error("Error creating return items:", itemsError);
      throw itemsError;
    }

    return true;
  } catch (error) {
    console.error("Error in processReturn:", error);
    throw error;
  }
};

// Reorder a previous order
export const reorderPreviousOrder = async (orderId: string): Promise<string | null> => {
  try {
    // Fetch the original order
    const originalOrder = await fetchOrderById(orderId);
    if (!originalOrder) {
      throw new Error(`Original order ${orderId} not found`);
    }

    // Fetch the original order items
    const originalItems = await fetchOrderItems(orderId);
    if (originalItems.length === 0) {
      throw new Error(`No items found for order ${orderId}`);
    }

    // Create a new order
    const { data: newOrderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        doctor_id: originalOrder.doctor_id,
        status: "pending",
        total_amount: originalOrder.total_amount,
        shipping_address: originalOrder.shipping_address,
        billing_address: originalOrder.billing_address,
        payment_method: originalOrder.payment_method,
        notes: `Reordered from ${originalOrder.invoice_number || orderId}`
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Error creating new order:", orderError);
      throw orderError;
    }

    // Create new order items
    const newOrderItems = originalItems.map(item => ({
      order_id: newOrderData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      total_price: item.total_price
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(newOrderItems);

    if (itemsError) {
      console.error("Error creating new order items:", itemsError);
      throw itemsError;
    }

    return newOrderData.id;
  } catch (error) {
    console.error("Error in reorderPreviousOrder:", error);
    throw error;
  }
};
