
-- Create the get_doctor_credit_summary function
CREATE OR REPLACE FUNCTION public.get_doctor_credit_summary(p_doctor_id uuid)
RETURNS TABLE (
  total_credit numeric,
  available_credit numeric,
  used_credit numeric,
  pending_credit numeric,
  last_transaction_date timestamp with time zone,
  last_transaction_amount numeric,
  last_transaction_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
  SELECT
    cs.total_credits as total_credit,
    (cs.total_credits - cs.total_debits) as available_credit,
    cs.total_debits as used_credit,
    cs.pending_credits as pending_credit,
    lt.created_at as last_transaction_date,
    lt.amount as last_transaction_amount,
    lt.type as last_transaction_type
  FROM
    credit_summary cs
  LEFT JOIN
    last_transaction lt ON true;
END;
$$;
