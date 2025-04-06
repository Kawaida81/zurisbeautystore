-- Profit Management Functions

-- Function to get daily profits
CREATE OR REPLACE FUNCTION get_daily_profits(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  total_revenue DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  profit DECIMAL(10,2),
  order_count INTEGER,
  average_order_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      DATE(o.created_at) as date,
      SUM(o.total_amount) as total_revenue,
      COUNT(*) as order_count,
      SUM(o.total_amount) / COUNT(*) as average_order_value,
      -- Assuming a 30% cost on products and services
      SUM(o.total_amount) * 0.7 as total_cost
    FROM orders o
    WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(o.created_at)
  )
  SELECT
    ds.date,
    ds.total_revenue,
    ds.total_cost,
    (ds.total_revenue - ds.total_cost) as profit,
    ds.order_count,
    ds.average_order_value
  FROM daily_stats ds
  ORDER BY ds.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly profits
CREATE OR REPLACE FUNCTION get_monthly_profits(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '12 months',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  month DATE,
  total_revenue DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  profit DECIMAL(10,2),
  order_count INTEGER,
  average_order_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_stats AS (
    SELECT
      DATE_TRUNC('month', o.created_at)::DATE as month,
      SUM(o.total_amount) as total_revenue,
      COUNT(*) as order_count,
      SUM(o.total_amount) / COUNT(*) as average_order_value,
      -- Assuming a 30% cost on products and services
      SUM(o.total_amount) * 0.7 as total_cost
    FROM orders o
    WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE_TRUNC('month', o.created_at)::DATE
  )
  SELECT
    ms.month,
    ms.total_revenue,
    ms.total_cost,
    (ms.total_revenue - ms.total_cost) as profit,
    ms.order_count,
    ms.average_order_value
  FROM monthly_stats ms
  ORDER BY ms.month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get profit by category (products vs services)
CREATE OR REPLACE FUNCTION get_profit_by_category(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  category TEXT,
  total_revenue DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  profit DECIMAL(10,2),
  order_count INTEGER,
  average_order_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH category_stats AS (
    SELECT
      CASE 
        WHEN oi.product_id IS NOT NULL THEN 'Products'
        WHEN oi.service_id IS NOT NULL THEN 'Services'
      END as category,
      SUM(oi.quantity * oi.unit_price) as total_revenue,
      COUNT(DISTINCT o.id) as order_count,
      SUM(oi.quantity * oi.unit_price) / COUNT(DISTINCT o.id) as average_order_value,
      -- Assuming a 30% cost on products and services
      SUM(oi.quantity * oi.unit_price) * 0.7 as total_cost
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY 
      CASE 
        WHEN oi.product_id IS NOT NULL THEN 'Products'
        WHEN oi.service_id IS NOT NULL THEN 'Services'
      END
  )
  SELECT
    cs.category,
    cs.total_revenue,
    cs.total_cost,
    (cs.total_revenue - cs.total_cost) as profit,
    cs.order_count,
    cs.average_order_value
  FROM category_stats cs
  ORDER BY cs.total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing items (products and services)
CREATE OR REPLACE FUNCTION get_top_performing_items(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  item_type TEXT,
  total_revenue DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  profit DECIMAL(10,2),
  units_sold INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH item_stats AS (
    SELECT
      COALESCE(p.id, s.id) as item_id,
      COALESCE(p.name, s.name) as item_name,
      CASE 
        WHEN p.id IS NOT NULL THEN 'Product'
        WHEN s.id IS NOT NULL THEN 'Service'
      END as item_type,
      SUM(oi.quantity * oi.unit_price) as total_revenue,
      SUM(oi.quantity * oi.unit_price) * 0.7 as total_cost,
      SUM(oi.quantity) as units_sold
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN services s ON oi.service_id = s.id
    WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY 
      COALESCE(p.id, s.id),
      COALESCE(p.name, s.name),
      CASE 
        WHEN p.id IS NOT NULL THEN 'Product'
        WHEN s.id IS NOT NULL THEN 'Service'
      END
  )
  SELECT
    item_id,
    item_name,
    item_type,
    total_revenue,
    total_cost,
    (total_revenue - total_cost) as profit,
    units_sold
  FROM item_stats
  ORDER BY (total_revenue - total_cost) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
