-- Create a default organization for testing
INSERT INTO organizations (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Hospital General')
ON CONFLICT (id) DO NOTHING;

-- Note: Users must be created through the signup flow
-- This seed file is for initial setup only
