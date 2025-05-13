
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  total: number;
  user: User | null;
  isPlacingOrder: boolean;
  onPlaceOrder: () => void;
}

const OrderSummary = ({ 
  subtotal, 
  shipping, 
  total, 
  user, 
  isPlacingOrder, 
  onPlaceOrder 
}: OrderSummaryProps) => {
  return (
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
          <div className="text-sm font-medium mb-2">Order Information:</div>
          <div className="text-gray-600 text-sm">
            <p>• Your order will be reviewed by our team</p>
            <p>• You'll receive a WhatsApp notification when your order status changes</p>
            <p>• An invoice will be sent to your email once your order is accepted</p>
          </div>
        </div>
      )}
      
      <Button 
        className="w-full" 
        onClick={onPlaceOrder} 
        disabled={isPlacingOrder || subtotal === 0}
      >
        {isPlacingOrder ? "Processing..." : "Place Order"}
      </Button>
    </div>
  );
};

export default OrderSummary;
