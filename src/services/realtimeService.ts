import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

// Store active channels to avoid duplicate subscriptions
const activeChannels: Record<string, RealtimeChannel> = {};

/**
 * Subscribe to real-time updates for a specific table
 * @param tableName The table to subscribe to
 * @param event The event type ('INSERT', 'UPDATE', 'DELETE', or '*' for all)
 * @param callback Function to call when an event occurs
 * @returns A function to unsubscribe
 */
export const subscribeToTable = (
  tableName: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: any) => void
): () => void => {
  const channelName = `${tableName}-${event}-${Date.now()}`;
  
  // If channel already exists, remove it first
  if (activeChannels[channelName]) {
    supabase.removeChannel(activeChannels[channelName]);
  }
  
  console.log(`Setting up real-time subscription to ${tableName} (${event} events)`);
  
  // Create new channel with the correct event structure for Supabase JS v2
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes', 
      { 
        event: event, 
        schema: 'public', 
        table: tableName 
      },
      (payload) => {
        console.log(`${tableName} ${event} event:`, payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`Subscription to ${tableName} (${event}): ${status}`);
    });
  
  // Store the channel
  activeChannels[channelName] = channel;
  
  // Return unsubscribe function
  return () => {
    if (activeChannels[channelName]) {
      console.log(`Removing subscription to ${tableName} (${event})`);
      supabase.removeChannel(activeChannels[channelName]);
      delete activeChannels[channelName];
    }
  };
};

/**
 * Subscribe to real-time updates for orders
 * @param callback Function to call when an order event occurs
 * @returns A function to unsubscribe
 */
export const subscribeToOrders = (
  callback: (payload: any) => void
): () => void => {
  return subscribeToTable('orders', '*', callback);
};

/**
 * Subscribe to real-time updates for doctors
 * @param callback Function to call when a doctor event occurs
 * @returns A function to unsubscribe
 */
export const subscribeToDoctors = (
  callback: (payload: any) => void
): () => void => {
  return subscribeToTable('doctors', '*', callback);
};

/**
 * Subscribe to real-time updates for order items
 * @param callback Function to call when an order item event occurs
 * @returns A function to unsubscribe
 */
export const subscribeToOrderItems = (
  callback: (payload: any) => void
): () => void => {
  return subscribeToTable('order_items', '*', callback);
};

/**
 * Subscribe to real-time updates for a specific doctor's orders
 * @param doctorId The doctor's ID
 * @param callback Function to call when an order event occurs
 * @returns A function to unsubscribe
 */
export const subscribeToDoctorOrders = (
  doctorId: string,
  callback: (payload: any) => void
): () => void => {
  const channelName = `doctor-${doctorId}-orders-${Date.now()}`;
  
  // If channel already exists, remove it first
  if (activeChannels[channelName]) {
    supabase.removeChannel(activeChannels[channelName]);
  }
  
  // Create new channel with filter
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `doctor_id=eq.${doctorId}`
      },
      (payload) => {
        console.log(`Doctor ${doctorId} order event:`, payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`Subscription to orders for doctor ${doctorId}: ${status}`);
    });
  
  // Store the channel
  activeChannels[channelName] = channel;
  
  // Return unsubscribe function
  return () => {
    if (activeChannels[channelName]) {
      supabase.removeChannel(activeChannels[channelName]);
      delete activeChannels[channelName];
    }
  };
};

/**
 * Clean up all active channels
 */
export const cleanupAllChannels = (): void => {
  Object.values(activeChannels).forEach(channel => {
    supabase.removeChannel(channel);
  });
  
  // Clear the channels object
  Object.keys(activeChannels).forEach(key => {
    delete activeChannels[key];
  });
  
  console.log("All real-time channels cleaned up");
};
