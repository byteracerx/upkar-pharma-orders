
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Order, 
  OrderItem, 
  OrderDetails, 
  OrderCommunication 
} from './types';

// Function to get orders for a doctor
export const getDoctorOrders = async (doctorId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, doctor:doctor_id(id, name, email, phone)')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(order => ({
      ...order,
      doctor: order.doctor as Order['doctor'],
    }));
  } catch (error) {
    console.error('Error getting doctor orders:', error);
    toast.error('Failed to load orders');
    return [];
  }
};

// Function to fetch order items
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
      .select('*, doctor:doctor_id(id, name, email, phone)')
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
      .from('returns')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    // Get return items if there are returns
    let returnsWithItems = [];
    if (returnsData && returnsData.length > 0) {
      const returnPromises = returnsData.map(async (returnItem) => {
        const { data: returnItemsData } = await supabase
          .from('return_items')
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
      doctor: orderData.doctor as Order['doctor'],
    };

    // Convert communications to match OrderCommunication interface by adding the sender_type if missing
    const communications: OrderCommunication[] = communicationsData ? communicationsData.map(comm => {
      // Using type assertion to create a complete OrderCommunication object
      return {
        ...comm,
        sender_type: (comm as any).sender_type || 'doctor' // Default to 'doctor' if not specified
      } as OrderCommunication;
    }) : [];

    return {
      order,
      items: itemsData,
      statusHistory: statusHistoryData || [],
      communications,
      returns: returnsWithItems
    };
  } catch (error) {
    console.error('Error getting order details:', error);
    toast.error('Failed to load order details');
    return null;
  }
};
