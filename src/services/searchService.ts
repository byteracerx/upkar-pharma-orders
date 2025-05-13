import { Product, fetchProducts } from './productService';

// Custom hook for debounced search
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Search products with debounce
export const searchProducts = async (query: string): Promise<Product[]> => {
  if (!query || query.trim() === '') {
    return [];
  }
  
  try {
    return await fetchProducts(query);
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Custom hook for product search
export const useProductSearch = (initialQuery: string = '') => {
  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  const debouncedQuery = useDebounce(query, 300);
  
  React.useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const products = await searchProducts(debouncedQuery);
        setResults(products);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [debouncedQuery]);
  
  return { query, setQuery, results, loading, error };
};

import React from 'react';