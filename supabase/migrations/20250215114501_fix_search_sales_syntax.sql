-- Drop the existing function
DROP FUNCTION IF EXISTS search_sales(text, uuid, text, text, text, uuid, integer, integer);

-- Create the fixed search_sales function
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
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- Get total count first
  SELECT COUNT(DISTINCT s.id)
  INTO v_total_count
  FROM sales s
  LEFT JOIN users c ON c.id = s.client_id
  LEFT JOIN users w ON w.id = s.worker_id
  WHERE (
    search_term IS NULL OR (
      CASE WHEN s.client_id IS NOT NULL 
        THEN c.full_name ILIKE '%' || search_term || '%'
        ELSE FALSE
      END
      OR
      CASE WHEN s.worker_id IS NOT NULL 
        THEN w.full_name ILIKE '%' || search_term || '%'
        ELSE FALSE
      END
    )
  )
  AND (p_worker_id IS NULL OR s.worker_id = p_worker_id)
  AND (p_sale_type IS NULL OR s.sale_type::TEXT = p_sale_type)
  AND (p_payment_status IS NULL OR s.payment_status::TEXT = p_payment_status)
  AND (p_payment_method IS NULL OR s.payment_method::TEXT = p_payment_method)
  AND (p_client_id IS NULL OR s.client_id = p_client_id);

  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', s.id,
      'client_id', s.client_id,
      'worker_id', s.worker_id,
      'services', s.services,
      'total_amount', s.total_amount,
      'payment_method', s.payment_method,
      'payment_status', s.payment_status,
      'sale_type', s.sale_type,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'client', CASE 
        WHEN c.id IS NOT NULL THEN 
          jsonb_build_object(
            'id', c.id,
            'full_name', c.full_name,
            'email', c.email
          )
        ELSE NULL 
      END,
      'worker', jsonb_build_object(
        'id', w.id,
        'full_name', w.full_name,
        'email', w.email
      ),
      'services_data', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', srv.id,
              'name', srv.name,
              'description', srv.description,
              'duration', srv.duration,
              'price', srv.price,
              'category', srv.category,
              'image_url', srv.image_url,
              'is_active', srv.is_active,
              'created_at', srv.created_at,
              'updated_at', srv.updated_at
            )
          )
          FROM services srv
          WHERE srv.id IN (
            SELECT (jsonb_array_elements(s.services)->>'service_id')::uuid
          )
        ),
        '[]'::jsonb
      ),
      'items', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', si.id,
              'sale_id', si.sale_id,
              'product_id', si.product_id,
              'quantity', si.quantity,
              'unit_price', si.unit_price,
              'total_price', si.total_price,
              'created_at', si.created_at,
              'updated_at', si.updated_at,
              'product', jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'price', p.price,
                'stock_quantity', p.stock_quantity,
                'category_id', p.category_id,
                'image_url', p.image_url,
                'is_active', p.is_active,
                'created_at', p.created_at,
                'updated_at', p.updated_at,
                'category', CASE 
                  WHEN pc.id IS NOT NULL THEN 
                    jsonb_build_object(
                      'id', pc.id,
                      'name', pc.name
                    )
                  ELSE NULL 
                END
              )
            )
          )
          FROM sale_items si
          LEFT JOIN products p ON p.id = si.product_id
          LEFT JOIN product_categories pc ON pc.id = p.category_id
          WHERE si.sale_id = s.id
        ),
        '[]'::jsonb
      )
    ) as sale_data,
    v_total_count
  FROM sales s
  LEFT JOIN users c ON c.id = s.client_id
  LEFT JOIN users w ON w.id = s.worker_id
  WHERE (
    search_term IS NULL OR (
      CASE WHEN s.client_id IS NOT NULL 
        THEN c.full_name ILIKE '%' || search_term || '%'
        ELSE FALSE
      END
      OR
      CASE WHEN s.worker_id IS NOT NULL 
        THEN w.full_name ILIKE '%' || search_term || '%'
        ELSE FALSE
      END
    )
  )
  AND (p_worker_id IS NULL OR s.worker_id = p_worker_id)
  AND (p_sale_type IS NULL OR s.sale_type::TEXT = p_sale_type)
  AND (p_payment_status IS NULL OR s.payment_status::TEXT = p_payment_status)
  AND (p_payment_method IS NULL OR s.payment_method::TEXT = p_payment_method)
  AND (p_client_id IS NULL OR s.client_id = p_client_id)
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_sales TO authenticated; 