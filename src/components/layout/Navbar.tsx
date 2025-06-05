
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, ShoppingCart } from "lucide-react";
import { CartBadge } from "@/components/cart/CartBadge";

export default function Navbar() {
  const { isAuthenticated, isAdmin, isApproved, isRejected, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Navigation items for approved doctors
  const doctorNavItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Products", href: "/products" },
    { label: "Orders", href: "/orders" },
    { label: "Profile", href: "/profile" },
    { label: "Credit History", href: "/credit-history" },
  ];

  // Public navigation items
  const publicNavItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-upkar-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Upkar Pharma</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Navigation Links */}
            {isAuthenticated && !isAdmin && isApproved && !isRejected ? (
              // Approved doctor navigation
              doctorNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-gray-700 hover:text-upkar-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))
            ) : (
              // Public navigation
              publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-gray-700 hover:text-upkar-blue px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))
            )}

            {/* Cart Icon for approved doctors */}
            {isAuthenticated && !isAdmin && isApproved && !isRejected && (
              <div className="flex items-center">
                <CartBadge />
              </div>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {!isAdmin && (
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-upkar-blue flex items-center space-x-1"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                )}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Mobile Cart Icon for approved doctors */}
            {isAuthenticated && !isAdmin && isApproved && !isRejected && (
              <CartBadge />
            )}
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-upkar-blue focus:outline-none focus:text-upkar-blue"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {/* Navigation Links */}
              {isAuthenticated && !isAdmin && isApproved && !isRejected ? (
                // Approved doctor navigation
                doctorNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-gray-700 hover:text-upkar-blue block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                // Public navigation
                publicNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-gray-700 hover:text-upkar-blue block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))
              )}

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  {!isAdmin && (
                    <Link
                      to="/profile"
                      className="text-gray-700 hover:text-upkar-blue block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-700 hover:text-upkar-blue block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="pt-4 pb-3 border-t border-gray-200 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
