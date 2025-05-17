
import { supabase } from "@/integrations/supabase/client";

// Subscribe to changes in the doctors table
export const subscribeToDoctors = (onDoctorChange: (payload: any) => void): (() => void) => {
  console.log("Setting up real-time subscription for doctors table");

  const channel = supabase
    .channel('doctors-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'doctors'
      },
      (payload) => {
        console.log("Doctors table changed:", payload);
        onDoctorChange(payload);
      }
    )
    .subscribe((status) => {
      console.log("Doctors subscription status:", status);
    });

  // Return unsubscribe function
  return () => {
    console.log("Unsubscribing from doctors table");
    supabase.removeChannel(channel);
  };
};

// Subscribe to changes in the orders table
export const subscribeToOrders = (onOrderChange: (payload: any) => void): (() => void) => {
  console.log("Setting up real-time subscription for orders table");

  const channel = supabase
    .channel('orders-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'orders'
      },
      (payload) => {
        console.log("Orders table changed:", payload);
        onOrderChange(payload);
      }
    )
    .subscribe((status) => {
      console.log("Orders subscription status:", status);
    });

  // Return unsubscribe function
  return () => {
    console.log("Unsubscribing from orders table");
    supabase.removeChannel(channel);
  };
};

// Subscribe to changes in the products table
export const subscribeToProducts = (onProductChange: (payload: any) => void): (() => void) => {
  console.log("Setting up real-time subscription for products table");

  const channel = supabase
    .channel('products-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'products'
      },
      (payload) => {
        console.log("Products table changed:", payload);
        onProductChange(payload);
      }
    )
    .subscribe((status) => {
      console.log("Products subscription status:", status);
    });

  // Return unsubscribe function
  return () => {
    console.log("Unsubscribing from products table");
    supabase.removeChannel(channel);
  };
};

// Subscribe to changes in the credit_transactions table
export const subscribeToCreditTransactions = (onCreditChange: (payload: any) => void): (() => void) => {
  console.log("Setting up real-time subscription for credit_transactions table");

  const channel = supabase
    .channel('credit-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'credit_transactions'
      },
      (payload) => {
        console.log("Credit transactions table changed:", payload);
        onCreditChange(payload);
      }
    )
    .subscribe((status) => {
      console.log("Credit transactions subscription status:", status);
    });

  // Return unsubscribe function
  return () => {
    console.log("Unsubscribing from credit_transactions table");
    supabase.removeChannel(channel);
  };
};
