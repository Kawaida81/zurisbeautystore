-- Drop existing delete policy
DROP POLICY IF EXISTS "Clients can delete own appointments" ON appointments;

-- Create updated delete policy
CREATE POLICY "Clients can delete own appointments"
    ON appointments FOR DELETE
    TO authenticated
    USING (
        client_id = auth.uid() AND
        (
            -- Allow deletion of cancelled appointments
            status = 'cancelled' OR
            -- Allow deletion of pending appointments
            (status = 'pending' AND appointment_date > CURRENT_DATE)
        )
    );

-- Ensure RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY; 