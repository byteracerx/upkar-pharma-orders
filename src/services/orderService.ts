
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product: {
    name: string;
    category: string | null;
    price?: number;
    image_url?: string;
  };
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

export interface ShippingInfo {
  tracking_number?: string;
  shipping_carrier?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
}

export interface OrderReturn {
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
}

export interface OrderDetails {
  order: {
    id: string;
    doctor_id: string;
    total_amount: number;
    status: string;
    payment_status: string;
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
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  communications: OrderCommunication[];
  shippingInfo: ShippingInfo;
  returns: OrderReturn[];
}

export interface Order {
  id: string;
  doctor_id: string;
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
}

// Fetch all orders for a doctor
export const fetchDoctorOrders = async (doctorId: string): Promise<Order[]> => {
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
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Process data to ensure consistent structure
    const processedOrders = data.map(order => {
      // Extract doctor info to standardize format
      const doctorData = order.doctor || {};
      const doctorName = typeof doctorData === 'object' && doctorData !== null ? doctorData.name || "Unknown" : "Unknown";
      const doctorPhone = typeof doctorData === 'object' && doctorData !== null ? doctorData.phone || "N/A" : "N/A";
      const doctorEmail = typeof doctorData === 'object' && doctorData !== null ? 
        doctorData.email || `${doctorName.toLowerCase().replace(/\s+/g, '.')}@example.com` : 
        `unknown-${order.doctor_id.substring(0, 8)}@example.com`;
      
      return {
        ...order,
        doctor: {
          name: doctorName,
          phone: doctorPhone,
          email: doctorEmail
        }
      };
    });

    return processedOrders;
  } catch (error: any) {
    console.error("Error fetching doctor orders:", error);
    toast.error("Failed to load orders");
    throw error;
  }
};

// Fetch details for a specific order
export const fetchOrderDetails = async (orderId: string): Promise<OrderDetails> => {
  try {
    // Fetch order data
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

    if (orderError) throw orderError;

    // Fetch order items
    const { data: itemsData, error: itemsError } = await supabase
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

    if (itemsError) throw itemsError;

    // Fetch status history
    const { data: statusData, error: statusError } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (statusError) throw statusError;

    // Fetch order communications
    const { data: communicationsData, error: communicationsError } = await supabase
      .from("order_communications")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (communicationsError) throw communicationsError;

    // Fetch return requests
    const { data: returnsData, error: returnsError } = await supabase
      .from("returns")
      .select("*")
      .eq("order_id", orderId);

    if (returnsError) throw returnsError;

    // Extract doctor info to standardize format
    const doctorData = orderData.doctor || {};
    const doctorName = typeof doctorData === 'object' && doctorData !== null ? doctorData.name || "Unknown" : "Unknown";
    const doctorPhone = typeof doctorData === 'object' && doctorData !== null ? doctorData.phone || "N/A" : "N/A";
    const doctorEmail = typeof doctorData === 'object' && doctorData !== null ? 
      doctorData.email || `${doctorName.toLowerCase().replace(/\s+/g, '.')}@example.com` : 
      `unknown-${orderData.doctor_id.substring(0, 8)}@example.com`;

    // Build the shipping info
    const shippingInfo: ShippingInfo = {
      tracking_number: orderData.tracking_number,
      shipping_carrier: orderData.shipping_carrier,
      estimated_delivery_date: orderData.estimated_delivery_date,
      actual_delivery_date: orderData.actual_delivery_date
    };

    return {
      order: {
        ...orderData,
        doctor: {
          name: doctorName,
          phone: doctorPhone,
          email: doctorEmail
        }
      },
      items: itemsData || [],
      statusHistory: statusData || [],
      communications: communicationsData || [],
      shippingInfo,
      returns: returnsData || []
    };
  } catch (error: any) {
    console.error("Error fetching order details:", error);
    toast.error("Failed to load order details");
    throw error;
  }
};

// Fetch order items
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

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching order items:", error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string, userId?: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc(
      'update_order_status',
      { 
        p_order_id: orderId, 
        p_status: newStatus,
        p_notes: notes || `Status changed to ${newStatus}`,
        p_user_id: userId
      }
    );

    if (error) {
      console.error("Error updating order status:", error);
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error("Error in updateOrderStatus:", error);
    toast.error("Failed to update order status");
    throw error;
  }
};

// Add communication message to an order
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
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error: any) {
    console.error("Error adding communication:", error);
    toast.error("Failed to send message");
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
    const { error } = await supabase
      .from("orders")
      .update({
        tracking_number: trackingNumber,
        shipping_carrier: shippingCarrier,
        estimated_delivery_date: estimatedDeliveryDate,
        status: 'shipped',
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (error) throw error;

    // Add status update to history
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: 'shipped',
        notes: `Order shipped via ${shippingCarrier}, tracking: ${trackingNumber}`
      });

    if (historyError) {
      console.error("Error adding shipping status to history:", historyError);
      // Continue anyway
    }

    return true;
  } catch (error: any) {
    console.error("Error updating shipping info:", error);
    toast.error("Failed to update shipping information");
    throw error;
  }
};

// Update return status
export const updateReturnStatus = async (
  returnId: string,
  status: string,
  processedBy: string,
  notes?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("returns")
      .update({
        status,
        processed_by: processedBy,
        notes: notes || `Return marked as ${status}`,
        updated_at: new Date().toISOString()
      })
      .eq("id", returnId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error updating return status:", error);
    toast.error("Failed to update return status");
    throw error;
  }
};

// Initiate a return request
export const initiateReturn = async (
  orderId: string,
  doctorId: string,
  reason: string,
  items: { productId: string, quantity: number, price: number }[]
): Promise<string | null> => {
  try {
    // Calculate total refund amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create the return record
    const { data: returnData, error: returnError } = await supabase
      .from("returns")
      .insert({
        order_id: orderId,
        doctor_id: doctorId,
        reason,
        amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (returnError) throw returnError;

    // Create return items
    const returnItems = items.map(item => ({
      return_id: returnData.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_per_unit: item.price,
      total_price: item.price * item.quantity,
      reason
    }));

    const { error: itemsError } = await supabase
      .from("return_items")
      .insert(returnItems);

    if (itemsError) throw itemsError;

    // Update order status
    await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: 'return_initiated',
        notes: `Return initiated: ${reason}`
      });

    return returnData.id;
  } catch (error: any) {
    console.error("Error initiating return:", error);
    toast.error("Failed to initiate return");
    throw error;
  }
};

