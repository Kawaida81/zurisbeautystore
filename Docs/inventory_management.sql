-- Inventory Management Functions

-- Function to get inventory items with status
CREATE OR REPLACE FUNCTION get_inventory_items(
  p_category_id UUID DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name text,
  description text,
  category_id UUID,
  category_name text,
  price decimal(10,2),
  stock_quantity integer,
  reorder_point integer,
  status text,
  last_restock_date timestamptz,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH inventory AS (
    SELECT 
      p.id,
      p.name,
      p.description,
      p.category_id,
      pc.name as category_name,
      p.price,
      p.stock_quantity,
      p.reorder_point,
      CASE
        WHEN p.stock_quantity = 0 THEN 'out_of_stock'
        WHEN p.stock_quantity <= p.reorder_point THEN 'low_stock'
        ELSE 'in_stock'
      END as status,
      p.last_restock_date,
      COUNT(*) OVER() as total_count
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE 
      (p_category_id IS NULL OR p.category_id = p_category_id) AND
      (p_status IS NULL OR 
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.reorder_point THEN 'low_stock'
          ELSE 'in_stock'
        END = p_status) AND
      (p_search IS NULL OR 
        p.name ILIKE '%' || p_search || '%' OR 
        p.description ILIKE '%' || p_search || '%')
    ORDER BY 
      CASE
        WHEN p.stock_quantity <= p.reorder_point THEN 0
        ELSE 1
      END,
      p.name ASC
  )
  SELECT *
  FROM inventory
  LIMIT p_limit
  OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stock quantity
CREATE OR REPLACE FUNCTION update_stock_quantity(
  p_product_id UUID,
  p_quantity integer,
  p_adjustment_type text,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name text,
  stock_quantity integer,
  status text
) AS $$
DECLARE
  v_current_quantity integer;
  v_new_quantity integer;
BEGIN
  -- Get current stock quantity
  SELECT stock_quantity
  INTO v_current_quantity
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Calculate new quantity based on adjustment type
  v_new_quantity := CASE p_adjustment_type
    WHEN 'add' THEN v_current_quantity + p_quantity
    WHEN 'remove' THEN GREATEST(0, v_current_quantity - p_quantity)
    WHEN 'set' THEN GREATEST(0, p_quantity)
    ELSE v_current_quantity
  END;

  -- Update product stock
  UPDATE products
  SET 
    stock_quantity = v_new_quantity,
    last_restock_date = CASE 
      WHEN p_adjustment_type = 'add' THEN CURRENT_TIMESTAMP
      ELSE last_restock_date
    END
  WHERE id = p_product_id;

  -- Record stock adjustment
  INSERT INTO stock_adjustments (
    product_id,
    previous_quantity,
    adjustment_quantity,
    new_quantity,
    adjustment_type,
    notes
  ) VALUES (
    p_product_id,
    v_current_quantity,
    p_quantity,
    v_new_quantity,
    p_adjustment_type,
    p_notes
  );

  -- Return updated product info
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.stock_quantity,
    CASE
      WHEN p.stock_quantity = 0 THEN 'out_of_stock'
      WHEN p.stock_quantity <= p.reorder_point THEN 'low_stock'
      ELSE 'in_stock'
    END as status
  FROM products p
  WHERE p.id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get stock adjustment history
CREATE OR REPLACE FUNCTION get_stock_history(
  p_product_id UUID DEFAULT NULL,
  p_start_date timestamptz DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date timestamptz DEFAULT CURRENT_DATE,
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_name text,
  previous_quantity integer,
  adjustment_quantity integer,
  new_quantity integer,
  adjustment_type text,
  notes text,
  created_at timestamptz,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH history AS (
    SELECT 
      sa.id,
      sa.product_id,
      p.name as product_name,
      sa.previous_quantity,
      sa.adjustment_quantity,
      sa.new_quantity,
      sa.adjustment_type,
      sa.notes,
      sa.created_at,
      COUNT(*) OVER() as total_count
    FROM stock_adjustments sa
    JOIN products p ON sa.product_id = p.id
    WHERE 
      (p_product_id IS NULL OR sa.product_id = p_product_id) AND
      sa.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY sa.created_at DESC
  )
  SELECT *
  FROM history
  LIMIT p_limit
  OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get low stock alerts
CREATE OR REPLACE FUNCTION get_low_stock_alerts(
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name text,
  category_id UUID,
  category_name text,
  stock_quantity integer,
  reorder_point integer,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.category_id,
    pc.name as category_name,
    p.stock_quantity,
    p.reorder_point,
    CASE
      WHEN p.stock_quantity = 0 THEN 'out_of_stock'
      WHEN p.stock_quantity <= p.reorder_point THEN 'low_stock'
      ELSE 'in_stock'
    END as status
  FROM products p
  LEFT JOIN product_categories pc ON p.category_id = pc.id
  WHERE 
    (p_category_id IS NULL OR p.category_id = p_category_id) AND
    p.stock_quantity <= p.reorder_point
  ORDER BY 
    p.stock_quantity = 0 DESC,
    p.stock_quantity ASC,
    p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
