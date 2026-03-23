-- Create test users with profiles for each role
-- Note: These users are created directly in auth.users for testing purposes
-- In production, users should be created through the signup flow

-- Insert test users into auth.users (this requires admin privileges)
-- Password for all test users: "Test123!"

-- 1. Organization Admin
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@hospital.com',
  '$2a$10$rS5Q2hCkJvJfqmXqJQJQyOZGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', -- This is a placeholder, real hash needed
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Patient Manager
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'pacientes@hospital.com',
  '$2a$10$rS5Q2hCkJvJfqmXqJQJQyOZGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 3. Doctor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'doctor@hospital.com',
  '$2a$10$rS5Q2hCkJvJfqmXqJQJQyOZGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create profiles for test users
INSERT INTO profiles (id, email, full_name, role, organization_id)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@hospital.com', 'Admin Hospital', 'org_admin', '00000000-0000-0000-0000-000000000001'),
  ('22222222-2222-2222-2222-222222222222', 'pacientes@hospital.com', 'Gestor de Pacientes', 'patient_admin', '00000000-0000-0000-0000-000000000001'), -- Changed from patient_manager to patient_admin to match enum
  ('33333333-3333-3333-3333-333333333333', 'doctor@hospital.com', 'Dr. Juan Pérez', 'doctor', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
