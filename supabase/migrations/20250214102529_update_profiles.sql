-- Create enum for preferred contact method if not exists
DO $$ BEGIN
    CREATE TYPE contact_preference AS ENUM ('email', 'phone', 'sms');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to profiles table
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS preferred_contact contact_preference DEFAULT 'email',
    ADD COLUMN IF NOT EXISTS preferred_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Drop removed columns if they exist
ALTER TABLE profiles
    DROP COLUMN IF EXISTS date_of_birth,
    DROP COLUMN IF EXISTS gender,
    DROP COLUMN IF EXISTS emergency_contact_name,
    DROP COLUMN IF EXISTS emergency_contact_phone,
    DROP COLUMN IF EXISTS allergies,
    DROP COLUMN IF EXISTS medical_conditions,
    DROP COLUMN IF EXISTS skin_concerns,
    DROP COLUMN IF EXISTS hair_type;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_worker ON profiles(preferred_worker_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_visit ON profiles(last_visit_date);
CREATE INDEX IF NOT EXISTS idx_profiles_loyalty ON profiles(loyalty_points);

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_client_profile(UUID);
DROP FUNCTION IF EXISTS get_client_profile(client_id UUID);
DROP FUNCTION IF EXISTS get_client_profile(p_client_id UUID);

-- Create updated function to work with profiles table
CREATE OR REPLACE FUNCTION get_client_profile(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    upcoming_apps JSONB;
    recent_servs JSONB;
BEGIN
    -- Get upcoming appointments
    WITH upcoming AS (
        SELECT 
            a.id,
            a.appointment_date,
            a.time,
            a.status,
            jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'duration', s.duration,
                'price', s.price
            ) as service_details
        FROM appointments a
        LEFT JOIN services s ON s.id = a.service_id
        WHERE a.client_id = p_client_id
        AND a.appointment_date >= CURRENT_DATE
        AND a.status NOT IN ('cancelled', 'completed')
        ORDER BY a.appointment_date ASC
        LIMIT 5
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'appointment_date', appointment_date,
            'time', time,
            'status', status,
            'service', service_details
        )
    ) INTO upcoming_apps
    FROM upcoming;

    -- Get recent services
    WITH recent AS (
        SELECT DISTINCT ON (a.service_id)
            s.id,
            s.name,
            s.duration,
            s.price,
            a.appointment_date
        FROM appointments a
        JOIN services s ON s.id = a.service_id
        WHERE a.client_id = p_client_id
        AND a.status = 'completed'
        ORDER BY a.service_id, a.appointment_date DESC
        LIMIT 5
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'name', name,
            'duration', duration,
            'price', price,
            'appointment_date', appointment_date
        )
    ) INTO recent_servs
    FROM recent;

    -- Build final result
    SELECT jsonb_build_object(
        'profile', jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'full_name', u.full_name,
            'phone', u.phone,
            'role', u.role,
            'is_active', u.is_active,
            'created_at', u.created_at,
            'updated_at', u.updated_at,
            'client_profile', jsonb_build_object(
                'id', p.id,
                'preferred_contact', p.preferred_contact,
                'preferred_worker_id', p.preferred_worker_id,
                'last_visit_date', p.last_visit_date,
                'total_visits', COALESCE(p.total_visits, 0),
                'total_spent', COALESCE(p.total_spent, 0.00),
                'loyalty_points', COALESCE(p.loyalty_points, 0),
                'created_at', p.created_at,
                'updated_at', p.updated_at
            ),
            'preferred_worker', (
                SELECT jsonb_build_object(
                    'id', w.id,
                    'full_name', w.full_name,
                    'email', w.email
                )
                FROM users w
                WHERE w.id = p.preferred_worker_id
            ),
            'upcoming_appointments', COALESCE(upcoming_apps, '[]'::jsonb),
            'recent_services', COALESCE(recent_servs, '[]'::jsonb)
        )
    ) INTO result
    FROM users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.id = p_client_id;

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_profile(UUID) TO authenticated;

-- Update RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Workers can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access" ON profiles;

-- Create policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Workers can view profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'worker'
            AND users.is_active = true
        )
    );

CREATE POLICY "Admins have full access"
    ON profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.is_active = true
        )
    ); 