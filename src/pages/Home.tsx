
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import PhotoGallery from "@/components/home/PhotoGallery";
import CtaSection from "@/components/home/CtaSection";
import { useAuth } from "@/contexts/AuthContext";
import ProductList from "@/components/products/ProductList";
import { Loader2 } from "lucide-react";

const Home = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-upkar-blue" />
      </div>
    );
  }
  
  return (
    <Layout>
      {!isAuthenticated && (
        <>
          <HeroSection />
          <FeaturesSection />
          <PhotoGallery />
          <TestimonialsSection />
        </>
      )}
      
      {isAuthenticated && (
        <div className="container-custom py-8">
          <h1 className="text-3xl font-bold mb-8">Browse Products</h1>
          <ProductList />
        </div>
      )}
      
      {!isAuthenticated && <CtaSection />}
    </Layout>
  );
};

export default Home;
