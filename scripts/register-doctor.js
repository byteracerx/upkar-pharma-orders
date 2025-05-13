// Script to register a sample doctor account
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

// Sample doctor data
const sampleDoctor = {
  email: 'doctor.sample2@example.com',
  password: 'Password123!',
  userData: {
    name: 'Dr. Sample Doctor 2',
    phone: '9876543211',
    address: '123 Medical Street, Healthcare City, India',
    gstNumber: 'GSTIN1234567891Z',
  }
};

// Register doctor account
async function registerDoctor() {
  try {
    console.log('Registering doctor account...');
    
    // Sign up the doctor
    const { data, error } = await supabase.auth.signUp({
      email: sampleDoctor.email,
      password: sampleDoctor.password,
      options: {
        data: sampleDoctor.userData
      }
    });
    
    if (error) {
      throw error;
    }
    
    console.log('Doctor account registered successfully!');
    console.log('User ID:', data.user.id);
    console.log('\nDoctor login credentials:');
    console.log('Email:', sampleDoctor.email);
    console.log('Password:', sampleDoctor.password);
    console.log('\nNote: You will need to approve this doctor account through the admin interface.');
    
    return data.user.id;
  } catch (error) {
    console.error('Error registering doctor account:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await registerDoctor();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main();