
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-green-700 to-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">UPKEM LABS</h1>
                <p className="text-green-100">We Build trust not medicine</p>
              </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              No calls, just clicks
            </h2>
            
            <p className="text-xl text-green-100 mb-8">
              Best quality medicines at affordable prices
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-green-700 hover:bg-gray-100 font-semibold"
              >
                Register Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-700"
              >
                Browse Products
              </Button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">Search Medicines</h3>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />
              <Input 
                placeholder="Search by medicine name" 
                className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-gray-300 h-12"
              />
              <Button className="absolute right-2 top-2 bg-green-600 hover:bg-green-700 h-8">
                Search
              </Button>
            </div>
            
            <div>
              <p className="text-green-100 mb-3">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {['Paracetamol', 'Antibiotics', 'Vitamins', 'Insulin'].map((item) => (
                  <Button
                    key={item}
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 text-white hover:bg-white/30 border-white/30"
                  >
                    {item}
                  </Button>
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
