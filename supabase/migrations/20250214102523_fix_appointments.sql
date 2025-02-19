-- Drop existing policies that depend on status column
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can delete own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can create reviews for their appointments" ON reviews;
DROP POLICY IF EXISTS "Enable insert for service role" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Workers can view appointments" ON appointments;
DROP POLICY IF EXISTS "Workers can update appointments" ON appointments;

-- Drop the service column since we have service_id
ALTER TABLE appointments DROP COLUMN IF EXISTS service;

-- Add NOT NULL constraints to required fields
ALTER TABLE appointments 
    ALTER COLUMN client_id SET NOT NULL,
    ALTER COLUMN service_id SET NOT NULL,
    ALTER COLUMN appointment_date SET NOT NULL,
    ALTER COLUMN time SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

-- Create an enum type for appointment status if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Convert status column to use the enum type
ALTER TABLE appointments 
    ALTER COLUMN status TYPE appointment_status 
    USING status::appointment_status;

-- Update foreign key constraints with proper ON DELETE actions
ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS appointments_client_id_fkey,
    ADD CONSTRAINT appointments_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS appointments_service_id_fkey,
    ADD CONSTRAINT appointments_service_id_fkey 
    FOREIGN KEY (service_id) 
    REFERENCES services(id) 
    ON DELETE RESTRICT;

ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS appointments_worker_id_fkey,
    ADD CONSTRAINT appointments_worker_id_fkey 
    FOREIGN KEY (worker_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_worker_id ON appointments(worker_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create notifications policies
CREATE POLICY "Enable insert for service role"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Recreate appointment policies
CREATE POLICY "Users can view own appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid() OR 
        worker_id = auth.uid() OR
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND role = 'worker'
                AND is_active = true
            )
            AND (
                worker_id IS NULL 
                OR worker_id = auth.uid()
            )
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

CREATE POLICY "Workers can update appointments"
    ON appointments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'worker'
            AND is_active = true
        )
    )
    WITH CHECK (
        (worker_id IS NULL AND status = 'pending') OR
        (worker_id = auth.uid() AND status IN ('confirmed', 'completed', 'cancelled'))
    );

CREATE POLICY "Clients can create appointments"
    ON appointments FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'client' AND is_active = true
        )
    );

CREATE POLICY "Users can update own appointments"
    ON appointments FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (
        client_id = auth.uid() AND
        status::text = ANY (ARRAY['pending', 'cancelled']::text[])
    );

CREATE POLICY "Clients can delete own appointments"
    ON appointments FOR DELETE
    TO authenticated
    USING (
        client_id = auth.uid() AND
        status::text = ANY (ARRAY['pending', 'cancelled']::text[])
    );

-- Recreate reviews policy
CREATE POLICY "Clients can create reviews for their appointments"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.id = appointment_id 
            AND appointments.client_id = auth.uid()
            AND appointments.status = 'completed'
        )
    );

-- Ensure triggers exist
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
CREATE TRIGGER appointment_notification_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_appointment_notification();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for new appointment
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
            NEW.client_id,
            'Appointment Scheduled',
            'Your appointment has been scheduled for ' || NEW.appointment_date::date || ' at ' || NEW.time,
            'appointment'
        );
    
    -- Create notification for status update
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Convert status to proper case without using INITCAP
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
            NEW.client_id,
            'Appointment ' || CASE NEW.status::text
                WHEN 'pending' THEN 'Pending'
                WHEN 'confirmed' THEN 'Confirmed'
                WHEN 'cancelled' THEN 'Cancelled'
                WHEN 'completed' THEN 'Completed'
                ELSE NEW.status::text
            END,
            'Your appointment for ' || NEW.appointment_date::date || ' has been ' || NEW.status::text,
            'appointment'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get client appointments with related data
CREATE OR REPLACE FUNCTION get_client_appointments(p_client_id UUID)
RETURNS TABLE (
    id UUID,
    client_id UUID,
    worker_id UUID,
    service_id UUID,
    appointment_date TIMESTAMPTZ,
    appointment_time TEXT,
    status appointment_status,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    service JSONB,
    worker JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.client_id,
        a.worker_id,
        a.service_id,
        a.appointment_date,
        a.time as appointment_time,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at,
        jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'duration', s.duration,
            'price', s.price,
            'category', s.category,
            'image_url', s.image_url,
            'is_active', s.is_active,
            'created_at', s.created_at,
            'updated_at', s.updated_at
        ) as service,
        CASE 
            WHEN w.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', w.id,
                    'full_name', w.full_name,
                    'email', w.email
                )
            ELSE NULL
        END as worker
    FROM appointments a
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN users w ON w.id = a.worker_id
    WHERE a.client_id = p_client_id
    ORDER BY a.appointment_date DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_appointments(UUID) TO authenticated; 