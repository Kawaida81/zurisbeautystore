-- Function to create a new service
CREATE OR REPLACE FUNCTION create_service(
    p_name TEXT,
    p_description TEXT,
    p_category TEXT,
    p_duration INTEGER,
    p_price DECIMAL,
    p_is_active BOOLEAN DEFAULT true
) RETURNS JSONB AS $$
DECLARE
    v_service_id UUID;
BEGIN
    INSERT INTO services (
        name,
        description,
        category,
        duration,
        price,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_name,
        p_description,
        p_category,
        p_duration,
        p_price,
        p_is_active,
        NOW(),
        NOW()
    ) RETURNING id INTO v_service_id;

    RETURN jsonb_build_object(
        'success', true,
        'service_id', v_service_id,
        'message', 'Service created successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error creating service',
        'details', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a service
CREATE OR REPLACE FUNCTION update_service(
    p_service_id UUID,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_duration INTEGER DEFAULT NULL,
    p_price DECIMAL DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
    -- Check if service exists
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = p_service_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Service not found'
        );
    END IF;

    -- Update service with new values, keeping old values where new ones aren't provided
    UPDATE services SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        category = COALESCE(p_category, category),
        duration = COALESCE(p_duration, duration),
        price = COALESCE(p_price, price),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = NOW()
    WHERE id = p_service_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Service updated successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating service',
        'details', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a service
CREATE OR REPLACE FUNCTION delete_service(
    p_service_id UUID
) RETURNS JSONB AS $$
BEGIN
    -- Check if service exists
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = p_service_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Service not found'
        );
    END IF;

    -- Check if service is used in any appointments
    IF EXISTS (SELECT 1 FROM appointments WHERE service_id = p_service_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Cannot delete service as it is used in appointments'
        );
    END IF;

    -- Delete the service
    DELETE FROM services WHERE id = p_service_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Service deleted successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error deleting service',
        'details', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list services with optional filtering and pagination
CREATE OR REPLACE FUNCTION list_services(
    p_category TEXT DEFAULT NULL,
    p_search_term TEXT DEFAULT NULL,
    p_active_only BOOLEAN DEFAULT false,
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
    v_total_count INTEGER;
    v_results JSONB;
BEGIN
    -- Calculate total count for pagination
    SELECT COUNT(*) INTO v_total_count
    FROM services s
    WHERE (p_category IS NULL OR s.category = p_category)
    AND (p_search_term IS NULL OR 
         s.name ILIKE '%' || p_search_term || '%' OR 
         s.description ILIKE '%' || p_search_term || '%')
    AND (NOT p_active_only OR s.is_active = true);

    -- Get paginated results
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'category', s.category,
            'duration', s.duration,
            'price', s.price,
            'is_active', s.is_active,
            'created_at', s.created_at,
            'updated_at', s.updated_at
        )
    ) INTO v_results
    FROM services s
    WHERE (p_category IS NULL OR s.category = p_category)
    AND (p_search_term IS NULL OR 
         s.name ILIKE '%' || p_search_term || '%' OR 
         s.description ILIKE '%' || p_search_term || '%')
    AND (NOT p_active_only OR s.is_active = true)
    ORDER BY s.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size;

    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(v_results, '[]'::jsonb),
        'pagination', jsonb_build_object(
            'total_count', v_total_count,
            'page', p_page,
            'page_size', p_page_size,
            'total_pages', CEIL(v_total_count::NUMERIC / p_page_size)
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Error retrieving services',
        'details', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
    ON services FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow admin full access"
    ON services FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
