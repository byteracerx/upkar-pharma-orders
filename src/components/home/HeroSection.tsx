
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="hero-section section-padding">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Simplified Pharmaceutical Ordering for Medical Professionals
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              No calls, just clicks. Order medicines and supplies directly through our platform.
            </p>
            
            <div className="flex items-center gap-4">
              <Button asChild size="lg" className="bg-white text-upkar-blue hover:bg-gray-100">
                <Link to="/register">Register Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
          
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Search Medicines</h2>
            <div className="flex gap-2">
              <div className="flex-grow">
                <Input 
                  placeholder="Search by medicine name" 
                  className="bg-white/80 border-0 focus-visible:ring-white" 
                />
              </div>
              <Button className="bg-white text-upkar-blue hover:bg-gray-100">
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
