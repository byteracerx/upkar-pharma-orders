
import { supabase } from "@/integrations/supabase/client";
import { Product } from "./productService";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

// Local storage key
const CART_STORAGE_KEY = "upkar_cart";

// Get cart items from local storage
export const getCartItems = (): CartItem[] => {
  const cartData = localStorage.getItem(CART_STORAGE_KEY);
  if (!cartData) return [];
  
  try {
    return JSON.parse(cartData);
  } catch (error) {
    console.error("Error parsing cart data:", error);
    return [];
  }
};

// Add product to cart
export const addToCart = async (productId: string, quantity: number): Promise<boolean> => {
  try {
    // Fetch the product details
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();
    
    if (error || !product) {
      console.error("Error fetching product:", error);
      return false;
    }
    
    // Get current cart
    const currentCart = getCartItems();
    
    // Check if item already exists in cart
    const existingItemIndex = currentCart.findIndex(item => item.product_id === productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item if it doesn't exist
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        product_id: productId,
        quantity,
        product: product as Product,
      };
      currentCart.push(newItem);
    }
    
    // Save to local storage
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));
    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    return false;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = (itemId: string, quantity: number): boolean => {
  try {
    const currentCart = getCartItems();
    const itemIndex = currentCart.findIndex(item => item.id === itemId);
    
    if (itemIndex < 0) return false;
    
    currentCart[itemIndex].quantity = quantity;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));
    return true;
  } catch (error) {
    console.error("Error updating cart item:", error);
    return false;
  }
};

// Remove item from cart
export const removeFromCart = (itemId: string): boolean => {
  try {
    const currentCart = getCartItems();
    const updatedCart = currentCart.filter(item => item.id !== itemId);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
    return true;
  } catch (error) {
    console.error("Error removing from cart:", error);
    return false;
  }
};

// Clear the entire cart
export const clearCart = (): void => {
  localStorage.removeItem(CART_STORAGE_KEY);
};

// Place order from cart items
export const placeOrder = async (doctorId: string): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const cartItems = getCartItems();
    
    if (cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }
    
    // Calculate total amount
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.product.price * item.quantity),
      0
    );
    
    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        doctor_id: doctorId,
        total_amount: totalAmount,
        status: "pending",
      })
      .select()
      .single();
    
    if (orderError || !orderData) {
      console.error("Error creating order:", orderError);
      return { success: false, error: orderError?.message || "Failed to create order" };
    }
    
    const orderId = orderData.id;
    
    // Insert order items
    const orderItems = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price_per_unit: item.product.price,
      total_price: item.product.price * item.quantity,
    }));
    
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);
    
    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      return { success: false, error: itemsError.message };
    }
    
    // Fetch doctor information for notification
    const { data: doctorData, error: doctorError } = await supabase
      .from("doctors")
      .select("name, phone")
      .eq("id", doctorId)
      .single();
      
    if (!doctorError && doctorData) {
      // Send notification to admin
      try {
        const response = await supabase.functions.invoke('notify-admin-new-order', {
          body: {
            orderId,
            doctorName: doctorData.name,
            doctorPhone: doctorData.phone,
            totalAmount: totalAmount,
            itemCount: cartItems.length
          }
        });
        
        console.log("Admin notification sent:", response);
      } catch (notifyError) {
        console.error("Failed to send admin notification:", notifyError);
        // We don't fail the order just because notification failed
      }
    }
    
    // Update doctor's credit balance
    try {
      const { error: creditError } = await supabase.rpc('update_doctor_credit', {
        p_doctor_id: doctorId,
        p_amount: totalAmount
      });
      
      if (creditError) {
        console.error("Error updating doctor credit:", creditError);
      }
    } catch (creditUpdateError) {
      console.error("Failed to update credit balance:", creditUpdateError);
      // We don't fail the order just because credit update failed
    }
    
    // Clear the cart after successful order
    clearCart();
    
    return { success: true, orderId };
  } catch (error: any) {
    console.error("Error placing order:", error);
    return { success: false, error: error.message };
  }
};
