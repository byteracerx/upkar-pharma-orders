
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { getCartItems } from "@/services/cartService";

export const CartBadge = () => {
  const [itemCount, setItemCount] = useState(0);
  
  useEffect(() => {
    // Get initial cart count
    updateCartCount();
    
    // Set up event listener for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    
    // Also listen for storage changes in case cart is updated in another tab
    window.addEventListener('storage', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);
  
  const updateCartCount = () => {
    const cartItems = getCartItems();
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    setItemCount(count);
  };
  
  return (
    <Link to="/cart" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-upkar-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
};
