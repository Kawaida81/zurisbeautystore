-- Create enum for alert types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM ('low_stock', 'out_of_stock', 'reorder_point');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create inventory_alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index for active alerts
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_alerts 
ON inventory_alerts(product_id, alert_type) 
WHERE is_resolved = false;

-- Create function to check stock levels
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
DECLARE
    alert_message TEXT;
BEGIN
    -- Check if stock is zero
    IF NEW.stock_quantity = 0 THEN
        alert_message := 'Product "' || NEW.name || '" is out of stock';
        
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (NEW.id, 'out_of_stock'::alert_type, alert_message)
        ON CONFLICT (product_id, alert_type) WHERE is_resolved = false 
        DO UPDATE SET 
            message = EXCLUDED.message,
            updated_at = NOW();
    
    -- Check if stock is below reorder point
    ELSIF NEW.stock_quantity <= COALESCE(NEW.reorder_point, 5) THEN
        alert_message := 'Product "' || NEW.name || '" is running low. Current stock: ' || NEW.stock_quantity || ', Reorder Point: ' || COALESCE(NEW.reorder_point, 5);
        
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (NEW.id, 'low_stock'::alert_type, alert_message)
        ON CONFLICT (product_id, alert_type) WHERE is_resolved = false 
        DO UPDATE SET 
            message = EXCLUDED.message,
            updated_at = NOW();
    
    -- If stock is above reorder point, resolve any existing alerts
    ELSE
        UPDATE inventory_alerts
        SET 
            is_resolved = true,
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE 
            product_id = NEW.id 
            AND is_resolved = false;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error and continue
    RAISE WARNING 'Error in check_stock_levels: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock level checks
DROP TRIGGER IF EXISTS check_stock_levels_trigger ON products;
CREATE TRIGGER check_stock_levels_trigger
    AFTER INSERT OR UPDATE OF stock_quantity, reorder_point
    ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_levels();

-- Drop existing function if exists
DROP FUNCTION IF EXISTS resolve_inventory_alert(UUID);

-- Function to resolve alerts manually
CREATE OR REPLACE FUNCTION resolve_inventory_alert(alert_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE inventory_alerts
    SET 
        is_resolved = true,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE id = alert_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Workers can view all alerts
CREATE POLICY "Workers can view alerts"
    ON inventory_alerts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

-- Workers can update alerts
CREATE POLICY "Workers can update alerts"
    ON inventory_alerts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(is_resolved);

-- Trigger existing alerts for current products
DO $$ 
BEGIN
    -- Check all products for potential alerts
    UPDATE products
    SET updated_at = NOW()
    WHERE true;
END $$; 