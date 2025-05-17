
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getCartItems, updateCartItemQuantity, removeFromCart, placeOrder, CartItem } from "@/services/cartService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CartTable from "@/components/cart/CartTable";
import OrderSummary from "@/components/cart/OrderSummary";
import EmptyCart from "@/components/cart/EmptyCart";

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load cart items from localStorage
    const items = getCartItems();
    setCartItems(items);
    setIsLoading(false);
  }, []);
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 50.00 : 0;
  const total = subtotal + shipping;
  
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const success = updateCartItemQuantity(id, newQuantity);
    if (success) {
      // Update local state
      setCartItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };
  
  const handleRemoveItem = (id: string) => {
    const success = removeFromCart(id);
    if (success) {
      setCartItems(prev => prev.filter(item => item.id !== id));
      toast.success("Item Removed", {
        description: "The item has been removed from your cart."
      });
    }
  };
  
  const handlePlaceOrder = async () => {
    if (!user?.id) {
      toast.error("Authentication Required", {
        description: "You need to be logged in to place an order."
      });
      navigate("/login");
      return;
    }
    
    // Prevent admins from placing orders
    if (user.isAdmin) {
      toast.error("Admin Cannot Place Orders", {
        description: "As an admin, you cannot place orders. This functionality is only for doctors."
      });
      return;
    }
    
    setIsPlacingOrder(true);
    
    try {
      const result = await placeOrder(user.id);
      
      if (result.success) {
        setOrderId(result.orderId);
        setOrderSuccessOpen(true);
        setCartItems([]);
      } else {
        toast.error("Order Failed", {
          description: result.error || "There was an issue placing your order. Please try again."
        });
      }
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error("Error", {
        description: error.message || "An unexpected error occurred. Please try again later."
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };
  
  const viewOrderDetails = () => {
    setOrderSuccessOpen(false);
    navigate("/dashboard");
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="flex items-center text-gray-600 hover:text-upkar-blue">
            <Link to="/products">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Continue Shopping
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center mb-8">
          <ShoppingCart className="h-6 w-6 mr-2 text-upkar-blue" />
          <h1 className="text-3xl font-bold">Your Cart</h1>
        </div>
        
        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CartTable 
                cartItems={cartItems}
                updateQuantity={updateQuantity}
                handleRemoveItem={handleRemoveItem}
              />
            </div>
            
            <OrderSummary 
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              user={user}
              isPlacingOrder={isPlacingOrder}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>
        )}

        {/* Order Success Dialog */}
        <Dialog open={orderSuccessOpen} onOpenChange={setOrderSuccessOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order Placed Successfully!</DialogTitle>
              <DialogDescription>
                Your order has been placed and will be processed shortly.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="font-medium">Order ID: {orderId}</p>
              <p className="text-gray-600 mt-2">
                You can check the status of your order in your dashboard.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={viewOrderDetails}>View Order Details</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Cart;
