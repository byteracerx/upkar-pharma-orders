// Script to fix the doctor-user relationship issue
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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

// Function to execute SQL file
async function executeSqlFile(filePath) {
  try {
    console.log(`Executing SQL file: ${filePath}`);
    
    // Read the SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error executing SQL: ${error.message}`);
      return false;
    }
    
    console.log(`SQL file executed successfully: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Fixing doctor-user relationship...');
    
    // Path to SQL migration file
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const sqlFilePath = path.join(migrationsDir, '20240601_fix_doctor_user_relationship.sql');
    
    // Execute the SQL file
    await executeSqlFile(sqlFilePath);
    
    // Verify the fix by checking for any users without doctor records
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    // Get all doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('id');
    
    if (doctorsError) {
      console.error('Error listing doctors:', doctorsError);
      return;
    }
    
    console.log(`Found ${doctors.length} doctors`);
    
    // Check for users without doctor records
    const doctorIds = doctors.map(doctor => doctor.id);
    const usersWithoutDoctors = users.filter(user => 
      !doctorIds.includes(user.id) && 
      user.user_metadata && 
      user.user_metadata.name && 
      user.user_metadata.phone
    );
    
    if (usersWithoutDoctors.length > 0) {
      console.log(`Found ${usersWithoutDoctors.length} users without doctor records`);
      
      // Create doctor records for these users
      for (const user of usersWithoutDoctors) {
        console.log(`Creating doctor record for user ${user.id} (${user.email})`);
        
        const { error } = await supabase
          .from('doctors')
          .insert({
            id: user.id,
            name: user.user_metadata.name || 'Unknown',
            phone: user.user_metadata.phone || 'N/A',
            address: user.user_metadata.address || 'N/A',
            gst_number: user.user_metadata.gstNumber || 'N/A',
            is_approved: false,
            email: user.email
          });
        
        if (error) {
          console.error(`Error creating doctor record for user ${user.id}:`, error);
        } else {
          console.log(`Doctor record created successfully for user ${user.id}`);
        }
      }
    } else {
      console.log('All users have corresponding doctor records');
    }
    
    console.log('Doctor-user relationship fix completed successfully!');
  } catch (error) {
    console.error('Error fixing doctor-user relationship:', error);
  }
}

// Run the script
main();
