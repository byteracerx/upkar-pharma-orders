
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const downloadInvoice = (invoiceUrl: string, fileName: string) => {
  // Handle invoice download
  window.open(invoiceUrl, '_blank');
};

export const sendInvoiceEmail = async (orderId: string): Promise<boolean> => {
  try {
    // Get order details to prepare email
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, doctor:doctor_id(*)')
      .eq('id', orderId)
      .single();
      
    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found");
    
    // Invoke the Supabase Edge Function to send the email
    const { data, error } = await supabase.functions.invoke('send-invoice-email', {
      body: {
        doctorEmail: order.doctor.email,
        doctorName: order.doctor.name,
        invoiceNumber: order.invoice_number || `INV-${orderId.substring(0, 8)}`,
        invoiceUrl: order.invoice_url || '#',
        orderId: orderId
      }
    });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    toast.error("Failed to send invoice email");
    return false;
  }
};

export const sendWhatsAppNotification = async (orderId: string, notificationType: string): Promise<boolean> => {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, doctor:doctor_id(*)')
      .eq('id', orderId)
      .single();
      
    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found");
    
    // Invoke the Supabase Edge Function to send WhatsApp notification
    const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body: {
        phone: order.doctor.phone,
        name: order.doctor.name,
        orderId: orderId,
        notificationType: notificationType,
        orderStatus: order.status
      }
    });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    toast.error("Failed to send WhatsApp notification");
    return false;
  }
};
