# Database Fixes

This directory contains SQL migrations to fix issues with the database.

## Issues Fixed

1. **Missing `get_all_doctor_credits` Function**
   - Error: "Could not find the function public.get_all_doctor_credits without parameters in the schema cache"
   - Fix: Created the missing function in `20240513_add_doctor_credits_function.sql`

2. **Orders Not Appearing in Admin Panel**
   - Error: Orders placed by doctors are not showing up in the admin panel
   - Fix: Created a new function `get_all_orders` in `20240513_fix_orders_view.sql`

## How to Apply These Fixes

### Method 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of each SQL file
4. Execute the SQL statements

### Method 2: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

### Method 3: Using the Provided Script

Run the provided script to apply the fixes:

```bash
node scripts/apply-database-fixes.js
```

## Verifying the Fixes

After applying the fixes:

1. Log in to the admin panel
2. Go to the Orders page - you should now see all orders
3. Go to the Credits page - you should no longer see the error about the missing function