import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  Pill,
  ChevronLeft,
  ShoppingCart,
  Plus,
  Minus
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock product data
const mockProducts = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    price: 5.99,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500",
    category: "Pain Relief",
    description: "Paracetamol 500mg tablets for pain relief and fever reduction. Each tablet contains 500mg of Paracetamol (Acetaminophen). Used to treat mild to moderate pain including headache, toothache, backache, period pain, and high temperature.",
    manufacturer: "Cipla Pharmaceuticals",
    pack: "Strip of 10 tablets",
    dosage: "One or two tablets every 4-6 hours as needed, not exceeding 8 tablets in 24 hours."
  },
  {
    id: "2",
    name: "Amoxicillin 250mg",
    price: 12.50,
    image: "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?auto=format&fit=crop&q=80&w=500",
    category: "Antibiotics",
    description: "Amoxicillin 250mg capsules, broad-spectrum antibiotic used to treat a wide range of bacterial infections, including respiratory tract, urinary tract, and skin infections.",
    manufacturer: "Sun Pharmaceuticals",
    pack: "Strip of 10 capsules",
    dosage: "One capsule three times daily or as directed by the physician."
  },
  // Other products...
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  
  // Find the product with the matching ID
  const product = mockProducts.find(p => p.id === id);
  
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
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (isAuthenticated) {
      // Add to cart logic would go here
      toast({
        title: "Added to Cart",
        description: `${quantity} ${quantity === 1 ? 'unit' : 'units'} of ${product.name} added to your cart.`,
      });
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
              src={product.image} 
              alt={product.name} 
              className="w-full h-auto object-contain rounded-md"
              style={{ maxHeight: "400px" }}
            />
          </div>
          
          {/* Product Details */}
          <div>
            <span className="inline-block bg-upkar-light-gray text-gray-600 px-3 py-1 rounded-full text-sm font-medium mb-2">
              {product.category}
            </span>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center mb-4">
              <Pill className="h-5 w-5 text-upkar-blue mr-2" />
              <span className="text-gray-600">{product.manufacturer}</span>
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
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                  <button 
                    onClick={incrementQuantity}
                    className="px-3 py-2 hover:bg-gray-100"
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
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-medium w-24">Pack:</span>
                  <span className="text-gray-600">{product.pack}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Dosage:</span>
                  <span className="text-gray-600">{product.dosage}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
