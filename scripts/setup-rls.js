// This script sets up the RLS policies for the admin user
// Run with: node scripts/setup-rls.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hohfvjzagukucseffpmc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRLS() {
  try {
    console.log('Setting up RLS policies...');
    
    // Enable RLS on products table
    await supabase.rpc('run_sql_query', { 
      query: 'ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;' 
    });
    
    // Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Allow select for all users" ON public.products;',
      'DROP POLICY IF EXISTS "Allow insert for admin users" ON public.products;',
      'DROP POLICY IF EXISTS "Allow update for admin users" ON public.products;',
      'DROP POLICY IF EXISTS "Allow delete for admin users" ON public.products;',
      'DROP POLICY IF EXISTS "Temporary allow all" ON public.products;'
    ];
    
    for (const query of dropPolicies) {
      await supabase.rpc('run_sql_query', { query });
    }
    
    // Create new policies
    const createPolicies = [
      `CREATE POLICY "Allow select for all users" 
       ON public.products FOR SELECT 
       USING (true);`,
      
      `CREATE POLICY "Allow insert for admin users" 
       ON public.products FOR INSERT 
       TO authenticated
       WITH CHECK (auth.jwt() ->> 'email' = 'admin@upkar.com');`,
      
      `CREATE POLICY "Allow update for admin users" 
       ON public.products FOR UPDATE 
       TO authenticated
       USING (auth.jwt() ->> 'email' = 'admin@upkar.com');`,
      
      `CREATE POLICY "Allow delete for admin users" 
       ON public.products FOR DELETE 
       TO authenticated
       USING (auth.jwt() ->> 'email' = 'admin@upkar.com');`,
      
      // Temporary policy for testing
      `CREATE POLICY "Temporary allow all" 
       ON public.products 
       USING (true) 
       WITH CHECK (true);`
    ];
    
    for (const query of createPolicies) {
      await supabase.rpc('run_sql_query', { query });
    }
    
    console.log('RLS policies set up successfully');
  } catch (error) {
    console.error('Error setting up RLS policies:', error);
  }
}

setupRLS()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });