-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reorder_point INTEGER NOT NULL DEFAULT 5 CHECK (reorder_point >= 0),
  image_url TEXT,
  category_id UUID REFERENCES product_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_restock_date TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description ON products USING gin(description gin_trgm_ops);

-- Add RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for products
CREATE POLICY "Enable read access for all users" ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable all access for authenticated users" ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS policies for product_categories
CREATE POLICY "Enable read access for all users" ON product_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable all access for authenticated users" ON product_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to list products with filters
CREATE OR REPLACE FUNCTION list_products(
  p_category_id UUID DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_low_stock_only BOOLEAN DEFAULT false,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_products JSONB;
  v_total_count INTEGER;
BEGIN
  -- Calculate offset
  v_offset := (p_page - 1) * p_page_size;

  -- Build the query
  WITH filtered_products AS (
    SELECT 
      p.*,
      c.name as category_name,
      c.id as category_id
    FROM products p
    LEFT JOIN product_categories c ON c.id = p.category_id
    WHERE 
      (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (
        p_search_term IS NULL 
        OR p.name ILIKE '%' || p_search_term || '%'
        OR p.description ILIKE '%' || p_search_term || '%'
      )
      AND (
        NOT p_low_stock_only 
        OR p.stock_quantity <= p.reorder_point
      )
  )
  SELECT 
    jsonb_build_object(
      'data', COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', fp.id,
          'name', fp.name,
          'description', fp.description,
          'price', fp.price,
          'stock_quantity', fp.stock_quantity,
          'reorder_point', fp.reorder_point,
          'image_url', fp.image_url,
          'is_active', fp.is_active,
          'created_at', fp.created_at,
          'category', jsonb_build_object(
            'id', fp.category_id,
            'name', fp.category_name
          )
        )
      ), '[]'),
      'total', (SELECT COUNT(*) FROM filtered_products),
      'page', p_page,
      'pageSize', p_page_size
    ) INTO v_products
  FROM filtered_products fp
  ORDER BY fp.created_at DESC
  LIMIT p_page_size
  OFFSET v_offset;

  RETURN v_products;
END;
$$;
