
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  stock: number;
}

export const fetchProducts = async (searchQuery?: string): Promise<Product[]> => {
  try {
    let query = supabase.from("products").select("*");
    
    if (searchQuery && searchQuery.trim() !== "") {
      query = query.ilike("name", `%${searchQuery}%`);
    }
    
    const { data, error } = await query.order("name");
    
    if (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
    
    return data as Product[];
  } catch (error) {
    console.error("Error in fetchProducts:", error);
    throw error;
  }
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") {
        // Product not found (no rows returned)
        return null;
      }
      console.error("Error fetching product:", error);
      throw error;
    }
    
    return data as Product;
  } catch (error) {
    console.error("Error in fetchProductById:", error);
    throw error;
  }
};
