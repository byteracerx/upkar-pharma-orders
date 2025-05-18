
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
