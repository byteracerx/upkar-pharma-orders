
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">UPKEM LABS</h1>
              <p className="text-xs text-gray-600">We Build trust not medicine</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search medicines..." 
                className="pl-10 bg-gray-50"
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="#products" className="text-gray-700 hover:text-green-600 transition-colors">Products</a>
            <a href="#about" className="text-gray-700 hover:text-green-600 transition-colors">About Us</a>
            <a href="#contact" className="text-gray-700 hover:text-green-600 transition-colors">Contact</a>
            <Button variant="ghost" className="text-gray-700">Login</Button>
            <Button className="bg-green-600 hover:bg-green-700">Register</Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
