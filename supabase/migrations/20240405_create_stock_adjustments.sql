-- Create stock_adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  previous_quantity INTEGER NOT NULL,
  adjustment_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add', 'remove', 'set')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at);

-- Add RLS policies
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON stock_adjustments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON stock_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add trigger to update last_restock_date in products table
CREATE OR REPLACE FUNCTION update_product_last_restock_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.adjustment_type = 'add' THEN
    UPDATE products
    SET last_restock_date = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_product_last_restock_date_trigger
  AFTER INSERT ON stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_product_last_restock_date();
