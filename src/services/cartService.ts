
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/services/productService";
import { v4 as uuidv4 } from 'uuid';

// Type for RPC parameters
type RpcParams = Record<string, any>;

// Define CartItem type
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

// Local storage key for cart items
const CART_STORAGE_KEY = 'upkar_cart_items';

// Custom event for cart updates
const cartUpdateEvent = new Event('cart-updated');

// Helper function to get cart items from localStorage
export const getCartItems = (): CartItem[] => {
  try {
    const cartItemsJson = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartItemsJson) return [];
    return JSON.parse(cartItemsJson);
  } catch (error) {
    console.error("Error loading cart items from localStorage:", error);
    return [];
  }
};

// Helper function to save cart items to localStorage
const saveCartItems = (items: CartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    // Dispatch cart updated event
    window.dispatchEvent(cartUpdateEvent);
  } catch (error) {
    console.error("Error saving cart items to localStorage:", error);
  }
};

// Add product to cart
export const addToCart = async (productId: string, quantity: number): Promise<boolean> => {
  try {
    // Fetch product details
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return false;
    }

    // Get current cart items
    const cartItems = getCartItems();

    // Check if product already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.product.id === productId);

    if (existingItemIndex >= 0) {
      // Update quantity if product already in cart
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cartItems.push({
        id: uuidv4(),
        product: product as Product,
        quantity: quantity
      });
    }

    // Save updated cart
    saveCartItems(cartItems);
    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    return false;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = (itemId: string, newQuantity: number): boolean => {
  try {
    if (newQuantity < 1) return false;

    const cartItems = getCartItems();
    const itemIndex = cartItems.findIndex(item => item.id === itemId);

    if (itemIndex === -1) return false;

    cartItems[itemIndex].quantity = newQuantity;
    saveCartItems(cartItems);
    return true;
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    return false;
  }
};

// Remove item from cart
export const removeFromCart = (itemId: string): boolean => {
  try {
    const cartItems = getCartItems();
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    saveCartItems(updatedItems);
    return true;
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return false;
  }
};

// Clear cart
export const clearCart = (): void => {
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(cartUpdateEvent);
};

// Get total cart items count
export const getCartItemsCount = (): number => {
  const cartItems = getCartItems();
  return cartItems.reduce((total, item) => total + item.quantity, 0);
};

// Get total cart value
export const getCartTotal = (): number => {
  const cartItems = getCartItems();
  return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
};

// Place order
export const placeOrder = async (doctorId: string): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const cartItems = getCartItems();

    if (cartItems.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    // Try to use the ensure_doctor_exists function first
    try {
      console.log("Ensuring doctor record exists using RPC function");

      // Get user data from auth
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error("Error getting user data:", userError);
        return { success: false, error: "User authentication error. Please log in again." };
      }

      // Call the RPC function to ensure doctor exists
      const { data: ensureDoctorData, error: ensureDoctorError } = await supabase.rpc(
        'ensure_doctor_exists',
        {
          p_user_id: doctorId,
          p_name: userData.user.user_metadata?.name || null,
          p_phone: userData.user.user_metadata?.phone || null,
          p_address: userData.user.user_metadata?.address || null,
          p_gst_number: userData.user.user_metadata?.gstNumber || null,
          p_email: userData.user.email || null,
          p_is_approved: true // Auto-approve for now to allow order placement
        }
      );

      if (ensureDoctorError) {
        console.warn("RPC function failed, falling back to direct query:", ensureDoctorError);
        throw ensureDoctorError; // This will trigger the fallback approach
      }

      console.log("Doctor record ensured via RPC:", ensureDoctorData);
    } catch (rpcError) {
      // Fallback: Check if doctor exists and create if needed
      console.log("Using fallback approach to ensure doctor record exists");

      // First, verify that a doctor record exists for this user
      const { data: doctorExists, error: doctorCheckError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', doctorId)
        .single();

      // If doctor doesn't exist, create one
      if (doctorCheckError || !doctorExists) {
        console.log("Doctor record not found, attempting to create one");

        // Get user data from auth
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          console.error("Error getting user data:", userError);
          return { success: false, error: "User authentication error. Please log in again." };
        }

        // Create doctor record
        const { error: createDoctorError } = await supabase
          .from('doctors')
          .insert({
            id: doctorId,
            name: userData.user.user_metadata?.name || 'Unknown Doctor',
            phone: userData.user.user_metadata?.phone || 'N/A',
            address: userData.user.user_metadata?.address || 'N/A',
            gst_number: userData.user.user_metadata?.gstNumber || 'N/A',
            is_approved: true, // Auto-approve for now to allow order placement
            email: userData.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createDoctorError) {
          console.error("Error creating doctor record:", createDoctorError);
          return { success: false, error: "Failed to create doctor profile. Please contact support." };
        }

        console.log("Doctor record created successfully");
      }
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.product.price * item.quantity),
      0
    );

    // Insert order record
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        doctor_id: doctorId,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select('id')
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return { success: false, error: orderError.message };
    }

    const orderId = orderData.id;

    // Insert order items
    const orderItems = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.product.id,
      quantity: item.quantity,
      price_per_unit: item.product.price,
      total_price: item.product.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Error adding order items:", itemsError);
      // Try to delete the order if adding items failed
      await supabase.from('orders').delete().eq('id', orderId);
      return { success: false, error: itemsError.message };
    }

    // Get doctor information for notification
    const { data: doctorData, error: doctorError } = await supabase
      .from('doctors')
      .select('name, phone')
      .eq('id', doctorId)
      .single();

    if (!doctorError && doctorData) {
      // Send WhatsApp notification to admin
      try {
        // Get a summary of items for the notification
        const itemSummary = cartItems.map(item =>
          `${item.product.name} x ${item.quantity}`
        ).join(', ');

        // Add safe type checking for doctor data
        const doctorName = doctorData && typeof doctorData === 'object' && 'name' in doctorData ? doctorData.name : 'Unknown Doctor';
        const doctorPhone = doctorData && typeof doctorData === 'object' && 'phone' in doctorData ? doctorData.phone : 'No Phone';

        // Call the serverless function to notify admin
        await supabase.functions.invoke('notify-admin-new-order', {
          body: {
            orderId,
            doctorName,
            doctorPhone,
            totalAmount,
            itemCount: cartItems.length,
            itemSummary
          }
        });
      } catch (notifyError) {
        console.error("Error notifying admin:", notifyError);
        // We don't fail the order just because notification failed
      }
    }

    // Clear the cart
    clearCart();

    return { success: true, orderId };
  } catch (error: any) {
    console.error("Error placing order:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
};
