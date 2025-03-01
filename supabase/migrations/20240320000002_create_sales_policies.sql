-- Enable RLS on sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for sales table
CREATE POLICY "Workers can view all sales" 
    ON sales FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

CREATE POLICY "Workers can create sales" 
    ON sales FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
        AND worker_id = auth.uid() -- Ensure worker can only create sales with their own ID
    );

CREATE POLICY "Workers can update their own sales" 
    ON sales FOR UPDATE 
    TO authenticated 
    USING (
        worker_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

-- Create policies for sale_items table
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view all sale items" 
    ON sale_items FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

CREATE POLICY "Workers can create sale items" 
    ON sale_items FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales s
            WHERE s.id = sale_items.sale_id
            AND s.worker_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON sales TO authenticated;
GRANT ALL ON sale_items TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 