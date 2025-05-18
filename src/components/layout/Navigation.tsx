
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { CartBadge } from "@/components/cart/CartBadge";

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container-custom mx-auto py-4">
        <div className="flex justify-between items-center">
          <div>
            <Link to="/" className="text-2xl font-bold text-upkar-blue">
              Upkar Pharma
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            {user ? (
              <>
                {/* Navigation links for logged-in users */}
                <Link to="/products" className="text-gray-600 hover:text-upkar-blue">
                  Products
                </Link>
                <Link to="/orders" className="text-gray-600 hover:text-upkar-blue">
                  Orders
                </Link>
                
                {/* Cart icon with badge */}
                <CartBadge />
                
                {/* User dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-upkar-light-blue text-upkar-blue">
                          {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={isAdmin ? "/admin" : "/profile"} className="w-full cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>{isAdmin ? "Admin Dashboard" : "Profile"}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
