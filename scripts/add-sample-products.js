// Script to add sample products only
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Available' : 'Not available');

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.log('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample products data
const sampleProducts = [
  {
    name: 'Paracetamol 500mg',
    description: 'Pain reliever and fever reducer. Used for mild to moderate pain and fever.',
    price: 25.50,
    category: 'Pain Relief',
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Amoxicillin 250mg',
    description: 'Antibiotic used to treat a number of bacterial infections.',
    price: 75.00,
    category: 'Antibiotics',
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Cetirizine 10mg',
    description: 'Antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, itching, and sneezing.',
    price: 35.75,
    category: 'Allergy Relief',
    stock: 75,
    image_url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Omeprazole 20mg',
    description: 'Proton pump inhibitor used to treat certain stomach and esophagus problems.',
    price: 85.25,
    category: 'Digestive Health',
    stock: 60,
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Metformin 500mg',
    description: 'Oral diabetes medicine that helps control blood sugar levels.',
    price: 45.50,
    category: 'Diabetes Care',
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

// Add sample products
async function addSampleProducts() {
  try {
    console.log('Adding sample products...');
    
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log('Sample products added:', data);
    return data;
  } catch (error) {
    console.error('Error adding sample products:', error);
    throw error;
  }
}

// Main function to run the script
async function main() {
  try {
    // Add sample products
    const products = await addSampleProducts();
    console.log('Added', products.length, 'sample products');
    
    console.log('Sample products added successfully!');
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

// Run the script
main();