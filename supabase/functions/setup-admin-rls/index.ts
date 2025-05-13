import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const supabaseUrl = 'https://hohfvjzagukucseffpmc.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create RLS policies for products table
    const createProductsPolicies = async () => {
      // First, check if the table exists
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'products')
        .eq('table_schema', 'public')
      
      if (tableError) {
        console.error('Error checking for products table:', tableError)
        throw new Error('Failed to check for products table')
      }
      
      if (!tables || tables.length === 0) {
        console.log('Products table does not exist, creating it...')
        
        // Create products table
        const { error: createTableError } = await supabase.rpc('create_products_table')
        
        if (createTableError) {
          console.error('Error creating products table:', createTableError)
          throw new Error('Failed to create products table')
        }
      }
      
      // Create RLS policies for admin users
      const queries = [
        // Enable RLS on products table
        `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;`,
        
        // Drop existing policies if they exist
        `DROP POLICY IF EXISTS "Allow select for all users" ON public.products;`,
        `DROP POLICY IF EXISTS "Allow insert for admin users" ON public.products;`,
        `DROP POLICY IF EXISTS "Allow update for admin users" ON public.products;`,
        `DROP POLICY IF EXISTS "Allow delete for admin users" ON public.products;`,
        
        // Create new policies
        `CREATE POLICY "Allow select for all users" 
         ON public.products FOR SELECT 
         USING (true);`,
        
        `CREATE POLICY "Allow insert for admin users" 
         ON public.products FOR INSERT 
         WITH CHECK (
           auth.uid() IN (
             SELECT auth.uid() 
             FROM auth.users 
             WHERE email = 'admin@upkar.com'
           )
         );`,
        
        `CREATE POLICY "Allow update for admin users" 
         ON public.products FOR UPDATE 
         USING (
           auth.uid() IN (
             SELECT auth.uid() 
             FROM auth.users 
             WHERE email = 'admin@upkar.com'
           )
         );`,
        
        `CREATE POLICY "Allow delete for admin users" 
         ON public.products FOR DELETE 
         USING (
           auth.uid() IN (
             SELECT auth.uid() 
             FROM auth.users 
             WHERE email = 'admin@upkar.com'
           )
         );`
      ]
      
      // Execute each query
      for (const query of queries) {
        const { error } = await supabase.rpc('run_sql_query', { query })
        
        if (error) {
          console.error(`Error executing query: ${query}`, error)
          throw new Error(`Failed to execute query: ${error.message}`)
        }
      }
      
      return { success: true, message: 'Products RLS policies created successfully' }
    }
    
    // Execute the function to create RLS policies
    const result = await createProductsPolicies()
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in setup-admin-rls function:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})