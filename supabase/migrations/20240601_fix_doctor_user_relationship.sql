-- Fix the relationship between auth.users and doctors table
-- This migration addresses the foreign key constraint violation in orders table

-- 1. Create a function to sync auth users with doctors table
CREATE OR REPLACE FUNCTION public.sync_user_to_doctor()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user has doctor metadata
  IF NEW.raw_user_meta_data ? 'name' AND 
     NEW.raw_user_meta_data ? 'phone' AND 
     NEW.raw_user_meta_data ? 'address' AND 
     NEW.raw_user_meta_data ? 'gstNumber' THEN
    
    -- Check if a doctor record already exists for this user
    IF NOT EXISTS (SELECT 1 FROM public.doctors WHERE id = NEW.id) THEN
      -- Insert a new doctor record
      INSERT INTO public.doctors (
        id,
        name,
        phone,
        address,
        gst_number,
        is_approved,
        created_at,
        updated_at,
        email
      ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'address',
        NEW.raw_user_meta_data->>'gstNumber',
        FALSE, -- Not approved by default
        NEW.created_at,
        NEW.created_at,
        NEW.email
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger to automatically create doctor records when users register
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_to_doctor();

-- 3. Create a trigger to update doctor records when user metadata changes
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.sync_user_to_doctor();

-- 4. Sync existing users with doctors table
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT 
      id, 
      email, 
      raw_user_meta_data, 
      created_at 
    FROM 
      auth.users 
    WHERE 
      raw_user_meta_data ? 'name' AND 
      raw_user_meta_data ? 'phone' AND 
      raw_user_meta_data ? 'address' AND 
      raw_user_meta_data ? 'gstNumber' AND
      NOT EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.users.id)
  LOOP
    -- Insert missing doctor records
    INSERT INTO public.doctors (
      id,
      name,
      phone,
      address,
      gst_number,
      is_approved,
      created_at,
      updated_at,
      email
    ) VALUES (
      user_record.id,
      user_record.raw_user_meta_data->>'name',
      user_record.raw_user_meta_data->>'phone',
      user_record.raw_user_meta_data->>'address',
      user_record.raw_user_meta_data->>'gstNumber',
      FALSE, -- Not approved by default
      user_record.created_at,
      user_record.created_at,
      user_record.email
    );
  END LOOP;
END;
$$;

-- 5. Add email column to doctors table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'doctors' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.doctors ADD COLUMN email text;
    
    -- Update existing doctor records with emails from auth.users
    UPDATE public.doctors d
    SET email = u.email
    FROM auth.users u
    WHERE d.id = u.id AND d.email IS NULL;
  END IF;
END;
$$;

-- 6. Create a function to get doctor ID from auth user ID
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
