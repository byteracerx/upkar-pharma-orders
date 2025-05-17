-- Simple fix for the doctor-user relationship issue
-- This migration can be applied through the Supabase dashboard SQL editor

-- 1. Add email column to doctors table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'doctors' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.doctors ADD COLUMN email text;
  END IF;
END;
$$;

-- 2. Create a function to get doctor ID from auth user ID
CREATE OR REPLACE FUNCTION public.get_doctor_id_from_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id uuid;
BEGIN
  -- First try to find a doctor with the same ID as the user
  SELECT id INTO v_doctor_id FROM doctors WHERE id = p_user_id;
  
  -- If found, return it
  IF v_doctor_id IS NOT NULL THEN
    RETURN v_doctor_id;
  END IF;
  
  -- If not found, return NULL
  RETURN NULL;
END;
$$;

-- 3. Create a function to ensure a doctor record exists for a user
CREATE OR REPLACE FUNCTION public.ensure_doctor_exists(
  p_user_id uuid,
  p_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_gst_number text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_is_approved boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id uuid;
BEGIN
  -- Check if doctor already exists
  SELECT id INTO v_doctor_id FROM doctors WHERE id = p_user_id;
  
  -- If doctor exists, return the ID
  IF v_doctor_id IS NOT NULL THEN
    RETURN v_doctor_id;
  END IF;
  
  -- Insert new doctor record
  INSERT INTO doctors (
    id,
    name,
    phone,
    address,
    gst_number,
    is_approved,
    email,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    COALESCE(p_name, 'Unknown Doctor'),
    COALESCE(p_phone, 'N/A'),
    COALESCE(p_address, 'N/A'),
    COALESCE(p_gst_number, 'N/A'),
    p_is_approved,
    p_email,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_doctor_id;
  
  RETURN v_doctor_id;
END;
$$;
