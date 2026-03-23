-- Disable the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Delete existing test users if they exist to start fresh
DELETE FROM profiles WHERE email IN ('admin@hospital.com', 'pacientes@hospital.com', 'doctor@hospital.com');
DELETE FROM auth.users WHERE email IN ('admin@hospital.com', 'pacientes@hospital.com', 'doctor@hospital.com');

-- Create users and profiles manually
DO $$
DECLARE
  test_org_id uuid;
  admin_user_id uuid := gen_random_uuid();
  patient_admin_user_id uuid := gen_random_uuid();
  doctor_user_id uuid := gen_random_uuid();
BEGIN
  -- Create test organization
  INSERT INTO organizations (name, created_at, updated_at)
  VALUES ('Hospital General', NOW(), NOW())
  RETURNING id INTO test_org_id;

  -- Create admin user in auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@hospital.com',
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  );

  -- Create profile for admin
  INSERT INTO profiles (id, email, full_name, role, organization_id, created_at, updated_at)
  VALUES (admin_user_id, 'admin@hospital.com', 'Administrador General', 'org_admin', test_org_id, NOW(), NOW());

  -- Create patient admin user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    patient_admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'pacientes@hospital.com',
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  );

  -- Create profile for patient admin
  INSERT INTO profiles (id, email, full_name, role, organization_id, created_at, updated_at)
  VALUES (patient_admin_user_id, 'pacientes@hospital.com', 'Admin de Pacientes', 'patient_admin', test_org_id, NOW(), NOW());

  -- Create doctor user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    doctor_user_id,
    '00000000-0000-0000-0000-000000000000',
    'doctor@hospital.com',
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  );

  -- Create profile for doctor
  INSERT INTO profiles (id, email, full_name, role, organization_id, created_at, updated_at)
  VALUES (doctor_user_id, 'doctor@hospital.com', 'Dr. Juan Pérez', 'doctor', test_org_id, NOW(), NOW());

END $$;
