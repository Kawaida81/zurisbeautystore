-- Drop existing process_sale functions
DROP FUNCTION IF EXISTS process_sale(UUID, UUID, JSONB, JSONB[], payment_method, payment_status);
DROP FUNCTION IF EXISTS process_sale(UUID, UUID, JSONB, JSONB, payment_method, payment_status);

-- Create function to process a new sale
CREATE OR REPLACE FUNCTION process_sale(
    p_client_id UUID,
    p_worker_id UUID,
    p_services JSONB,
    p_items JSONB,
    p_payment_method payment_method,
    p_payment_status payment_status DEFAULT 'pending'::payment_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id UUID;
    v_total_amount DECIMAL(10,2) := 0;
    v_service_amount DECIMAL(10,2) := 0;
    v_product_amount DECIMAL(10,2) := 0;
    v_sale_type sale_type;
    v_item JSONB;
BEGIN
    -- Verify worker authorization
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = p_worker_id
        AND role = 'worker'
        AND is_active = true
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Unauthorized: Invalid or inactive worker'
        );
    END IF;

    -- Calculate services total
    IF jsonb_array_length(p_services) > 0 THEN
        SELECT COALESCE(SUM((svc->>'price')::DECIMAL(10,2)), 0)
        INTO v_service_amount
        FROM jsonb_array_elements(p_services) as svc;
        v_total_amount := v_total_amount + v_service_amount;
    END IF;

    -- Calculate products total
    IF jsonb_array_length(p_items) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            -- Add to product total
            v_product_amount := v_product_amount + (
                (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL(10,2)
            );
        END LOOP;
        v_total_amount := v_total_amount + v_product_amount;
    END IF;

    -- Determine sale type
    v_sale_type := CASE 
        WHEN v_service_amount > 0 AND v_product_amount > 0 THEN 'combined'::sale_type
        WHEN v_service_amount > 0 THEN 'service'::sale_type
        ELSE 'product'::sale_type
    END;

    -- Create sale record
    INSERT INTO sales (
        client_id,
        worker_id,
        services,
        total_amount,
        payment_method,
        payment_status,
        sale_type,
        created_at,
        updated_at
    ) VALUES (
        p_client_id,
        p_worker_id,
        p_services,
        v_total_amount,
        p_payment_method,
        p_payment_status,
        v_sale_type,
        NOW(),
        NOW()
    ) RETURNING id INTO v_sale_id;

    -- Create sale items
    IF jsonb_array_length(p_items) > 0 THEN
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            created_at,
            updated_at
        )
        SELECT 
            v_sale_id,
            (item->>'product_id')::UUID,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::DECIMAL(10,2),
            (item->>'quantity')::INTEGER * (item->>'unit_price')::DECIMAL(10,2),
            NOW(),
            NOW()
        FROM jsonb_array_elements(p_items) AS item;
    END IF;

    -- Update client profile if exists
    IF p_client_id IS NOT NULL THEN
        UPDATE profiles
        SET 
            total_spent = COALESCE(total_spent, 0) + v_total_amount,
            total_visits = COALESCE(total_visits, 0) + 1,
            last_visit_date = NOW(),
            updated_at = NOW()
        WHERE id = p_client_id;
    END IF;

    -- Return sale details
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'total_amount', v_total_amount,
        'sale_type', v_sale_type,
        'services_amount', v_service_amount,
        'products_amount', v_product_amount
    );

EXCEPTION WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error processing sale: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_sale(UUID, UUID, JSONB, JSONB, payment_method, payment_status) TO authenticated; 