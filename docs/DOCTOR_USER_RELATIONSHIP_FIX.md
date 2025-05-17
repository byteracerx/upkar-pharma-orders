# Doctor-User Relationship Fix

This document explains how to fix the foreign key constraint violation issue in the orders table.

## Problem

The error "insert or update on table 'orders' violates foreign key constraint 'orders_doctor_id_fkey'" occurs because:

1. When a user registers, they create an auth user in Supabase Auth
2. However, a corresponding record in the `doctors` table is not being created automatically
3. When the user tries to place an order, the `doctor_id` in the orders table references a non-existent record in the `doctors` table

## Solution

We've implemented a comprehensive solution to fix this issue:

1. **Database Trigger**: Created a trigger that automatically creates a doctor record when a new user registers
2. **Migration File**: Created a migration file to fix any existing users that don't have corresponding doctor records
3. **Registration Process**: Updated the registration process to ensure doctor records are created properly
4. **Order Placement**: Enhanced the order placement process to check for and create doctor records if needed

## How to Apply the Fix

### Option 1: Run the Fix Script

We've created a script that applies all the necessary fixes:

```bash
# From the project root directory
npm run fix-doctor-relationship
```

This script will:
- Apply the database migration
- Check for any users without doctor records and create them
- Verify that the fix was successful

### Option 2: Manual Fix

If you prefer to apply the fixes manually:

1. **Apply the Database Migration**:
   ```bash
   # Using Supabase CLI
   supabase db push --db-url=<your-db-url> upkar-pharma/upkar-pharma-orders/supabase/migrations/20240601_fix_doctor_user_relationship.sql
   ```

2. **Verify the Fix**:
   - Check that all users have corresponding doctor records
   - Try placing an order to ensure it works correctly

## Technical Details

### Database Trigger

The solution includes a database trigger that automatically creates a doctor record when a new user registers:

```sql
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
```

### Registration Process

The registration process has been updated to ensure doctor records are created properly:

```javascript
// Register function
const register = async (email, password, userData) => {
  // First, sign up the user in auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
  
  if (error) return { error };
  
  // Get the new user's ID
  const userId = data?.user?.id;
  
  if (userId) {
    // Ensure a doctor record exists for this user
    await supabase
      .from('doctors')
      .upsert({
        id: userId,
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        gst_number: userData.gstNumber || '',
        is_approved: false,
        email: email
      }, { onConflict: 'id' });
  }
  
  return { error: null };
};
```

### Order Placement

The order placement process has been enhanced to check for and create doctor records if needed:

```javascript
// First, verify that a doctor record exists for this user
const { data: doctorExists, error: doctorCheckError } = await supabase
  .from('doctors')
  .select('id')
  .eq('id', doctorId)
  .single();

// If doctor doesn't exist, create one
if (doctorCheckError || !doctorExists) {
  // Get user data from auth
  const { data: userData } = await supabase.auth.getUser();
  
  // Create doctor record
  await supabase
    .from('doctors')
    .insert({
      id: doctorId,
      name: userData.user.user_metadata?.name || 'Unknown Doctor',
      // ... other fields
    });
}
```

## Troubleshooting

If you continue to experience issues after applying the fix:

1. Check the browser console for any error messages
2. Verify that the user has a corresponding doctor record in the database
3. Ensure the doctor record has the same ID as the auth user
4. Check that the doctor record is approved (is_approved = true)

For further assistance, please contact the development team.
