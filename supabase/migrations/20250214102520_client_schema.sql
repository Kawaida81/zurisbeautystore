-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies first
DROP POLICY IF EXISTS "Services are viewable by authenticated users" ON services;
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Reviews are viewable by all authenticated users" ON reviews;
DROP POLICY IF EXISTS "Clients can create reviews for their appointments" ON reviews;
DROP POLICY IF EXISTS "Clients can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    time VARCHAR(10) NOT NULL, -- Store time as "HH:MM AM/PM"
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, appointment_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('appointment', 'system', 'reminder')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies

-- Services Policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are viewable by authenticated users"
    ON services FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Appointments Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
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

CREATE POLICY "Users can update their own appointments"
    ON appointments FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- Reviews Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by all authenticated users"
    ON reviews FOR SELECT
    TO authenticated
    USING (true);

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

CREATE POLICY "Clients can update their own reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- Notifications Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_worker_id ON appointments(worker_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;

DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS create_appointment_notification();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
            NEW.client_id,
            'Appointment ' || INITCAP(NEW.status),
            'Your appointment for ' || NEW.appointment_date::date || ' has been ' || NEW.status,
            'appointment'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for appointment notifications
CREATE TRIGGER appointment_notification_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION create_appointment_notification(); 