
-- Function to get order counts by status
CREATE OR REPLACE FUNCTION get_order_counts_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.status,
    COUNT(o.id) as count
  FROM 
    orders o
  GROUP BY 
    o.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
