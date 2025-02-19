-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for preferred contact method if not exists
DO $$ BEGIN
    CREATE TYPE contact_preference AS ENUM ('email', 'phone', 'sms');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create client_profiles table
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(50),
    preferred_contact contact_preference DEFAULT 'email',
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    allergies TEXT,
    medical_conditions TEXT,
    skin_concerns TEXT,
    hair_type VARCHAR(100),
    preferred_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    preferences JSONB DEFAULT '{}'::jsonb,
    last_visit_date TIMESTAMPTZ,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Clients can view own profile" ON client_profiles;
DROP POLICY IF EXISTS "Clients can update own profile" ON client_profiles;
DROP POLICY IF EXISTS "Workers can view client profiles" ON client_profiles;
DROP POLICY IF EXISTS "Admins have full access" ON client_profiles;

-- Create policies
CREATE POLICY "Clients can view own profile"
    ON client_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Clients can update own profile"
    ON client_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Workers can view client profiles"
    ON client_profiles FOR SELECT
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
    ON client_profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.is_active = true
        )
    );

-- Create function to automatically create client profile
CREATE OR REPLACE FUNCTION create_client_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'client' THEN
        INSERT INTO client_profiles (id)
        VALUES (NEW.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create client profile when new client user is created
DROP TRIGGER IF EXISTS create_client_profile_trigger ON users;
CREATE TRIGGER create_client_profile_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_client_profile();

-- Create function to update client statistics
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last visit date and total visits
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE client_profiles
        SET last_visit_date = NEW.appointment_date,
            total_visits = total_visits + 1,
            total_spent = total_spent + (
                SELECT price 
                FROM services 
                WHERE id = NEW.service_id
            ),
            loyalty_points = loyalty_points + (
                SELECT FLOOR(price / 10) 
                FROM services 
                WHERE id = NEW.service_id
            ),
            updated_at = NOW()
        WHERE id = NEW.client_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update client stats when appointment is completed
DROP TRIGGER IF EXISTS update_client_stats_trigger ON appointments;
CREATE TRIGGER update_client_stats_trigger
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_client_stats();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_preferred_worker ON client_profiles(preferred_worker_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_last_visit ON client_profiles(last_visit_date);
CREATE INDEX IF NOT EXISTS idx_client_profiles_loyalty ON client_profiles(loyalty_points);

-- Create function to get client profile with related data
CREATE OR REPLACE FUNCTION get_client_profile(client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'full_name', u.full_name,
            'phone', u.phone,
            'role', u.role,
            'is_active', u.is_active,
            'created_at', u.created_at,
            'client_profile', row_to_json(cp.*),
            'preferred_worker', (
                SELECT row_to_json(w.*)
                FROM users w
                WHERE w.id = cp.preferred_worker_id
            ),
            'upcoming_appointments', (
                SELECT jsonb_agg(row_to_json(a.*))
                FROM appointments a
                WHERE a.client_id = client_id
                AND a.appointment_date >= CURRENT_DATE
                AND a.status NOT IN ('cancelled', 'completed')
                ORDER BY a.appointment_date ASC
                LIMIT 5
            ),
            'recent_services', (
                SELECT jsonb_agg(row_to_json(s.*))
                FROM appointments a
                JOIN services s ON s.id = a.service_id
                WHERE a.client_id = client_id
                AND a.status = 'completed'
                ORDER BY a.appointment_date DESC
                LIMIT 5
            )
        )
    ) INTO result
    FROM users u
    LEFT JOIN client_profiles cp ON cp.id = u.id
    WHERE u.id = client_id;

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_profile(UUID) TO authenticated; 