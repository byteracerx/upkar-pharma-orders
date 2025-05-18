
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getOrderDetails } from './orderQueries';

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
      .from('returns')
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
        .from('return_items')
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
