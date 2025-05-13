import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pill,
  ChevronLeft,
  ShoppingCart,
  Plus,
  Minus,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchProductById, Product } from "@/services/productService";
import { addToCart } from "@/services/cartService";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;
  
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const productData = await fetchProductById(id);
        setProduct(productData);
      } catch (error) {
        console.error("Failed to load product:", error);
        toast.toast.error("Error", {
          description: "Failed to load product details. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [id]);
  
  if (loading) {
    return (
      <Layout>
        <div className="container-custom py-8 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
        </div>
      </Layout>
    );
  }
  
  if (!product) {
    return (
      <Layout>
        <div className="container-custom py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/products">Back to Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, product.stock));
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (isAuthenticated) {
      const success = await addToCart(product.id, quantity);
      
      if (success) {
        toast.toast.success("Added to Cart", {
          description: `${quantity} ${quantity === 1 ? 'unit' : 'units'} of ${product.name} added to your cart.`
        });
      } else {
        toast.toast.error("Error", {
          description: "Failed to add product to cart. Please try again."
        });
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="flex items-center text-gray-600 hover:text-upkar-blue">
            <Link to="/products">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Products
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white p-4 rounded-lg shadow">
            <img 
              src={product.image_url || "https://via.placeholder.com/500x400?text=No+Image"} 
              alt={product.name} 
              className="w-full h-auto object-contain rounded-md"
              style={{ maxHeight: "400px" }}
            />
          </div>
          
          {/* Product Details */}
          <div>
            <span className="inline-block bg-upkar-light-gray text-gray-600 px-3 py-1 rounded-full text-sm font-medium mb-2">
              {product.category || "General"}
            </span>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center mb-4">
              <Pill className="h-5 w-5 text-upkar-blue mr-2" />
              <span className="text-gray-600">In stock: {product.stock} units</span>
            </div>
            <p className="text-2xl font-semibold text-upkar-blue mb-6">
              ₹{product.price.toFixed(2)}
              <span className="text-sm text-gray-500 ml-1">per unit</span>
            </p>
            
            {isAuthenticated && (
              <div className="flex items-center mb-6">
                <div className="border border-gray-300 rounded-md flex items-center mr-4">
                  <button 
                    onClick={decrementQuantity} 
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                  <button 
                    onClick={incrementQuantity}
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <Button onClick={handleAddToCart} className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            )}
            
            {!isAuthenticated && (
              <div className="mb-6">
                <Button asChild>
                  <Link to="/login">Log in to Purchase</Link>
                </Button>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold mb-2">Product Description</h2>
              <p className="text-gray-600 mb-4">{product.description || "No description available for this product."}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
