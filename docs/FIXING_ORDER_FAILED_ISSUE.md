# Fixing the "Order Failed" Issue

This guide explains how to fix the "Order Failed" error with the foreign key constraint violation message:

```
insert or update on table "orders" violates foreign key constraint "orders_doctor_id_fkey"
```

## Understanding the Problem

The error occurs because:

1. When a user registers, they create an auth user in Supabase Auth
2. However, a corresponding record in the `doctors` table is not being created automatically
3. When the user tries to place an order, the `doctor_id` in the orders table references a non-existent record in the `doctors` table

## Solution Overview

We've implemented a comprehensive solution to fix this issue:

1. **Database Functions**: Created SQL functions to ensure doctor records exist
2. **Application Code**: Updated the code to handle the foreign key constraint issue
3. **Simple Fix Script**: Created a script to fix the issue for the current user

## How to Fix the Issue

### Option 1: Run the Simple Fix Script (Recommended)

This is the easiest way to fix the issue for your current user:

```bash
# From the project root directory
npm run fix-doctor-simple
```

This script will:
- Check if your current user has a doctor record
- Create a doctor record if needed
- Display SQL that needs to be run in the Supabase dashboard

After running the script, follow the instructions to run the SQL in the Supabase dashboard.

### Option 2: Manual Fix

If you prefer to fix the issue manually:

1. **Create a Doctor Record for Your User**:
   ```sql
   -- Run this in the Supabase SQL Editor
   INSERT INTO public.doctors (
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
     'your-user-id',  -- Replace with your actual user ID
     'Your Name',     -- Replace with your name
     'Your Phone',    -- Replace with your phone
     'Your Address',  -- Replace with your address
     'Your GST',      -- Replace with your GST number
     true,            -- Auto-approve
     'your@email.com', -- Replace with your email
     NOW(),
     NOW()
   );
   ```

2. **Create the Helper Functions**:
   ```sql
   -- Run this in the Supabase SQL Editor
   
   -- Add email column to doctors table if it doesn't exist
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
   
   -- Create a function to get doctor ID from auth user ID
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
   
   -- Create a function to ensure a doctor record exists for a user
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
   ```

## Verifying the Fix

After applying the fix:

1. Log in to your account
2. Try placing an order
3. The order should now be created successfully without the foreign key constraint error

## Technical Details

### Application Code Changes

We've updated the application code to handle the foreign key constraint issue:

1. **Order Placement**: The `placeOrder` function now checks if a doctor record exists and creates one if needed
2. **Registration**: The registration process now ensures a doctor record is created for new users

### Database Functions

We've created two key database functions:

1. `get_doctor_id_from_user`: Gets the doctor ID for a given user ID
2. `ensure_doctor_exists`: Ensures a doctor record exists for a given user ID, creating one if needed

## Troubleshooting

If you continue to experience issues after applying the fix:

1. Check the browser console for any error messages
2. Verify that your user has a corresponding doctor record in the database:
   ```sql
   SELECT * FROM doctors WHERE id = 'your-user-id';
   ```
3. Ensure the doctor record has the same ID as your auth user
4. Check that the doctor record is approved (is_approved = true)

For further assistance, please contact the development team.
