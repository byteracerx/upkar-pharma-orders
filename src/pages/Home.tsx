
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";
import { useAuth } from "@/contexts/AuthContext";
import ProductList from "@/components/products/ProductList";

const Home = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Layout>
      {!isAuthenticated && (
        <>
          <HeroSection />
          <FeaturesSection />
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
