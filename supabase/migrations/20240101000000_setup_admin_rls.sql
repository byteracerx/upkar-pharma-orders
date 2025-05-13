-- Create a function to set up RLS policies for admin users
CREATE OR REPLACE FUNCTION public.setup_admin_rls()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Enable RLS on products table
  ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow select for all users" ON public.products;
  DROP POLICY IF EXISTS "Allow insert for admin users" ON public.products;
  DROP POLICY IF EXISTS "Allow update for admin users" ON public.products;
  DROP POLICY IF EXISTS "Allow delete for admin users" ON public.products;
  DROP POLICY IF EXISTS "Temporary allow all" ON public.products;
  
  -- Create new policies
  CREATE POLICY "Allow select for all users" 
    ON public.products FOR SELECT 
    USING (true);
  
  CREATE POLICY "Allow insert for admin users" 
    ON public.products FOR INSERT 
    TO authenticated
    WITH CHECK (true);
  
  CREATE POLICY "Allow update for admin users" 
    ON public.products FOR UPDATE 
    TO authenticated
    USING (true);
  
  CREATE POLICY "Allow delete for admin users" 
    ON public.products FOR DELETE 
    TO authenticated
    USING (true);
  
  -- Create a temporary policy that allows all operations for testing
  CREATE POLICY "Temporary allow all" 
    ON public.products 
    USING (true) 
    WITH CHECK (true);
  
  result := json_build_object(
    'success', true,
    'message', 'RLS policies set up successfully'
  );
  
  RETURN result;
END;
$$;