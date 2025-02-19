-- Create the appointment_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE public.appointment_status AS ENUM (
            'pending',
            'confirmed',
            'cancelled',
            'completed'
        );
    END IF;
END $$;

-- Ensure the appointments table uses the enum type
ALTER TABLE appointments 
    ALTER COLUMN status TYPE public.appointment_status 
    USING status::public.appointment_status;

-- Add the status check constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_status_check'
    ) THEN
        ALTER TABLE appointments
        ADD CONSTRAINT appointments_status_check 
        CHECK (
            status::text = ANY (
                ARRAY[
                    'pending'::text,
                    'confirmed'::text,
                    'cancelled'::text,
                    'completed'::text
                ]
            )
        );
    END IF;
END $$; 