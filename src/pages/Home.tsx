
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import PhotoGallery from "@/components/home/PhotoGallery";
import CtaSection from "@/components/home/CtaSection";
import { useAuth } from "@/contexts/AuthContext";
import ProductList from "@/components/products/ProductList";

const Home = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return (
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-8">Browse Products</h1>
        <ProductList />
      </div>
    );
  }
  
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PhotoGallery />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
};

export default Home;
