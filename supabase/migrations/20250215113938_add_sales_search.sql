-- Enable the pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS search_sales(search_term TEXT, worker_id UUID, sale_type TEXT, payment_status TEXT, payment_method TEXT, client_id UUID, p_limit INTEGER, p_offset INTEGER);

-- Create function to search sales with all filters
CREATE OR REPLACE FUNCTION search_sales(
    search_term TEXT DEFAULT NULL,
    worker_id UUID DEFAULT NULL,
    sale_type TEXT DEFAULT NULL,
    payment_status TEXT DEFAULT NULL,
    payment_method TEXT DEFAULT NULL,
    client_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    sale_data JSONB,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    -- Get total count first
    SELECT COUNT(DISTINCT s.id)
    INTO v_total_count
    FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN products p ON p.id = si.product_id
    LEFT JOIN services srv ON srv.id = s.service_id
    LEFT JOIN users c ON c.id = s.client_id
    WHERE (
        search_term IS NULL OR (
            srv.name ILIKE '%' || search_term || '%' OR
            c.full_name ILIKE '%' || search_term || '%' OR
            p.name ILIKE '%' || search_term || '%'
        )
    )
    AND (worker_id IS NULL OR s.worker_id = worker_id)
    AND (sale_type IS NULL OR s.sale_type::TEXT = sale_type)
    AND (payment_status IS NULL OR s.payment_status::TEXT = payment_status)
    AND (payment_method IS NULL OR s.payment_method::TEXT = payment_method)
    AND (client_id IS NULL OR s.client_id = client_id);

    RETURN QUERY
    WITH filtered_sales AS (
        SELECT DISTINCT ON (s.id)
            s.id,
            s.created_at,
            jsonb_build_object(
                'id', s.id,
                'client_id', s.client_id,
                'worker_id', s.worker_id,
                'service_id', s.service_id,
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
                'service', CASE 
                    WHEN srv.id IS NOT NULL THEN 
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
                    ELSE NULL 
                END,
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
                        FROM sale_items si2
                        LEFT JOIN products p ON p.id = si2.product_id
                        LEFT JOIN product_categories pc ON pc.id = p.category_id
                        WHERE si2.sale_id = s.id
                    ),
                    '[]'::jsonb
                )
            ) as sale_data
        FROM sales s
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN products p ON p.id = si.product_id
        LEFT JOIN services srv ON srv.id = s.service_id
        LEFT JOIN users c ON c.id = s.client_id
        LEFT JOIN users w ON w.id = s.worker_id
        WHERE (
            search_term IS NULL OR (
                srv.name ILIKE '%' || search_term || '%' OR
                c.full_name ILIKE '%' || search_term || '%' OR
                p.name ILIKE '%' || search_term || '%'
            )
        )
        AND (worker_id IS NULL OR s.worker_id = worker_id)
        AND (sale_type IS NULL OR s.sale_type::TEXT = sale_type)
        AND (payment_status IS NULL OR s.payment_status::TEXT = payment_status)
        AND (payment_method IS NULL OR s.payment_method::TEXT = payment_method)
        AND (client_id IS NULL OR s.client_id = client_id)
    )
    SELECT 
        fs.sale_data,
        v_total_count
    FROM filtered_sales fs
    ORDER BY fs.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_sales TO authenticated;

-- Create index to improve search performance
CREATE INDEX IF NOT EXISTS idx_services_name_search ON services USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_fullname_search ON users USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin (name gin_trgm_ops); 