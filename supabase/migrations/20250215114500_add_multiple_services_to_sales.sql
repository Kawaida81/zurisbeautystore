-- Drop the old service_id column and add the new services JSONB column
ALTER TABLE sales 
DROP COLUMN service_id,
ADD COLUMN services JSONB DEFAULT '[]'::jsonb;

-- Update the search_sales function to handle multiple services
CREATE OR REPLACE FUNCTION search_sales(
  search_term text DEFAULT NULL,
  p_worker_id uuid DEFAULT NULL,
  p_sale_type text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
) RETURNS TABLE (
  sale_data jsonb,
  total_count bigint
) AS $$
DECLARE
  query text;
  count_query text;
  total bigint;
BEGIN
  -- Base query
  query := 'WITH sale_data AS (
    SELECT 
      s.*,
      c.id as client_id,
      c.full_name as client_name,
      c.email as client_email,
      w.id as worker_id,
      w.full_name as worker_name,
      w.email as worker_email,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              ''id'', serv.id,
              ''name'', serv.name,
              ''price'', serv.price,
              ''duration'', serv.duration,
              ''category'', serv.category
            )
          )
          FROM services serv
          WHERE serv.id IN (
            SELECT (jsonb_array_elements(s.services)->''service_id'')::text::uuid
          )
        ),
        ''[]''::jsonb
      ) as services_data,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              ''id'', si.id,
              ''quantity'', si.quantity,
              ''unit_price'', si.unit_price,
              ''total_price'', si.total_price,
              ''product'', jsonb_build_object(
                ''id'', p.id,
                ''name'', p.name,
                ''price'', p.price,
                ''category'', pc.name
              )
            )
          )
          FROM sale_items si
          LEFT JOIN products p ON p.id = si.product_id
          LEFT JOIN product_categories pc ON pc.id = p.category_id
          WHERE si.sale_id = s.id
        ),
        ''[]''::jsonb
      ) as items
    FROM sales s
    LEFT JOIN profiles c ON c.id = s.client_id
    LEFT JOIN profiles w ON w.id = s.worker_id
    WHERE 1=1';

  -- Add filters
  IF search_term IS NOT NULL THEN
    query := query || ' AND (
      c.full_name ILIKE ''%'' || $1 || ''%'' OR
      w.full_name ILIKE ''%'' || $1 || ''%''
    )';
  END IF;

  IF p_worker_id IS NOT NULL THEN
    query := query || ' AND s.worker_id = ''' || p_worker_id || '''';
  END IF;

  IF p_sale_type IS NOT NULL THEN
    query := query || ' AND s.sale_type = ''' || p_sale_type || '''';
  END IF;

  IF p_payment_status IS NOT NULL THEN
    query := query || ' AND s.payment_status = ''' || p_payment_status || '''';
  END IF;

  IF p_payment_method IS NOT NULL THEN
    query := query || ' AND s.payment_method = ''' || p_payment_method || '''';
  END IF;

  IF p_client_id IS NOT NULL THEN
    query := query || ' AND s.client_id = ''' || p_client_id || '''';
  END IF;

  -- Order by
  query := query || ' ORDER BY s.created_at DESC';

  -- Count total results
  count_query := 'SELECT COUNT(*) FROM (' || query || ') AS count_query';
  EXECUTE count_query
  INTO total;

  -- Add pagination
  query := query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset || ')
  SELECT 
    jsonb_build_object(
      ''id'', s.id,
      ''client_id'', s.client_id,
      ''worker_id'', s.worker_id,
      ''services'', s.services,
      ''total_amount'', s.total_amount,
      ''payment_method'', s.payment_method,
      ''payment_status'', s.payment_status,
      ''sale_type'', s.sale_type,
      ''created_at'', s.created_at,
      ''updated_at'', s.updated_at,
      ''client'', CASE 
        WHEN s.client_id IS NOT NULL THEN 
          jsonb_build_object(
            ''id'', s.client_id,
            ''full_name'', s.client_name,
            ''email'', s.client_email
          )
        ELSE NULL 
      END,
      ''worker'', jsonb_build_object(
        ''id'', s.worker_id,
        ''full_name'', s.worker_name,
        ''email'', s.worker_email
      ),
      ''services_data'', s.services_data,
      ''items'', s.items
    ) as sale_data,
    ' || total || ' as total_count
  FROM sale_data s';

  -- Execute query
  RETURN QUERY EXECUTE query
  USING search_term;
END;
$$ LANGUAGE plpgsql; 