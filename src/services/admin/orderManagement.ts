import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateInvoiceEnhanced } from '@/services/enhancedInvoiceService';

// Function to fetch all orders
export const fetchAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_orders_enhanced');

    if (error) {
      throw error;
    }

    // Process orders to add summary of products
    const ordersWithProductInfo = await Promise.all(data.map(async (order) => {
      // Fetch items for this order
      const { data: items } = await supabase
        .from('order_items')
        .select('*, product:product_id(*)')
        .eq('order_id', order.id);
      
      // Generate product summary
      const productSummary = items?.map(item => 
        `${item.product?.name} (${item.quantity})`
      ).join(', ');
      
      return {
        ...order,
        product_summary: productSummary,
        total_items: items?.length || 0
      };
    }));

    return ordersWithProductInfo;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    toast.error('Failed to load orders');
    return [];
  }
};

// Function to update order status with enhanced notifications
export const updateOrderStatus = async (orderId: string, status: string, notes?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('update_order_status', {
        p_order_id: orderId,
        p_status: status,
        p_notes: notes || null
      });

    if (error) {
      throw error;
    }

    // Auto-generate invoice when order is accepted/processing
    if (status === 'processing' || status === 'delivered') {
      setTimeout(async () => {
        await generateInvoiceEnhanced(orderId);
      }, 1000);
    }

    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Failed to update order status');
    return false;
  }
};

// Function to update shipping info
export const updateShippingInfo = async (
  orderId: string, 
  trackingNumber: string, 
  shippingCarrier: string,
  estimatedDeliveryDate?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('update_shipping_info', {
        p_order_id: orderId,
        p_tracking_number: trackingNumber,
        p_shipping_carrier: shippingCarrier,
        p_estimated_delivery_date: estimatedDeliveryDate || null
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating shipping info:', error);
    toast.error('Failed to update shipping information');
    return false;
  }
};

// Function to generate invoice using enhanced system
export const generateInvoice = async (orderId: string): Promise<string | boolean> => {
  try {
    const result = await generateInvoiceEnhanced(orderId);
    
    if (result.success) {
      return result.invoice_url || true;
    } else {
      throw new Error(result.error || 'Failed to generate invoice');
    }
  } catch (error) {
    console.error('Error generating invoice:', error);
    toast.error('Failed to generate invoice');
    return false;
  }
};

// Function to synchronize orders
export const synchronizeOrders = async (): Promise<boolean> => {
  try {
    // This is just a placeholder since we're not implementing actual synchronization yet
    console.log('Synchronizing orders...');
    
    // For demo purposes, just refresh the data
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
      
    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error synchronizing orders:', error);
    toast.error('Failed to synchronize orders');
    return false;
  }
};

// Function to update return status
export const updateReturnStatus = async (
  returnId: string, 
  status: string, 
  adminId: string,
  notes?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('update_return_status', {
        p_return_id: returnId,
        p_status: status,
        p_processed_by: adminId,
        p_notes: notes || null
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating return status:', error);
    toast.error('Failed to update return status');
    return false;
  }
};

// Function to fetch return details
export const fetchReturnDetails = async (returnId: string) => {
  try {
    // Fetch the return
    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single();

    if (returnError) {
      throw returnError;
    }

    // Fetch the return items
    const { data: itemsData, error: itemsError } = await supabase
      .from('return_items')
      .select('*, product:product_id(*)')
      .eq('return_id', returnId);

    if (itemsError) {
      throw itemsError;
    }

    return {
      ...returnData,
      items: itemsData
    };
  } catch (error) {
    console.error('Error fetching return details:', error);
    toast.error('Failed to load return details');
    return null;
  }
};
