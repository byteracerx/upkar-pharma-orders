
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, ChevronLeft, Loader2, CheckCircle } from "lucide-react";
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
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add medicines to your cart to place an order.</p>
            <Button asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-16 w-16 flex-shrink-0">
                              <img 
                                className="h-full w-full object-cover rounded" 
                                src={item.product.image_url || "https://via.placeholder.com/150?text=No+Image"} 
                                alt={item.product.name} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                              <div className="text-sm text-gray-500">₹{item.product.price.toFixed(2)} per unit</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center border border-gray-300 rounded-md">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                              className="px-3 py-1 hover:bg-gray-100"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="px-3 py-1 border-x border-gray-300">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveItem(item.id)} 
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>₹{shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2 border-gray-200">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {user && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Delivery Address:</div>
                  <div className="text-gray-600 text-sm">
                    {user.name}<br />
                    {/* We would normally fetch and display the address from the DB */}
                    Doctor's Clinic Address<br />
                    Contact: {user.email}
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={handlePlaceOrder} 
                disabled={isPlacingOrder || cartItems.length === 0}
              >
                {isPlacingOrder ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
