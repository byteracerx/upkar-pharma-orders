import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  User,
  Search
} from "lucide-react";
import { fetchProducts, Product } from "@/services/productService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserDisplayName } from "@/utils/user-helpers";

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container-custom mx-auto">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/65d9d55e-5ea8-491a-8500-3328aa065695.png" 
              alt="Upkem Labs Logo" 
              className="h-10" 
            />
            <div className="flex flex-col">
              <span className="text-xl font-poppins font-bold text-upkem-green">UPKEM LABS</span>
              <span className="text-xs text-gray-500">We Build trust not medicine</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex relative" ref={searchRef}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search medicines..."
                className="w-64 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md z-50 max-h-80 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                    onClick={() => handleSearchSelect(product.id)}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">₹{product.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-gray-600 hover:text-upkem-green transition-colors">
              Products
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-upkem-green transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-upkem-green transition-colors">
              Contact
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="relative">
                  <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-upkem-green transition-colors" />
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1">
                      <span>{getUserDisplayName(user)}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {isAdmin ? 'Admin Account' : 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <User className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>Manage Orders</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>My Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="outline" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <Link
                to="/products"
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/about"
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/cart"
                    className="px-4 py-2 flex items-center text-gray-600 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    <span>Cart</span>
                  </Link>
                  
                  <Link
                    to={isAdmin ? "/admin" : "/dashboard"}
                    className="px-4 py-2 flex items-center text-gray-600 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="mr-2 h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  
                  <button
                    className="px-4 py-2 flex items-center text-gray-600 hover:bg-gray-100 rounded-md"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button className="w-full bg-upkem-green hover:bg-upkem-green/90" asChild>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
