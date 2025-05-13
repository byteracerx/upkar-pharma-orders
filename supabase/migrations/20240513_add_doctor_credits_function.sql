-- Create the get_all_doctor_credits function
CREATE OR REPLACE FUNCTION public.get_all_doctor_credits()
RETURNS TABLE (
  doctor_id uuid,
  doctor_name text,
  doctor_phone text,
  doctor_email text,
  total_credit numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.phone as doctor_phone,
    d.email as doctor_email,
    COALESCE(
      (SELECT SUM(
        CASE 
          WHEN ct.type = 'credit' THEN ct.amount 
          WHEN ct.type = 'debit' THEN -ct.amount
          ELSE 0
        END
      ) FROM credit_transactions ct WHERE ct.doctor_id = d.id),
      0
    ) as total_credit
  FROM 
    doctors d
  WHERE 
    d.is_approved = true;
END;
$$;