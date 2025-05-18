
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Order, OrderReturn } from '@/services/orderService';

// ShippingInfo type definition
export interface ShippingInfo {
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDeliveryDate?: string;
}

// Doctor type definition
export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  clinic_name?: string;
  specialty?: string;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
}

export interface DoctorCredit {
  id: string;
  doctor_id: string;
  amount: number;
  type: string;
  order_id?: string;
  payment_id?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  doctor?: {
    name: string;
    email: string;
    phone: string;
  };
  order?: {
    id: string;
    invoice_number?: string;
  };
}

export interface DoctorCreditSummary {
  doctor_id: string;
  doctor_name: string;
  doctor_phone: string;
  doctor_email: string;
  total_credit: number;
}

// Function to fetch all orders with doctor information
export const fetchAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        doctor:doctor_id (
          id,
          name,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Process the data to flatten doctor information
    const processedOrders = data.map(order => ({
      ...order,
      doctor_name: order.doctor?.name || 'Unknown',
      doctor_phone: order.doctor?.phone || 'N/A',
      doctor_email: order.doctor?.email || 'N/A'
    }));

    return processedOrders;
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    toast.error('Failed to load orders');
    return [];
  }
};

// Function to generate invoice for an order
export const generateInvoice = async (orderId: string): Promise<boolean> => {
  try {
    // Call the edge function to generate invoice
    const { data, error } = await supabase.functions.invoke('generate-invoice', {
      body: { orderId }
    });

    if (error) {
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.message || 'Failed to generate invoice');
    }

    return true;
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    toast.error('Failed to generate invoice', {
      description: error.message || 'Please try again.'
    });
    return false;
  }
};

// Function to synchronize orders with external systems
export const synchronizeOrders = async (): Promise<boolean> => {
  try {
    // First, check for any pending orders in the database
    const { data: pendingOrders, error: pendingError } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending');

    if (pendingError) {
      throw pendingError;
    }

    console.log(`Found ${pendingOrders.length} pending orders in database`);

    // Update order summaries
    const { error: updateError } = await supabase.rpc('update_order_summaries');

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error: any) {
    console.error('Error synchronizing orders:', error);
    toast.error('Failed to synchronize orders', {
      description: error.message || 'Please try again.'
    });
    return false;
  }
};

// Function to fetch pending doctor approvals
export const fetchPendingDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    toast.error('Failed to load pending doctor approvals');
    return [];
  }
};

// Function to fetch approved doctors
export const fetchApprovedDoctors = async (): Promise<Doctor[]> => {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('status', 'approved')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching approved doctors:', error);
    toast.error('Failed to load approved doctors');
    return [];
  }
};

// Function to approve a doctor
export const approveDoctor = async (doctorId: string, adminId: string): Promise<boolean> => {
  try {
    // Update doctor status
    const { error: updateError } = await supabase
      .from('doctors')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq('id', doctorId);

    if (updateError) {
      throw updateError;
    }

    // Call edge function to notify doctor
    await supabase.functions.invoke('send-doctor-notification', {
      body: {
        doctorId,
        type: 'approval',
        message: 'Your account has been approved. You can now log in and start using the system.',
      },
    });

    toast.success('Doctor approved successfully');
    return true;
  } catch (error) {
    console.error('Error approving doctor:', error);
    toast.error('Failed to approve doctor');
    return false;
  }
};

// Function to reject a doctor
export const rejectDoctor = async (
  doctorId: string,
  adminId: string,
  reason: string
): Promise<boolean> => {
  try {
    // Update doctor status
    const { error: updateError } = await supabase
      .from('doctors')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: adminId,
        rejection_reason: reason,
      })
      .eq('id', doctorId);

    if (updateError) {
      throw updateError;
    }

    // Call edge function to notify doctor
    await supabase.functions.invoke('send-doctor-notification', {
      body: {
        doctorId,
        type: 'rejection',
        message: `Your account has been rejected. Reason: ${reason}`,
      },
    });

    toast.success('Doctor rejected successfully');
    return true;
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    toast.error('Failed to reject doctor');
    return false;
  }
};

// Function to update order status
export const updateOrderStatus = async (
  orderId: string,
  newStatus: string,
  adminId: string
): Promise<boolean> => {
  try {
    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // Add status history entry
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: newStatus,
        created_by: adminId,
      });

    if (historyError) {
      throw historyError;
    }

    // Call edge function to notify doctor
    await supabase.functions.invoke('notify-doctor-status-update', {
      body: {
        orderId,
        status: newStatus,
      },
    });

    toast.success('Order status updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Failed to update order status');
    return false;
  }
};

// Function to get all doctor credit summaries
export const getDoctorCreditSummaries = async (): Promise<DoctorCreditSummary[]> => {
  try {
    const { data, error } = await supabase.rpc('get_doctor_credit_summary');

    if (error) {
      throw error;
    }

    return data as unknown as DoctorCreditSummary[];
  } catch (error) {
    console.error('Error getting doctor credit summaries:', error);
    toast.error('Failed to load doctor credit summaries');
    return [];
  }
};

// Function to get all credits for a specific doctor
export const getDoctorCredits = async (doctorId: string): Promise<DoctorCredit[]> => {
  try {
    const { data, error } = await supabase.rpc('get_doctor_credits', {
      doctor_id_param: doctorId
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data as unknown as DoctorCredit[];
  } catch (error) {
    console.error('Error getting doctor credits:', error);
    toast.error('Failed to load doctor credits');
    return [];
  }
};

// Function to add a payment to a doctor's account
export const addDoctorPayment = async (
  doctorId: string, 
  amount: number,
  notes: string,
  adminId: string
): Promise<boolean> => {
  try {
    // Add payment record
    const { data, error: paymentError } = await supabase
      .from('doctor_credits')
      .insert({
        doctor_id: doctorId,
        amount: amount * -1, // Negative amount for payment
        type: 'payment',
        notes,
        created_by: adminId
      })
      .select('id')
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // Call edge function to notify doctor
    await supabase.functions.invoke('notify-doctor-payment', {
      body: {
        doctorId,
        amount,
        paymentId: data.id,
        notes
      },
    });

    toast.success('Payment recorded successfully');
    return true;
  } catch (error) {
    console.error('Error recording payment:', error);
    toast.error('Failed to record payment');
    return false;
  }
};

// Function to update shipping information
export const updateShippingInfo = async (
  orderId: string,
  shippingInfo: ShippingInfo
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        tracking_number: shippingInfo.trackingNumber,
        shipping_carrier: shippingInfo.shippingCarrier,
        estimated_delivery_date: shippingInfo.estimatedDeliveryDate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      throw error;
    }

    toast.success('Shipping information updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating shipping info:', error);
    toast.error('Failed to update shipping information');
    return false;
  }
};

// Function to update return status
export const updateReturnStatus = async (
  returnId: string, 
  newStatus: string,
  adminId: string,
  notes?: string
): Promise<boolean> => {
  try {
    // Update return status
    const { error: updateError } = await supabase
      .from('order_returns')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        processed_by: adminId,
        notes: notes || null
      })
      .eq('id', returnId);

    if (updateError) {
      throw updateError;
    }

    // If approved, need to update order status and create credit
    if (newStatus === 'approved') {
      // Get return details
      const { data: returnData, error: fetchError } = await supabase
        .from('order_returns')
        .select('*')
        .eq('id', returnId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'returned',
          updated_at: new Date().toISOString()
        })
        .eq('id', returnData.order_id);

      if (orderError) {
        throw orderError;
      }

      // Add credit for return amount
      const { error: creditError } = await supabase
        .from('doctor_credits')
        .insert({
          doctor_id: returnData.doctor_id,
          amount: returnData.amount,
          type: 'return',
          order_id: returnData.order_id,
          notes: `Return #${returnId} approved`,
          created_by: adminId
        });

      if (creditError) {
        throw creditError;
      }
    }

    toast.success(`Return ${newStatus} successfully`);
    return true;
  } catch (error) {
    console.error('Error updating return status:', error);
    toast.error('Failed to update return status');
    return false;
  }
};

// Function to get order counts by status
export const getOrderCounts = async (): Promise<Record<string, number>> => {
  try {
    // Using a simple query instead of RPC to avoid the error
    const { data, error } = await supabase
      .from('orders')
      .select('status, count')
      .eq('status', 'pending')
      .or('status.eq.processing,status.eq.shipped,status.eq.delivered,status.eq.cancelled')
      .then(({ data, error }) => {
        if (error) throw error;
        
        // Transform the result to the expected format
        const counts: Record<string, number> = {
          'pending': 0,
          'processing': 0,
          'shipped': 0,
          'delivered': 0,
          'cancelled': 0,
        };
        
        data?.forEach(row => {
          counts[row.status] = row.count;
        });
        
        return { data: counts, error: null };
      });

    if (error) {
      throw error;
    }

    return data as Record<string, number>;
  } catch (error) {
    console.error('Error getting order counts:', error);
    return {
      'pending': 0,
      'processing': 0,
      'shipped': 0,
      'delivered': 0,
      'cancelled': 0,
    };
  }
};
