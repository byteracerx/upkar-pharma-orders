
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="section-padding bg-upkar-blue text-white">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center">
              <Pill className="h-8 w-8 mr-2" />
              <h2 className="text-2xl md:text-3xl font-bold">Join Upkar Pharma Today</h2>
            </div>
            <p className="text-lg opacity-90">
              Register now and experience the most efficient way to order pharmaceuticals for your practice.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button asChild size="lg" className="bg-white text-upkar-blue hover:bg-gray-100">
              <Link to="/register">Register Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
