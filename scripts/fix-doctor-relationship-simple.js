// Simple script to fix the doctor-user relationship issue
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

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

// Main function
async function main() {
  try {
    console.log('Fixing doctor-user relationship...');
    
    // 1. Check if the current user has a doctor record
    console.log('Checking if current user has a doctor record...');
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting current user:', userError);
      return;
    }
    
    if (!userData.user) {
      console.error('No user is currently logged in. Please log in first.');
      return;
    }
    
    const userId = userData.user.id;
    console.log(`Current user ID: ${userId}`);
    
    // 2. Check if a doctor record exists for this user
    const { data: doctorData, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (doctorError) {
      console.log('No doctor record found for current user. Creating one...');
      
      // 3. Create a doctor record for the current user
      const { error: createError } = await supabase
        .from('doctors')
        .insert({
          id: userId,
          name: userData.user.user_metadata?.name || 'Unknown Doctor',
          phone: userData.user.user_metadata?.phone || 'N/A',
          address: userData.user.user_metadata?.address || 'N/A',
          gst_number: userData.user.user_metadata?.gstNumber || 'N/A',
          is_approved: true, // Auto-approve for current user
          email: userData.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('Error creating doctor record:', createError);
        return;
      }
      
      console.log('Doctor record created successfully!');
    } else {
      console.log('Doctor record already exists for current user:', doctorData);
    }
    
    // 4. Display SQL to run in Supabase dashboard
    console.log('\n=== SQL to run in Supabase dashboard ===');
    const sqlFilePath = path.join(process.cwd(), 'supabase', 'migrations', '20240601_fix_doctor_user_relationship_simple.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(sql);
    console.log('=== End of SQL ===\n');
    
    console.log('Doctor-user relationship fix completed!');
    console.log('To complete the fix, please run the SQL above in the Supabase dashboard SQL editor.');
    console.log('Instructions:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Paste the SQL above');
    console.log('6. Run the query');
  } catch (error) {
    console.error('Error fixing doctor-user relationship:', error);
  }
}

// Run the script
main();
