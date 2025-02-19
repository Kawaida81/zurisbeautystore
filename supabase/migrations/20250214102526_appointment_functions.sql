-- Enable PL/pgSQL if not already enabled
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- Drop existing functions first
DROP FUNCTION IF EXISTS check_appointment_availability(DATE, TEXT, UUID);
DROP FUNCTION IF EXISTS create_appointment(UUID, UUID, DATE, TEXT);
DROP FUNCTION IF EXISTS get_available_time_slots(DATE, UUID);

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION check_appointment_availability(
    p_date DATE,
    p_time TEXT,
    p_service_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    service_duration INTEGER;
    appointment_end_time TIME;
    slot_start_time TIME;
    slot_end_time TIME;
    existing_count INTEGER;
BEGIN
    -- Get service duration
    SELECT duration INTO service_duration
    FROM services
    WHERE id = p_service_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found';
    END IF;

    -- Convert appointment time to TIME type
    slot_start_time := TO_TIMESTAMP(p_time, 'HH:MI AM')::TIME;
    slot_end_time := (slot_start_time + (service_duration || ' minutes')::INTERVAL)::TIME;

    -- Check for overlapping appointments
    SELECT COUNT(*)
    INTO existing_count
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    WHERE a.appointment_date = p_date
    AND a.status IN ('pending', 'confirmed')
    AND (
        -- Check if new appointment overlaps with existing appointments
        (slot_start_time, slot_end_time) OVERLAPS 
        (TO_TIMESTAMP(a.time, 'HH:MI AM')::TIME,
         (TO_TIMESTAMP(a.time, 'HH:MI AM')::TIME + (s.duration || ' minutes')::INTERVAL)::TIME)
    );

    -- Return true if no overlapping appointments found
    RETURN existing_count = 0;
END;
$$;

-- Function to create a new appointment with validation
CREATE OR REPLACE FUNCTION create_appointment(
    p_client_id UUID,
    p_service_id UUID,
    p_date DATE,
    p_time TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role TEXT;
    v_is_active BOOLEAN;
    v_result JSONB;
BEGIN
    -- Check if user exists and is an active client
    SELECT role, is_active 
    INTO v_user_role, v_is_active
    FROM users
    WHERE id = p_client_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;

    IF v_user_role != 'client' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Only clients can create appointments'
        );
    END IF;

    IF NOT v_is_active THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User account is inactive'
        );
    END IF;

    -- Check if service exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM services 
        WHERE id = p_service_id 
        AND is_active = true
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Service not found or inactive'
        );
    END IF;

    -- Check appointment availability
    IF NOT check_appointment_availability(p_date, p_time, p_service_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Time slot is not available'
        );
    END IF;

    -- Create the appointment
    INSERT INTO appointments (
        client_id,
        service_id,
        appointment_date,
        time,
        status,
        created_at,
        updated_at
    )
    VALUES (
        p_client_id,
        p_service_id,
        p_date,
        p_time,
        'pending',
        NOW(),
        NOW()
    )
    RETURNING jsonb_build_object(
        'id', id,
        'client_id', client_id,
        'service_id', service_id,
        'appointment_date', appointment_date,
        'time', time,
        'status', status
    ) INTO v_result;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Appointment created successfully',
        'data', v_result
    );
END;
$$;

-- Function to get available time slots for a given date and service
CREATE OR REPLACE FUNCTION get_available_time_slots(
    p_date DATE,
    p_service_id UUID
)
RETURNS TABLE (
    time_slot TEXT,
    is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    service_duration INTEGER;
    start_time TIME := '09:00:00'::TIME;
    end_time TIME := '17:00:00'::TIME;
    slot_interval INTERVAL := '30 minutes';
    current_slot TIME;
BEGIN
    -- Get service duration
    SELECT duration INTO service_duration
    FROM services
    WHERE id = p_service_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found';
    END IF;

    -- Generate time slots
    FOR current_slot IN 
        SELECT time_slot::TIME
        FROM generate_series(
            start_time,
            end_time - slot_interval,
            slot_interval
        ) AS time_slot
    LOOP
        time_slot := TO_CHAR(current_slot, 'HH:MI AM');
        is_available := check_appointment_availability(p_date, time_slot, p_service_id);
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_appointment_availability TO authenticated;
GRANT EXECUTE ON FUNCTION create_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_time_slots TO authenticated; 