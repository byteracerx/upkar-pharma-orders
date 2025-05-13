-- Drop the function if it exists to ensure a clean creation
DROP FUNCTION IF EXISTS public.get_doctor_credit_summary(uuid);

-- Create a simplified version of the get_doctor_credit_summary function
CREATE OR REPLACE FUNCTION public.get_doctor_credit_summary(p_doctor_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Check if credit_transactions table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_transactions'
  ) THEN
    -- If table exists, calculate credit summary
    WITH credit_summary AS (
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'pending' THEN amount ELSE 0 END), 0) as pending_credits
      FROM 
        credit_transactions
      WHERE 
        doctor_id = p_doctor_id
    ),
    last_transaction AS (
      SELECT 
        created_at,
        amount,
        type
      FROM 
        credit_transactions
      WHERE 
        doctor_id = p_doctor_id
      ORDER BY 
        created_at DESC
      LIMIT 1
    )
    SELECT json_build_object(
      'total_credit', cs.total_credits,
      'available_credit', (cs.total_credits - cs.total_debits),
      'used_credit', cs.total_debits,
      'pending_credit', cs.pending_credits,
      'last_transaction_date', lt.created_at,
      'last_transaction_amount', lt.amount,
      'last_transaction_type', lt.type
    ) INTO v_result
    FROM
      credit_summary cs
    LEFT JOIN
      last_transaction lt ON true;
  ELSE
    -- If table doesn't exist, return default values
    v_result := json_build_object(
      'total_credit', 0,
      'available_credit', 0,
      'used_credit', 0,
      'pending_credit', 0,
      'last_transaction_date', null,
      'last_transaction_amount', null,
      'last_transaction_type', null
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Create a dummy credit_transactions table if it doesn't exist
-- This ensures the function can be created even if the table doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_transactions'
  ) THEN
    CREATE TABLE public.credit_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_id uuid NOT NULL,
      amount numeric NOT NULL,
      type text NOT NULL,
      status text DEFAULT 'completed',
      description text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
    
    -- Add a comment to indicate this is a placeholder table
    COMMENT ON TABLE public.credit_transactions IS 'Placeholder table for doctor credits system';
  END IF;
END
$$;