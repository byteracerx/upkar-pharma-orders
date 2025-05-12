
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Pill, 
  ShoppingCart, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

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
            <Pill className="h-8 w-8 text-upkar-blue" />
            <span className="text-xl font-poppins font-bold text-upkar-blue">Upkar Pharma</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-gray-600 hover:text-upkar-blue transition-colors">
              Products
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="relative">
                  <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-upkar-blue transition-colors" />
                  <span className="absolute -top-2 -right-2 bg-upkar-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    0
                  </span>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1">
                      <span>{user?.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
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
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/cart"
                    className="px-4 py-2 flex items-center justify-between text-gray-600 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Cart</span>
                    <div className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="absolute -top-2 -right-2 bg-upkar-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        0
                      </span>
                    </div>
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
                  <Button className="w-full" asChild>
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
