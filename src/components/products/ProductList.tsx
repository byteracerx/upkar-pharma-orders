
import { useState } from "react";
import ProductCard from "./ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock product data
const mockProducts = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    price: 5.99,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500",
    category: "Pain Relief",
    description: "Paracetamol 500mg tablets for pain relief and fever reduction."
  },
  {
    id: "2",
    name: "Amoxicillin 250mg",
    price: 12.50,
    image: "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?auto=format&fit=crop&q=80&w=500",
    category: "Antibiotics",
    description: "Amoxicillin 250mg capsules, broad-spectrum antibiotic."
  },
  {
    id: "3",
    name: "Vitamin D3 1000 IU",
    price: 8.75,
    image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=500",
    category: "Vitamins",
    description: "Vitamin D3 1000 IU supplements for bone health."
  },
  {
    id: "4",
    name: "Ibuprofen 400mg",
    price: 6.25,
    image: "https://images.unsplash.com/photo-1626716493177-0f09a8590a8f?auto=format&fit=crop&q=80&w=500",
    category: "Pain Relief",
    description: "Ibuprofen 400mg tablets for pain and inflammation."
  },
  {
    id: "5",
    name: "Omeprazole 20mg",
    price: 15.30,
    image: "https://images.unsplash.com/photo-1550989460-5a25c90cc7fe?auto=format&fit=crop&q=80&w=500",
    category: "Gastrointestinal",
    description: "Omeprazole 20mg capsules to reduce stomach acid production."
  },
  {
    id: "6",
    name: "Cetirizine 10mg",
    price: 7.45,
    image: "https://images.unsplash.com/photo-1550989460-091582563d48?auto=format&fit=crop&q=80&w=500",
    category: "Allergy",
    description: "Cetirizine 10mg tablets for allergy relief."
  },
  {
    id: "7",
    name: "Metformin 500mg",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&q=80&w=500",
    category: "Diabetes",
    description: "Metformin 500mg tablets for type 2 diabetes management."
  },
  {
    id: "8",
    name: "Amlodipine 5mg",
    price: 11.25,
    image: "https://images.unsplash.com/photo-1550989459-6169adb022a3?auto=format&fit=crop&q=80&w=500",
    category: "Cardiovascular",
    description: "Amlodipine 5mg tablets for high blood pressure treatment."
  }
];

const categories = ["All Categories", "Pain Relief", "Antibiotics", "Vitamins", "Gastrointestinal", "Allergy", "Diabetes", "Cardiovascular"];

const ProductList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
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
            <Button>
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
