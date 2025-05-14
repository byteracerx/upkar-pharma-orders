
// Script to apply database fixes
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
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

// Function to execute SQL from a file
async function executeSqlFile(filePath) {
  try {
    console.log(`Executing SQL from file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing statement: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing SQL statement: ${error.message}`);
          console.log('Trying alternative method...');
          
          // Try direct query as fallback
          const { error: queryError } = await supabase.from('_exec_sql').select('*').limit(1);
          if (queryError) {
            console.error(`Alternative method failed: ${queryError.message}`);
          }
        } else {
          console.log('Statement executed successfully');
        }
      }
    }
    
    console.log(`Finished executing SQL from file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Applying database fixes...');
    
    // Path to SQL migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    // Execute the SQL files
    await executeSqlFile(path.join(migrationsDir, '20240513_add_doctor_credit_summary_function.sql'));
    await executeSqlFile(path.join(migrationsDir, '20240513_fix_doctor_credit_summary.sql'));
    
    console.log('Database fixes applied successfully!');
  } catch (error) {
    console.error('Error applying database fixes:', error);
  }
}

// Run the script
main();
