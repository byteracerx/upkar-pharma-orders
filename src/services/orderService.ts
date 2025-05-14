import { supabase } from "@/integrations/supabase/client";

export interface Order {
  id: string;
  doctor_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  shipping_address?: string;
  billing_address?: string;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  tracking_number?: string;
  shipping_carrier?: string;
  discount_amount?: number;
  tax_amount?: number;
  shipping_cost?: number;
  invoice_number?: string;
  invoice_generated?: boolean;
  invoice_url?: string;
  has_returns?: boolean;
  doctor?: {
    name: string;
    phone: string;
    email?: string;
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
    category?: string;
    description?: string;
  };
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  admin_name?: string;
}

export interface OrderNotification {
  id: string;
  order_id: string;
  notification_type: string;
  recipient: string;
  content?: string;
  sent_at: string;
  status: string;
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
  sender_name?: string;
  recipient_name?: string;
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
    image_url: string;
  };
}

export interface Return {
  id: string;
  order_id: string;
  doctor_id: string;
  reason: string;
  status: string;
  amount: number;
  created_at: string;
  updated_at: string;
  processed_by?: string;
  notes?: string;
  items?: ReturnItem[];
}

export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  notifications?: OrderNotification[];
  communications?: OrderCommunication[];
  returns?: Return[];
}

// Fetch orders for a doctor with enhanced information
export const fetchDoctorOrders = async (doctorId: string): Promise<Order[]> => {
  try {
    // First try using the enhanced RPC function
    try {
      const { data, error } = await supabase.rpc('get_doctor_orders_enhanced', { 
        p_doctor_id: doctorId 
      });
      
      if (!error && data) {
        const enhancedOrders = (data as any[]).map(item => ({
          ...item,
          doctor_id: doctorId // Add the missing doctor_id field
        }));
        return enhancedOrders as Order[];
      }
    } catch (rpcError) {
      console.warn("RPC function get_doctor_orders_enhanced failed, falling back to direct query:", rpcError);
    }
    
    // Fallback to direct query
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

// Fetch comprehensive order details including all related information
export const fetchOrderDetails = async (orderId: string): Promise<OrderDetails> => {
  try {
    // First try using the enhanced RPC function
    try {
      const { data, error } = await supabase.rpc('get_order_details', { 
        p_order_id: orderId 
      });
      
      if (!error && data) {
        // Cast data to the expected type
        return data as unknown as OrderDetails;
      }
    } catch (rpcError) {
      console.warn("RPC function get_order_details failed, falling back to direct queries:", rpcError);
    }
    
    // Fallback to direct queries
    // Fetch the order
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
      console.error("Error fetching order:", orderError);
      throw orderError;
    }
    
    // Build doctor object safely
    const doctorData = orderData.doctor || {};
    const doctor = {
      name: typeof doctorData.name === 'string' ? doctorData.name : 'Unknown',
      phone: typeof doctorData.phone === 'string' ? doctorData.phone : 'N/A',
      email: typeof doctorData.email === 'string' ? doctorData.email : ''
    };
    
    const order = {
      ...orderData,
      doctor
    };
    
    // Fetch the order items with their products
    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        product:product_id (
          name,
          image_url,
          category,
          description
        )
      `)
      .eq("order_id", orderId);
    
    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      throw itemsError;
    }
    
    // Fetch order status history
    const { data: statusHistoryData, error: statusHistoryError } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    
    if (statusHistoryError) {
      console.error("Error fetching order status history:", statusHistoryError);
      // Continue without status history
    }
    
    // Fetch order notifications
    const { data: notificationsData, error: notificationsError } = await supabase
      .from("order_notifications")
      .select("*")
      .eq("order_id", orderId)
      .order("sent_at", { ascending: false });
    
    if (notificationsError) {
      console.error("Error fetching order notifications:", notificationsError);
      // Continue without notifications
    }
    
    // Fetch order communications
    const { data: communicationsData, error: communicationsError } = await supabase
      .from("order_communications")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    
    if (communicationsError) {
      console.error("Error fetching order communications:", communicationsError);
      // Continue without communications
    }
    
    // Fetch returns
    const { data: returnsData, error: returnsError } = await supabase
      .from("returns")
      .select("*")
      .eq("order_id", orderId);
    
    if (returnsError) {
      console.error("Error fetching returns:", returnsError);
      // Continue without returns
    }
    
    // Fetch return items if there are returns
    let returnsWithItems: Return[] = [];
    if (returnsData && returnsData.length > 0) {
      returnsWithItems = await Promise.all(
        returnsData.map(async (returnItem) => {
          const { data: returnItemsData, error: returnItemsError } = await supabase
            .from("return_items")
            .select(`
              *,
              product:product_id (
                name,
                image_url
              )
            `)
            .eq("return_id", returnItem.id);
          
          if (returnItemsError) {
            console.error("Error fetching return items:", returnItemsError);
            return { ...returnItem, items: [] };
          }
          
          return { ...returnItem, items: returnItemsData };
        })
      );
    }
    
    return {
      order: order as Order,
      items: itemsData as OrderItem[],
      statusHistory: statusHistoryData as OrderStatusHistory[],
      notifications: notificationsData as OrderNotification[],
      communications: communicationsData as OrderCommunication[],
      returns: returnsWithItems as Return[]
    };
  } catch (error) {
    console.error("Error in fetchOrderDetails:", error);
    throw error;
  }
};

// Fetch all orders with enhanced information (for admin)
export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    // First try using the enhanced RPC function
    try {
      const { data, error } = await supabase.rpc('get_all_orders_enhanced');
      
      if (!error && data) {
        return data.map(order => ({
          ...order,
          doctor: {
            name: order.doctor_name,
            phone: order.doctor_phone,
            email: order.doctor_email
          }
        })) as Order[];
      }
    } catch (rpcError) {
      console.warn("RPC function get_all_orders_enhanced failed, falling back to direct query:", rpcError);
    }
    
    // Try the original RPC function
    try {
      const { data, error } = await supabase.rpc('get_all_orders');
      
      if (!error && data) {
        return data.map(order => ({
          ...order,
          doctor: {
            name: order.doctor_name,
            phone: order.doctor_phone
          }
        })) as Order[];
      }
    } catch (rpcError) {
      console.warn("RPC function get_all_orders failed, falling back to direct query:", rpcError);
    }
    
    // Fallback to direct query if RPC fails
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

// Update order status with enhanced tracking and notifications
export const updateOrderStatus = async (
  orderId: string, 
  newStatus: string, 
  notes?: string, 
  userId?: string
): Promise<boolean> => {
  try {
    // First try using the enhanced RPC function
    try {
      const { data, error } = await supabase.rpc('update_order_status', { 
        p_order_id: orderId,
        p_status: newStatus,
        p_notes: notes || null,
        p_user_id: userId || null
      });
      
      if (!error) {
        // If status changed to 'accepted', generate invoice
        if (newStatus === 'accepted' || newStatus === 'processing') {
          await generateInvoice(orderId);
        }
        
        // Send notification to doctor
        await notifyOrderStatusChange(orderId, newStatus);
        
        return true;
      }
    } catch (rpcError) {
      console.warn("RPC function update_order_status failed, falling back to direct update:", rpcError);
    }
    
    // Fallback to direct update
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
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        // If status is 'delivered', update actual delivery date
        ...(newStatus === 'delivered' ? { actual_delivery_date: new Date().toISOString() } : {})
      })
      .eq("id", orderId);
    
    if (error) {
      console.error("Error updating order status:", error);
      return false;
    }
    
    // Record in status history
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: newStatus,
        notes: notes || `Status changed to ${newStatus}`,
        created_by: userId
      });
    
    if (historyError) {
      console.error("Error recording status history:", historyError);
      // Continue even if history recording fails
    }
    
    // If status changed to 'accepted' or 'processing', generate invoice
    if (newStatus === 'accepted' || newStatus === 'processing') {
      await generateInvoice(orderId);
    }
    
    // Notify doctor about status update
    await notifyOrderStatusChange(orderId, newStatus);
    
    return true;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return false;
  }
};

// Generate invoice for an order
export const generateInvoice = async (orderId: string): Promise<boolean> => {
  try {
    // Generate invoice number if not already generated
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("invoice_number, invoice_generated")
      .eq("id", orderId)
      .single();
    
    if (orderError) {
      console.error("Error fetching order for invoice:", orderError);
      return false;
    }
    
    // If invoice already generated, skip
    if (orderData.invoice_generated) {
      return true;
    }
    
    // Generate invoice number
    let invoiceNumber = orderData.invoice_number;
    if (!invoiceNumber) {
      // Generate a fallback invoice number
      invoiceNumber = `INV-${Date.now()}-${orderId.substring(0, 8)}`;
    }
    
    // Update order with invoice number
    const { error: updateError } = await supabase
      .from("orders")
      .update({ 
        invoice_number: invoiceNumber,
        invoice_generated: true
      })
      .eq("id", orderId);
    
    if (updateError) {
      console.error("Error updating order with invoice number:", updateError);
      return false;
    }
    
    // Call edge function to generate invoice and send email
    try {
      await supabase.functions.invoke('generate-invoice', {
        body: { orderId, invoiceNumber }
      });
      
      // Record notification
      await recordOrderNotification(
        orderId,
        'invoice_generated',
        'Invoice generated and sent to doctor'
      );
      
      return true;
    } catch (invoiceError) {
      console.error("Error generating invoice:", invoiceError);
      return false;
    }
  } catch (error) {
    console.error("Error in generateInvoice:", error);
    return false;
  }
};

// Notify doctor about order status change
export const notifyOrderStatusChange = async (orderId: string, newStatus: string): Promise<boolean> => {
  try {
    // Get order details with doctor information
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
    
    if (orderError || !orderData) {
      console.error("Error fetching order details for notification:", orderError);
      return false;
    }
    
    // Ensure doctor object is properly typed
    const doctor = {
      name: orderData.doctor?.name || 'Unknown',
      phone: orderData.doctor?.phone || '',
      email: orderData.doctor?.email || ''
    };
    
    // Prepare notification content
    const notificationContent = `Your order #${orderData.invoice_number || orderId.substring(0, 8)} status has been updated to ${newStatus}.`;
    
    // Record notification in database
    await recordOrderNotification(
      orderId,
      'status_update',
      notificationContent
    );
    
    // Send notification via edge function
    try {
      await supabase.functions.invoke('notify-doctor-status-update', {
        body: {
          orderId,
          doctorName: doctor.name,
          doctorPhone: doctor.phone,
          doctorEmail: doctor.email,
          newStatus,
          notificationContent
        }
      });
      
      return true;
    } catch (notifyError) {
      console.error("Error notifying doctor:", notifyError);
      return false;
    }
  } catch (error) {
    console.error("Error in notifyOrderStatusChange:", error);
    return false;
  }
};

// Record a notification in the database
export const recordOrderNotification = async (
  orderId: string,
  notificationType: string,
  content: string,
  recipient?: string,
  status: string = 'sent'
): Promise<string | null> => {
  try {
    // First try using the RPC function
    try {
      const { data, error } = await supabase.rpc('record_order_notification', {
        p_order_id: orderId,
        p_notification_type: notificationType,
        p_recipient: recipient || 'doctor',
        p_content: content,
        p_status: status
      });
      
      if (!error) {
        return data;
      }
    } catch (rpcError) {
      console.warn("RPC function record_order_notification failed, falling back to direct insert:", rpcError);
    }
    
    // Fallback to direct insert
    const { data, error } = await supabase
      .from("order_notifications")
      .insert({
        order_id: orderId,
        notification_type: notificationType,
        recipient: recipient || 'doctor',
        content,
        status
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Error recording notification:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error in recordOrderNotification:", error);
    return null;
  }
};

// Add a communication message between admin and doctor
export const addOrderCommunication = async (
  orderId: string,
  senderId: string,
  recipientId: string,
  message: string
): Promise<string | null> => {
  try {
    // First try using the RPC function
    try {
      const { data, error } = await supabase.rpc('add_order_communication', {
        p_order_id: orderId,
        p_sender_id: senderId,
        p_recipient_id: recipientId,
        p_message: message
      });
      
      if (!error) {
        return data;
      }
    } catch (rpcError) {
      console.warn("RPC function add_order_communication failed, falling back to direct insert:", rpcError);
    }
    
    // Fallback to direct insert
    const { data, error } = await supabase
      .from("order_communications")
      .insert({
        order_id: orderId,
        sender_id: senderId,
        recipient_id: recipientId,
        message
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Error adding communication:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error in addOrderCommunication:", error);
    return null;
  }
};

// Mark a communication as read
export const markCommunicationAsRead = async (communicationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("order_communications")
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", communicationId);
    
    if (error) {
      console.error("Error marking communication as read:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in markCommunicationAsRead:", error);
    return false;
  }
};

// Process a return for an order
export const processReturn = async (
  orderId: string,
  doctorId: string,
  reason: string,
  items: ReturnItem[],
  processedBy?: string,
  notes?: string
): Promise<string | null> => {
  try {
    // First try using the RPC function
    try {
      const { data, error } = await supabase.rpc('process_return', {
        p_order_id: orderId,
        p_doctor_id: doctorId,
        p_reason: reason,
        p_items: JSON.stringify(items),
        p_processed_by: processedBy || null,
        p_notes: notes || null
      });
      
      if (!error) {
        return data;
      }
    } catch (rpcError) {
      console.warn("RPC function process_return failed, falling back to direct insert:", rpcError);
    }
    
    // Fallback to direct insert
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
    
    // Create return record
    const { data: returnData, error: returnError } = await supabase
      .from("returns")
      .insert({
        order_id: orderId,
        doctor_id: doctorId,
        reason,
        status: 'pending',
        amount: totalAmount,
        processed_by: processedBy,
        notes
      })
      .select("id")
      .single();
    
    if (returnError) {
      console.error("Error creating return:", returnError);
      return null;
    }
    
    // Insert return items
    const returnId = returnData.id;
    const returnItems = items.map(item => ({
      return_id: returnId,
      product_id: item.product_id,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      total_price: item.total_price,
      reason: item.reason,
      condition: item.condition
    }));
    
    const { error: itemsError } = await supabase
      .from("return_items")
      .insert(returnItems);
    
    if (itemsError) {
      console.error("Error inserting return items:", itemsError);
      // Continue even if items insert fails
    }
    
    // Add status history entry
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: 'return_initiated',
        notes: `Return initiated for ${totalAmount} amount`,
        created_by: processedBy
      });
    
    if (historyError) {
      console.error("Error recording status history for return:", historyError);
      // Continue even if history recording fails
    }
    
    return returnId;
  } catch (error) {
    console.error("Error in processReturn:", error);
    return null;
  }
};

// Update return status
export const updateReturnStatus = async (
  returnId: string, 
  newStatus: string,
  processedBy?: string,
  notes?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("returns")
      .update({
        status: newStatus,
        processed_by: processedBy || null,
        notes: notes ? (notes + (notes ? ' | ' : '')) : '',
        updated_at: new Date().toISOString()
      })
      .eq("id", returnId);
    
    if (error) {
      console.error("Error updating return status:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateReturnStatus:", error);
    return false;
  }
};

// Reorder a previous order
export const reorderPreviousOrder = async (
  orderId: string,
  doctorId: string
): Promise<string | null> => {
  try {
    // First try using the RPC function
    try {
      const { data, error } = await supabase.rpc('reorder_previous_order', {
        p_order_id: orderId,
        p_doctor_id: doctorId
      });
      
      if (!error) {
        return data;
      }
    } catch (rpcError) {
      console.warn("RPC function reorder_previous_order failed, falling back to direct implementation:", rpcError);
    }
    
    // Fallback to direct implementation
    // Get original order details
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("shipping_address, billing_address, payment_method, notes")
      .eq("id", orderId)
      .single();
    
    if (orderError) {
      console.error("Error fetching original order:", orderError);
      return null;
    }
    
    // Create new order
    const { data: newOrderData, error: newOrderError } = await supabase
      .from("orders")
      .insert({
        doctor_id: doctorId,
        total_amount: 0, // Will update after adding items
        status: 'pending',
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address,
        payment_method: orderData.payment_method,
        payment_status: 'pending',
        notes: (orderData.notes || '') + ` (Reordered from order ${orderId})`
      })
      .select("id")
      .single();
    
    if (newOrderError) {
      console.error("Error creating new order:", newOrderError);
      return null;
    }
    
    const newOrderId = newOrderData.id;
    
    // Get original order items
    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);
    
    if (itemsError) {
      console.error("Error fetching original order items:", itemsError);
      return null;
    }
    
    // Get current product prices
    const productIds = itemsData.map(item => item.product_id);
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, price")
      .in("id", productIds);
    
    if (productsError) {
      console.error("Error fetching product prices:", productsError);
      return null;
    }
    
    // Create price lookup
    const productPrices = {};
    productsData.forEach(product => {
      productPrices[product.id] = product.price;
    });
    
    // Create new order items
    const newOrderItems = itemsData.map(item => ({
      order_id: newOrderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price_per_unit: productPrices[item.product_id] || 0,
      total_price: (productPrices[item.product_id] || 0) * item.quantity
    }));
    
    const { error: newItemsError } = await supabase
      .from("order_items")
      .insert(newOrderItems);
    
    if (newItemsError) {
      console.error("Error creating new order items:", newItemsError);
      return null;
    }
    
    // Calculate total amount
    const totalAmount = newOrderItems.reduce((sum, item) => sum + item.total_price, 0);
    
    // Update order total
    const { error: updateError } = await supabase
      .from("orders")
      .update({ total_amount: totalAmount })
      .eq("id", newOrderId);
    
    if (updateError) {
      console.error("Error updating order total:", updateError);
      return null;
    }
    
    // Add status history entry
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: newOrderId,
        status: 'pending',
        notes: `Order created by reordering previous order ${orderId}`
      });
    
    if (historyError) {
      console.error("Error recording status history for new order:", historyError);
      // Continue even if history recording fails
    }
    
    return newOrderId;
  } catch (error) {
    console.error("Error in reorderPreviousOrder:", error);
    return null;
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
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
    
    if (error) {
      console.error("Error updating shipping info:", error);
      return false;
    }
    
    // Record in status history
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status: 'shipping_updated',
        notes: `Shipping information updated. Tracking: ${trackingNumber} via ${shippingCarrier}`
      });
    
    if (historyError) {
      console.error("Error recording shipping update in history:", historyError);
      // Continue even if history recording fails
    }
    
    // Notify doctor about shipping update
    await notifyOrderStatusChange(orderId, 'shipping_updated');
    
    return true;
  } catch (error) {
    console.error("Error in updateShippingInfo:", error);
    return false;
  }
};
