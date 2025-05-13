-- Create or replace the function to get all orders with doctor information
CREATE OR REPLACE FUNCTION public.get_all_orders()
RETURNS TABLE (
  id uuid,
  doctor_id uuid,
  total_amount numeric,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  doctor_name text,
  doctor_phone text,
  doctor_email text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.doctor_id,
    o.total_amount,
    o.status,
    o.created_at,
    o.updated_at,
    d.name as doctor_name,
    d.phone as doctor_phone,
    d.email as doctor_email
  FROM 
    orders o
  LEFT JOIN 
    doctors d ON o.doctor_id = d.id
  ORDER BY 
    o.created_at DESC;
END;
$$;