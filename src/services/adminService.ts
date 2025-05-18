import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the Doctor interface
export interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  gst_number: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Function to fetch all doctors
export const fetchDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Doctor[];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    toast.error('Failed to load doctors');
    return [];
  }
};

// Function to fetch pending doctors
export const fetchPendingDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as Doctor[];
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    toast.error('Failed to load pending doctors');
    return [];
  }
};

// Function to approve a doctor
export const approveDoctor = async (doctorId: string, adminId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('doctors')
      .update({ 
        is_approved: true, 
        updated_at: new Date().toISOString() // Fixed: Convert Date to string
      })
      .eq('id', doctorId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error approving doctor:', error);
    toast.error('Failed to approve doctor');
    return false;
  }
};

// Function to reject a doctor
export const rejectDoctor = async (doctorId: string, adminId: string, reason: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('doctors')
      .update({ 
        is_approved: false, 
        updated_at: new Date().toISOString() // Fixed: Convert Date to string
      })
      .eq('id', doctorId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    toast.error('Failed to reject doctor');
    return false;
  }
};

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

// Function to update order status
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

// Function to generate invoice
export const generateInvoice = async (orderId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('generate_invoice', {
        p_order_id: orderId
      });

    if (error) {
      throw error;
    }

    return true;
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

// Function to get doctor credits
export const getDoctorCredits = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_doctor_credit_summary', {
        p_doctor_id: doctorId
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting doctor credits:', error);
    toast.error('Failed to load credit information');
    return null;
  }
};

// Function to get all doctors with credit information
export const getAllDoctorsWithCredits = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_doctor_credits');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting all doctors with credits:', error);
    toast.error('Failed to load doctor credits');
    return [];
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

// Export these functions for EnhancedOrders.tsx
export const {
  fetchAllOrders,
  updateOrderStatus,
  updateShippingInfo,
  generateInvoice,
  synchronizeOrders
} = require('./orderService');

// Export type for EnhancedOrders.tsx
export interface ShippingInfo {
  tracking_number: string;
  shipping_carrier: string;
  estimated_delivery_date?: string;
}
