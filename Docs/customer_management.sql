-- Customer Management Functions

-- Function to list all customers with optional filters
CREATE OR REPLACE FUNCTION list_customers(
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_orders INTEGER,
  total_spent DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.address,
    c.created_at,
    c.updated_at,
    COALESCE(COUNT(o.id), 0)::INTEGER as total_orders,
    COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_spent
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id
  WHERE 
    CASE 
      WHEN p_search IS NOT NULL THEN
        c.first_name ILIKE '%' || p_search || '%' OR
        c.last_name ILIKE '%' || p_search || '%' OR
        c.email ILIKE '%' || p_search || '%' OR
        c.phone ILIKE '%' || p_search || '%'
      ELSE true
    END
  GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.address, c.created_at, c.updated_at
  ORDER BY
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN c.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN c.created_at END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN c.first_name END DESC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN c.first_name END ASC,
    CASE WHEN p_sort_by = 'total_orders' AND p_sort_order = 'desc' THEN COUNT(o.id) END DESC,
    CASE WHEN p_sort_by = 'total_orders' AND p_sort_order = 'asc' THEN COUNT(o.id) END ASC,
    CASE WHEN p_sort_by = 'total_spent' AND p_sort_order = 'desc' THEN SUM(o.total_amount) END DESC,
    CASE WHEN p_sort_by = 'total_spent' AND p_sort_order = 'asc' THEN SUM(o.total_amount) END ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a single customer by ID
CREATE OR REPLACE FUNCTION get_customer(
  p_customer_id UUID
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_orders INTEGER,
  total_spent DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.address,
    c.created_at,
    c.updated_at,
    COALESCE(COUNT(o.id), 0)::INTEGER as total_orders,
    COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_spent
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id
  WHERE c.id = p_customer_id
  GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.address, c.created_at, c.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new customer
CREATE OR REPLACE FUNCTION create_customer(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_address TEXT
)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM customers WHERE email = p_email) THEN
    RAISE EXCEPTION 'A customer with this email already exists';
  END IF;

  -- Insert new customer
  INSERT INTO customers (
    first_name,
    last_name,
    email,
    phone,
    address,
    created_at,
    updated_at
  ) VALUES (
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_address,
    NOW(),
    NOW()
  ) RETURNING id INTO v_customer_id;

  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update an existing customer
CREATE OR REPLACE FUNCTION update_customer(
  p_customer_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_address TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if email already exists for another customer
  IF EXISTS (
    SELECT 1 
    FROM customers 
    WHERE email = p_email 
    AND id != p_customer_id
  ) THEN
    RAISE EXCEPTION 'A customer with this email already exists';
  END IF;

  -- Update customer
  UPDATE customers SET
    first_name = p_first_name,
    last_name = p_last_name,
    email = p_email,
    phone = p_phone,
    address = p_address,
    updated_at = NOW()
  WHERE id = p_customer_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a customer
CREATE OR REPLACE FUNCTION delete_customer(
  p_customer_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if customer has any orders
  IF EXISTS (SELECT 1 FROM orders WHERE customer_id = p_customer_id) THEN
    RAISE EXCEPTION 'Cannot delete customer with existing orders';
  END IF;

  -- Delete customer
  DELETE FROM customers WHERE id = p_customer_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
