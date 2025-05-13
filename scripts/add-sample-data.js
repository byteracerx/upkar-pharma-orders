// Script to add a sample doctor account and products
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample doctor data
const sampleDoctor = {
  email: 'doctor.sample@example.com',
  password: 'Password123!',
  userData: {
    name: 'Dr. Sample Doctor',
    phone: '9876543210',
    address: '123 Medical Street, Healthcare City, India',
    gstNumber: 'GSTIN1234567890Z',
  }
};

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

// Create doctor account
async function createDoctorAccount() {
  try {
    console.log('Creating doctor account...');
    
    // Sign up the doctor
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sampleDoctor.email,
      password: sampleDoctor.password,
      options: {
        data: sampleDoctor.userData
      }
    });
    
    if (authError) {
      throw authError;
    }
    
    console.log('Doctor account created in auth system:', authData.user.id);
    
    // Add doctor to doctors table
    const { data: doctorData, error: doctorError } = await supabase
      .from('doctors')
      .insert({
        id: authData.user.id,
        name: sampleDoctor.userData.name,
        phone: sampleDoctor.userData.phone,
        address: sampleDoctor.userData.address,
        gst_number: sampleDoctor.userData.gstNumber,
        is_approved: true, // Auto-approve for this sample
        created_at: new Date().toISOString()
      })
      .select();
    
    if (doctorError) {
      throw doctorError;
    }
    
    console.log('Doctor added to doctors table:', doctorData);
    
    return authData.user.id;
  } catch (error) {
    console.error('Error creating doctor account:', error);
    throw error;
  }
}

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
    // Create doctor account
    const doctorId = await createDoctorAccount();
    console.log('Doctor account created with ID:', doctorId);
    
    // Add sample products
    const products = await addSampleProducts();
    console.log('Added', products.length, 'sample products');
    
    console.log('Sample data added successfully!');
    console.log('Doctor login credentials:');
    console.log('Email:', sampleDoctor.email);
    console.log('Password:', sampleDoctor.password);
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

// Run the script
main();