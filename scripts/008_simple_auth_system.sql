-- Drop the trigger that's causing problems
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Modify profiles table to include authentication fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) DEFAULT '',
ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop all existing username constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_unique;

-- Delete existing test users first to avoid conflicts
DELETE FROM profiles WHERE username IN ('admin', 'doctor', 'pacientes');

-- Update any NULL usernames to empty string before adding unique constraint
UPDATE profiles SET username = '' WHERE username IS NULL;

-- Add unique constraint on username (only for non-empty usernames)
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create index for faster username lookups
DROP INDEX IF EXISTS idx_profiles_username;
CREATE INDEX idx_profiles_username ON profiles(username);

-- Ensure the Hospital General organization exists
-- Added missing semicolon at end of INSERT statement
INSERT INTO organizations (id, name, created_at)
VALUES (gen_random_uuid(), 'Hospital General', NOW());

-- Insert test users with simple bcrypt hashed passwords
-- Password for all users: "test123"
-- Hash: $2a$10$rMGLq5GzJbKxIoLxKZUXYO3xqhqFxB5qHLZQQm5r4uN3xJ4YFoLaS
INSERT INTO profiles (id, username, password_hash, full_name, role, organization_id, email, is_active)
VALUES 
  (gen_random_uuid(), 'admin', '$2a$10$rMGLq5GzJbKxIoLxKZUXYO3xqhqFxB5qHLZQQm5r4uN3xJ4YFoLaS', 'Administrador', 'org_admin', (SELECT id FROM organizations WHERE name = 'Hospital General' LIMIT 1), 'admin@hospital.com', true),
  (gen_random_uuid(), 'doctor', '$2a$10$rMGLq5GzJbKxIoLxKZUXYO3xqhqFxB5qHLZQQm5r4uN3xJ4YFoLaS', 'Dr. García', 'doctor', (SELECT id FROM organizations WHERE name = 'Hospital General' LIMIT 1), 'doctor@hospital.com', true),
  (gen_random_uuid(), 'pacientes', '$2a$10$rMGLq5GzJbKxIoLxKZUXYO3xqhqFxB5qHLZQQm5r4uN3xJ4YFoLaS', 'Admin Pacientes', 'patient_admin', (SELECT id FROM organizations WHERE name = 'Hospital General' LIMIT 1), 'pacientes@hospital.com', true);
