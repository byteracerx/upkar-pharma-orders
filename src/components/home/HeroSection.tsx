
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { fetchProducts, Product } from "@/services/productService";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async () => {
    try {
      const results = await fetchProducts(searchQuery);
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
      setShowResults(true);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const handleSearchSelect = (productId: string) => {
    navigate(`/products/${productId}`);
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <section className="bg-gradient-to-b from-upkem-green to-upkem-dark-green text-white py-16">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/lovable-uploads/65d9d55e-5ea8-491a-8500-3328aa065695.png" 
                alt="Upkem Labs Logo" 
                className="h-16 w-16" 
              />
              <div>
                <h1 className="text-3xl font-bold">UPKEM LABS</h1>
                <p className="text-sm text-gray-200">We Build trust not medicine</p>
              </div>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold leading-tight">
              No calls, just clicks
            </h2>
            <p className="text-lg md:text-xl opacity-90">
              Best quality medicines at affordable prices
            </p>
            
            <div className="flex items-center gap-4">
              <Button asChild size="lg" className="bg-white text-upkem-green hover:bg-gray-100">
                <Link to="/register">Register Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
          
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm" ref={searchRef}>
            <h2 className="text-xl font-semibold mb-4">Search Medicines</h2>
            <div className="flex gap-2">
              <div className="flex-grow relative">
                <Input 
                  placeholder="Search by medicine name" 
                  className="bg-white/80 border-0 focus-visible:ring-white" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowResults(true)}
                />
                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md z-50 max-h-80 overflow-y-auto">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                        onClick={() => handleSearchSelect(product.id)}
                      >
                        <div className="font-medium text-gray-800">{product.name}</div>
                        <div className="text-sm text-gray-500">₹{product.price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                className="bg-white text-upkem-green hover:bg-gray-100"
                onClick={performSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <div className="mt-4">
              <p className="text-sm mb-2">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {["Paracetamol", "Antibiotics", "Vitamins", "Insulin"].map((term) => (
                  <span 
                    key={term} 
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm cursor-pointer transition"
                    onClick={() => {
                      setSearchQuery(term);
                      performSearch();
                    }}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
