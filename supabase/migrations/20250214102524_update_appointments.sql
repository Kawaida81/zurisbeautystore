-- Drop existing RLS policies that depend on status column
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can create reviews for their appointments" ON reviews;

-- Drop existing triggers and constraints
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
DROP TRIGGER IF EXISTS update_client_stats_trigger ON appointments;

-- Drop existing foreign key constraints
ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS appointments_client_id_fkey,
    DROP CONSTRAINT IF EXISTS appointments_service_id_fkey,
    DROP CONSTRAINT IF EXISTS appointments_worker_id_fkey;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_appointments_client_id;
DROP INDEX IF EXISTS idx_appointments_worker_id;
DROP INDEX IF EXISTS idx_appointments_service_id;
DROP INDEX IF EXISTS idx_appointments_date;
DROP INDEX IF EXISTS idx_appointments_status;

-- Set default values for timestamps
ALTER TABLE appointments
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

-- Set NOT NULL constraints
ALTER TABLE appointments
    ALTER COLUMN client_id SET NOT NULL,
    ALTER COLUMN service_id SET NOT NULL,
    ALTER COLUMN appointment_date SET NOT NULL,
    ALTER COLUMN time SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

-- Add foreign key constraints with proper ON DELETE actions
ALTER TABLE appointments
    ADD CONSTRAINT appointments_client_id_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
    
    ADD CONSTRAINT appointments_service_id_fkey 
    FOREIGN KEY (service_id) 
    REFERENCES services(id) 
    ON DELETE RESTRICT,
    
    ADD CONSTRAINT appointments_worker_id_fkey 
    FOREIGN KEY (worker_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

-- Recreate indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments USING btree (client_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_appointments_worker_id ON appointments USING btree (worker_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments USING btree (service_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments USING btree (appointment_date) TABLESPACE pg_default;

-- Recreate triggers
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER appointment_notification_trigger 
    AFTER INSERT OR UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION create_appointment_notification();

-- Recreate RLS policies
CREATE POLICY "Users can view own appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid() OR 
        worker_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
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