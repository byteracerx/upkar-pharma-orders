
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  product: {
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    category?: string;
  };
}

export interface Order {
  id: string;
  doctor_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  payment_status?: string;
  shipping_address?: string;
  billing_address?: string;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  estimated_delivery_date?: string | null;
  actual_delivery_date?: string | null;
  notes?: string;
  invoice_number?: string;
  invoice_generated?: boolean;
  invoice_url?: string;
  doctor?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  created_by: string;
  notes?: string;
  admin_name?: string;
}

export interface OrderCommunication {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  read: boolean;
  sender_type: 'admin' | 'doctor';
}

export interface OrderReturn {
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
  items?: {
    id: string;
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
  }[];
}

export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  communications?: OrderCommunication[];
  returns?: OrderReturn[];
}

// Function to get orders for a doctor
export const getDoctorOrders = async (doctorId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, doctor:doctor_id(name, email, phone)')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(order => ({
      ...order,
      doctor: order.doctor as { name: string; email: string; phone: string },
    }));
  } catch (error) {
    console.error('Error getting doctor orders:', error);
    toast.error('Failed to load orders');
    return [];
  }
};

// Add this new function to fetch order items
export const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, product:product_id(*)')
      .eq('order_id', orderId);

    if (error) {
      throw error;
    }

    return data.map(item => ({
      ...item,
      product: item.product as OrderItem['product']
    }));
  } catch (error) {
    console.error('Error fetching order items:', error);
    toast.error('Failed to load order items');
    return [];
  }
};

// Function to get specific order details including items
export const getOrderDetails = async (orderId: string): Promise<OrderDetails | null> => {
  try {
    // Get order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, doctor:doctor_id(name, email, phone)')
      .eq('id', orderId)
      .single();

    if (orderError) {
      throw orderError;
    }

    // Get order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product:product_id(*)')
      .eq('order_id', orderId);

    if (itemsError) {
      throw itemsError;
    }

    // Get status history
    const { data: statusHistoryData, error: statusHistoryError } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    // Get communications
    const { data: communicationsData, error: communicationsError } = await supabase
      .from('order_communications')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    // Get returns
    const { data: returnsData, error: returnsError } = await supabase
      .from('order_returns')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    // Get return items if there are returns
    let returnsWithItems: OrderReturn[] = [];
    if (returnsData && returnsData.length > 0) {
      const returnPromises = returnsData.map(async (returnItem) => {
        const { data: returnItemsData } = await supabase
          .from('order_return_items')
          .select('*, product:product_id(*)')
          .eq('return_id', returnItem.id);
        
        return {
          ...returnItem,
          items: returnItemsData || []
        };
      });
      
      returnsWithItems = await Promise.all(returnPromises);
    }

    const order = {
      ...orderData,
      doctor: orderData.doctor as { name: string; email: string; phone: string },
    };

    return {
      order,
      items: itemsData,
      statusHistory: statusHistoryData || [],
      communications: communicationsData || [],
      returns: returnsWithItems
    };
  } catch (error) {
    console.error('Error getting order details:', error);
    toast.error('Failed to load order details');
    return null;
  }
};

// Function to add a new communication message
export const addOrderCommunication = async (
  orderId: string, 
  message: string, 
  senderId: string,
  senderType: 'admin' | 'doctor'
): Promise<boolean> => {
  try {
    // Add the new communication
    const { error } = await supabase
      .from('order_communications')
      .insert({
        order_id: orderId,
        sender_id: senderId,
        message,
        sender_type: senderType,
        read: false
      });

    if (error) {
      throw error;
    }

    toast.success('Message sent');
    return true;
  } catch (error) {
    console.error('Error adding order communication:', error);
    toast.error('Failed to send message');
    return false;
  }
};

// Function to mark communications as read
export const markOrderCommunicationsAsRead = async (
  orderId: string,
  senderId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('order_communications')
      .update({ read: true })
      .eq('order_id', orderId)
      .neq('sender_id', senderId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error marking communications as read:', error);
    return false;
  }
};

// Function to process a return
export const processReturn = async (
  orderId: string,
  doctorId: string,
  reason: string,
  items: { id: string; quantity: number; reason?: string }[]
): Promise<boolean> => {
  try {
    // First, get the order details to calculate the return amount
    const orderDetails = await getOrderDetails(orderId);
    
    if (!orderDetails) {
      throw new Error('Order not found');
    }
    
    // Calculate the total return amount based on the items being returned
    let totalReturnAmount = 0;
    const returnItems = [];
    
    for (const item of items) {
      const orderItem = orderDetails.items.find(oi => oi.id === item.id);
      if (orderItem) {
        const returnAmount = orderItem.price_per_unit * item.quantity;
        totalReturnAmount += returnAmount;
        
        returnItems.push({
          product_id: orderItem.product_id,
          quantity: item.quantity,
          price_per_unit: orderItem.price_per_unit,
          total_price: returnAmount,
          reason: item.reason || 'No reason provided'
        });
      }
    }
    
    // Create the return record
    const { data: returnData, error: returnError } = await supabase
      .from('order_returns')
      .insert({
        order_id: orderId,
        doctor_id: doctorId,
        reason,
        status: 'pending',
        amount: totalReturnAmount
      })
      .select('id')
      .single();
      
    if (returnError) {
      throw returnError;
    }
    
    // Add the return items
    if (returnData && returnItems.length > 0) {
      const returnItemsWithReturnId = returnItems.map(item => ({
        ...item,
        return_id: returnData.id
      }));
      
      const { error: itemsError } = await supabase
        .from('order_return_items')
        .insert(returnItemsWithReturnId);
        
      if (itemsError) {
        throw itemsError;
      }
    }
    
    // Update order status to return_initiated
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'return_initiated' })
      .eq('id', orderId);
      
    if (orderError) {
      throw orderError;
    }
    
    // Add status history entry
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: 'return_initiated',
        created_by: doctorId,
        notes: 'Return initiated by doctor'
      });
      
    if (historyError) {
      throw historyError;
    }
    
    toast.success('Return request submitted successfully');
    return true;
  } catch (error) {
    console.error('Error processing return:', error);
    toast.error('Failed to process return');
    return false;
  }
};

// Add this alias for backward compatibility
export const initiateReturn = processReturn;
