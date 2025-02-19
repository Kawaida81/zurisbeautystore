-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS handle_new_profile();

-- Create function to automatically create profile
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Create trigger for new profile creation
CREATE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_profile();

-- Update existing users without profiles
INSERT INTO profiles (id)
SELECT id FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING; 