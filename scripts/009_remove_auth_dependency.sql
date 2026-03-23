-- Remove dependency on auth.users and make profiles self-contained
-- Drop the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make sure id column is just a UUID primary key without foreign key
-- If the column doesn't exist as standalone, we need to recreate the table structure

-- First, let's update the profiles table to be self-contained
-- Add username and password columns if they don't exist
DO $$ 
BEGIN
  -- Add username if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE profiles ADD COLUMN username TEXT;
  END IF;
  
  -- Add password_hash if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'password_hash') THEN
    ALTER TABLE profiles ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- Drop any existing unique constraints on username
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_unique;

-- Update any NULL usernames to avoid unique constraint violations
UPDATE profiles SET username = '' WHERE username IS NULL;

-- Create unique constraint on username
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Delete existing test users to avoid conflicts
DELETE FROM profiles WHERE username IN ('admin', 'doctor', 'pacientes');

-- Create test organization if it doesn't exist
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Hospital de Prueba')
ON CONFLICT (id) DO NOTHING;

-- Insert test users with plain text passwords (NOT SECURE - for development only)
-- Password: test123 (plain text)
INSERT INTO profiles (id, email, full_name, role, organization_id, username, password_hash, is_active)
VALUES 
  (gen_random_uuid(), 'admin@hospital.com', 'Admin Hospital', 'org_admin', '00000000-0000-0000-0000-000000000001', 'admin', 'test123', true),
  (gen_random_uuid(), 'doctor@hospital.com', 'Dr. Juan Pérez', 'doctor', '00000000-0000-0000-0000-000000000001', 'doctor', 'test123', true),
  (gen_random_uuid(), 'pacientes@hospital.com', 'Admin Pacientes', 'patient_admin', '00000000-0000-0000-0000-000000000001', 'pacientes', 'test123', true);
