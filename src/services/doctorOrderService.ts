
import { supabase } from "@/integrations/supabase/client";
import { Order } from "./order";
import { toast } from "sonner";

/**
 * Fetch orders for a specific doctor with improved reliability
 */
export const fetchDoctorOrdersReliable = async (doctorId: string): Promise<Order[]> => {
  try {
    console.log(`Fetching orders for doctor ID: ${doctorId}`);
    
    // Direct query for doctor's orders with comprehensive error handling
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        doctor:doctor_id (
          name,
          phone
        )
      `)
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching doctor orders:", error);
      throw error;
    }
    
    console.log(`Found ${data.length} orders via direct query`);
    
    // Fix the type issue by ensuring doctor property matches expected structure
    const processedOrders = data.map(order => {
      // Handle potential null doctor or error in doctor join
      const doctorData = order.doctor;
      
      // Create a properly typed order object with correct doctor structure
      const processedOrder: Order = {
        ...order,
        doctor: {
          // Safely handle the doctor data with type checking
          name: typeof doctorData === 'object' && doctorData ? String(doctorData.name || "Unknown") : "Unknown",
          phone: typeof doctorData === 'object' && doctorData ? String(doctorData.phone || "N/A") : "N/A",
          email: "" // Since email isn't in the select query, we'll set a default empty string
        }
      };
      
      return processedOrder;
    });
    
    return processedOrders;
    
  } catch (error: any) {
    console.error("Error in fetchDoctorOrdersReliable:", error);
    toast.error("Failed to load your orders");
    return [];
  }
};

/**
 * Subscribe to real-time updates for a specific doctor's orders
 */
export const subscribeToDoctorOrdersReliable = (
  doctorId: string,
  onOrdersChange: () => void
): () => void => {
  console.log(`Setting up real-time subscription for doctor ${doctorId} orders`);
  
  const channel = supabase
    .channel(`doctor-orders-${doctorId}`)
    .on(
      'postgres_changes' as any,
      { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `doctor_id=eq.${doctorId}`
      },
      (payload) => {
        console.log(`Order change detected for doctor ${doctorId}:`, payload);
        onOrdersChange();
      }
    )
    .subscribe((status) => {
      console.log(`Subscription status for doctor ${doctorId} orders: ${status}`);
    });
  
  // Return unsubscribe function
  return () => {
    console.log(`Removing subscription for doctor ${doctorId} orders`);
    supabase.removeChannel(channel);
  };
};
