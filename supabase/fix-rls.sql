-- This script fixes the RLS policies for the products table
-- Run this in the Supabase SQL Editor

-- First, disable RLS temporarily to allow all operations
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Then, create the necessary policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

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
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@upkar.com');

CREATE POLICY "Allow update for admin users" 
  ON public.products FOR UPDATE 
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@upkar.com');

CREATE POLICY "Allow delete for admin users" 
  ON public.products FOR DELETE 
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@upkar.com');

-- Create a temporary policy that allows all operations for testing
-- Comment this out in production
CREATE POLICY "Temporary allow all" 
  ON public.products 
  USING (true) 
  WITH CHECK (true);