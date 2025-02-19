-- Drop existing function
DROP FUNCTION IF EXISTS decrement_product_stock(uuid, integer);

-- Create updated function with proper return type and error handling
CREATE OR REPLACE FUNCTION decrement_product_stock(
    p_product_id UUID,
    p_quantity INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock INTEGER;
    v_product_name TEXT;
    v_result JSONB;
BEGIN
    -- Get current product info
    SELECT name, stock_quantity
    INTO v_product_name, v_current_stock
    FROM products
    WHERE id = p_product_id;

    -- Check if product exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found',
            'details', format('Product with ID %s does not exist', p_product_id)
        );
    END IF;

    -- Check if there's enough stock
    IF v_current_stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', format('Insufficient stock for product "%s"', v_product_name),
            'details', format('Available: %s, Requested: %s', v_current_stock, p_quantity),
            'current_stock', v_current_stock
        );
    END IF;

    -- Update stock
    UPDATE products
    SET 
        stock_quantity = stock_quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING stock_quantity INTO v_current_stock;

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully updated stock for "%s"', v_product_name),
        'new_stock_quantity', v_current_stock
    );

EXCEPTION WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating product stock',
        'details', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated; 