
import ProductList from "@/components/products/ProductList";

const Products = () => {
  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-2">Products</h1>
      <p className="text-gray-600 mb-8">Browse our extensive catalog of pharmaceutical products</p>
      
      <ProductList />
    </div>
  );
};

export default Products;
