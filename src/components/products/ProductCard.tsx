
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/services/productService";
import { addToCart } from "@/services/cartService";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  const handleAddToCart = async () => {
    const success = await addToCart(product.id, 1);
    
    if (success) {
      toast.success("Added to cart", {
        description: `${product.name} has been added to your cart.`
      });
    } else {
      toast.error("Error", {
        description: "Could not add item to cart. Please try again."
      });
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <Link to={`/products/${product.id}`}>
        <div className="h-48 overflow-hidden">
          <img 
            src={product.image_url || "https://via.placeholder.com/300x200?text=No+Image"} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="mb-2">
          <span className="text-xs font-medium bg-upkar-light-gray text-gray-600 px-2 py-1 rounded-full">
            {product.category || "General"}
          </span>
        </div>
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="font-medium text-lg hover:text-upkar-blue transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-xl font-semibold mt-2 text-upkar-blue">
          ₹{product.price.toFixed(2)}
          <span className="text-sm text-gray-500 ml-1">per unit</span>
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {isAuthenticated ? (
          <Button className="w-full flex items-center gap-2" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        ) : (
          <div className="w-full grid grid-cols-2 gap-2">
            <Button variant="secondary" asChild>
              <Link to={`/products/${product.id}`}>View Details</Link>
            </Button>
            <Button variant="default" onClick={() => {
              toast.info("Login Required", {
                description: "Please login to add items to your cart."
              });
            }}>
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
