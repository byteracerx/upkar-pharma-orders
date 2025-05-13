import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchProducts, Product } from "@/services/productService";
import { toast } from "sonner";

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProducts();
        setProducts(data);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.map(product => product.category).filter(Boolean) as string[])
        );
        
        setCategories(["All Categories", ...uniqueCategories]);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast("Failed to load products. Please try again.", {
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  useEffect(() => {
    // Filter products based on search query and category
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);
  
  const handleSearch = () => {
    // Already handled by the effect, this is just for the search button
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-upkar-blue" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow flex gap-2">
            <div className="flex-grow">
              <Input
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="w-full md:w-64">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium">No products found</h3>
          <p className="text-gray-600 mt-2">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
