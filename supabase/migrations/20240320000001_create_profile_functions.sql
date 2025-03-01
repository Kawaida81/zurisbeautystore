-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_client_profile(UUID);

-- Create function to get client profile
CREATE OR REPLACE FUNCTION public.get_client_profile(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile JSONB;
    v_client_profile JSONB;
    v_preferred_worker JSONB;
    v_upcoming_appointments JSONB;
    v_recent_services JSONB;
BEGIN
    -- Get user profile data
    SELECT jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'full_name', u.full_name,
        'phone', u.phone,
        'role', u.role,
        'is_active', u.is_active,
        'created_at', u.created_at
    )
    INTO v_profile
    FROM public.users u
    WHERE u.id = p_client_id;

    -- If no user found, return null
    IF v_profile IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get client profile data
    SELECT jsonb_build_object(
        'id', p.id,
        'preferred_contact', COALESCE(p.preferred_contact, 'email'),
        'preferred_worker_id', p.preferred_worker_id,
        'last_visit_date', p.last_visit_date,
        'total_visits', COALESCE(p.total_visits, 0),
        'total_spent', COALESCE(p.total_spent, 0),
        'loyalty_points', COALESCE(p.loyalty_points, 0),
        'created_at', p.created_at,
        'updated_at', p.updated_at
    )
    INTO v_client_profile
    FROM public.profiles p
    WHERE p.id = p_client_id;

    -- If no profile found, create one
    IF v_client_profile IS NULL THEN
        INSERT INTO public.profiles (
            id,
            preferred_contact,
            total_visits,
            total_spent,
            loyalty_points,
            created_at,
            updated_at
        ) VALUES (
            p_client_id,
            'email',
            0,
            0,
            0,
            NOW(),
            NOW()
        )
        RETURNING jsonb_build_object(
            'id', id,
            'preferred_contact', preferred_contact,
            'preferred_worker_id', preferred_worker_id,
            'last_visit_date', last_visit_date,
            'total_visits', total_visits,
            'total_spent', total_spent,
            'loyalty_points', loyalty_points,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_client_profile;
    END IF;

    -- Get preferred worker data if exists
    IF v_client_profile->>'preferred_worker_id' IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', u.id,
            'full_name', u.full_name,
            'email', u.email
        )
        INTO v_preferred_worker
        FROM public.users u
        WHERE u.id = (v_client_profile->>'preferred_worker_id')::UUID;
    END IF;

    -- Get upcoming appointments
    SELECT jsonb_agg(a)
    INTO v_upcoming_appointments
    FROM (
        SELECT a.*
        FROM public.appointments a
        WHERE a.client_id = p_client_id
        AND a.appointment_date >= CURRENT_DATE
        AND a.status = 'confirmed'
        ORDER BY a.appointment_date ASC
        LIMIT 5
    ) a;

    -- Get recent services
    SELECT jsonb_agg(s)
    INTO v_recent_services
    FROM (
        SELECT s.*
        FROM public.appointments a
        JOIN public.services s ON s.id = a.service_id
        WHERE a.client_id = p_client_id
        AND a.status = 'completed'
        ORDER BY a.appointment_date DESC
        LIMIT 5
    ) s;

    -- Combine all data and ensure we return a valid structure even if some parts are null
    RETURN jsonb_build_object(
        'profile', v_profile || jsonb_build_object(
            'client_profile', v_client_profile,
            'preferred_worker', COALESCE(v_preferred_worker, NULL),
            'upcoming_appointments', COALESCE(v_upcoming_appointments, '[]'::jsonb),
            'recent_services', COALESCE(v_recent_services, '[]'::jsonb)
        )
    );
END;
$$;