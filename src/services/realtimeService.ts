
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to a specific table for all changes
 */
export const subscribeToTable = (
  tableName: string,
  onUpdate: (payload: any) => void,
  channelName?: string
): (() => void) => {
  return subscribeToTableWithEvent('*', tableName, onUpdate, channelName);
};

/**
 * Subscribe to a specific table and event
 */
export const subscribeToTableWithEvent = (
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  tableName: string,
  onUpdate: (payload: any) => void,
  channelName?: string
): (() => void) => {
  // Use provided channelName or generate one
  const channel_name = channelName || `${tableName}_channel_${Math.random().toString(36).slice(2, 11)}`;
  
  console.log(`Setting up real-time subscription to ${tableName} (${event} events)`);
  
  // Fix the type error by using a type assertion
  const channel = supabase
    .channel(channel_name)
    .on(
      'postgres_changes' as any, 
      { 
        event: event, 
        schema: 'public', 
        table: tableName 
      }, 
      (payload) => {
        console.log(`${tableName} change detected:`, payload);
        onUpdate(payload);
      }
    )
    .subscribe((status) => {
      console.log(`Subscription status for ${tableName}: ${status}`);
    });
  
  // Return unsubscribe function
  return () => {
    console.log(`Removing subscription to ${tableName}`);
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to all orders
 */
export const subscribeToOrders = (
  onUpdate: (payload: any) => void
): (() => void) => {
  return subscribeToTable('orders', onUpdate, 'orders_realtime');
};

/**
 * Subscribe to doctors table
 */
export const subscribeToDoctors = (
  onUpdate: (payload: any) => void
): (() => void) => {
  return subscribeToTable('doctors', onUpdate, 'doctors_realtime');
};

/**
 * Subscribe to order communications
 */
export const subscribeToOrderCommunications = (
  onUpdate: (payload: any) => void
): (() => void) => {
  return subscribeToTable('order_communications', onUpdate, 'order_communications_realtime');
};

/**
 * Subscribe to order notifications
 */
export const subscribeToOrderNotifications = (
  onUpdate: (payload: any) => void
): (() => void) => {
  return subscribeToTable('order_notifications', onUpdate, 'order_notifications_realtime');
};

/**
 * Subscribe to a specific order's changes
 */
export const subscribeToOrderById = (
  orderId: string,
  onUpdate: (payload: any) => void
): (() => void) => {
  const channelName = `order_${orderId}_channel`;
  
  console.log(`Setting up real-time subscription for order ${orderId}`);
  
  if (!orderId) {
    console.warn("Cannot subscribe to order without an order ID");
    return () => {};
  }
  
  // Use the correct type for postgres_changes with type assertion
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}` 
      },
      (payload) => {
        console.log(`Order ${orderId} change detected:`, payload);
        onUpdate(payload);
      }
    )
    .subscribe((status) => {
      console.log(`Subscription status for order ${orderId}: ${status}`);
    });
  
  // Return unsubscribe function
  return () => {
    console.log(`Removing subscription for order ${orderId}`);
    supabase.removeChannel(channel);
  };
};
