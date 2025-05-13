
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const EmptyCart = () => {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
      <p className="text-gray-600 mb-6">Add medicines to your cart to place an order.</p>
      <Button asChild>
        <Link to="/products">Browse Products</Link>
      </Button>
    </div>
  );
};

export default EmptyCart;
