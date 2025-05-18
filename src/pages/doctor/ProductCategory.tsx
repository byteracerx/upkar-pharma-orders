
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductList from "@/components/products/ProductList";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ProductCategory = () => {
  const { category } = useParams<{ category: string }>();
  const [categoryName, setCategoryName] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    // Format the category name nicely for display
    if (category) {
      const formatted = category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setCategoryName(formatted);
    }
  }, [category]);

  return (
    <Layout>
      <div className="container-custom py-8">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mb-6 flex items-center text-gray-600 hover:text-upkar-blue">
          <ChevronLeft className="h-4 w-4 mr-1" />
          All Categories
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
        <p className="text-gray-600 mb-8">Browse our selection of {categoryName.toLowerCase()} products</p>
        
        <ProductList category={category} />
      </div>
    </Layout>
  );
};

export default ProductCategory;
