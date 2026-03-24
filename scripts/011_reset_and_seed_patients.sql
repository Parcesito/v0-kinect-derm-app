-- 1. Clean up existing patient data (files, folders, patients)
-- Order matters due to foreign key constraints
DELETE FROM files;
DELETE FROM folders;
DELETE FROM patients;

-- 2. Ensure test organization exists
-- We use the ID from script 009 to be consistent
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Hospital de Prueba')
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure test users exist (if they were deleted by accident)
-- Password: test123
INSERT INTO profiles (id, email, full_name, role, organization_id, username, password_hash, is_active)
VALUES 
  (gen_random_uuid(), 'admin@hospital.com', 'Admin Hospital', 'org_admin', '00000000-0000-0000-0000-000000000001', 'admin', 'test123', true),
  (gen_random_uuid(), 'doctor@hospital.com', 'Dr. Juan Pérez', 'doctor', '00000000-0000-0000-0000-000000000001', 'doctor', 'test123', true),
  (gen_random_uuid(), 'pacientes@hospital.com', 'Admin Pacientes', 'patient_admin', '00000000-0000-0000-0000-000000000001', 'pacientes', 'test123', true)
ON CONFLICT (username) DO NOTHING;

-- 4. Create 3 test patients
-- We associate them with the 'doctor' user for 'created_by'
DO $$
DECLARE
  doctor_id uuid;
BEGIN
  SELECT id INTO doctor_id FROM profiles WHERE username = 'doctor' LIMIT 1;

  INSERT INTO patients (id, first_name, last_name, date_of_birth, email, phone, address, created_by)
  VALUES 
    (gen_random_uuid(), 'Juan', 'García', '2005-03-15', 'juan.garcia@email.com', '3242276977', 'Calle Falsa 123', doctor_id),
    (gen_random_uuid(), 'Maria', 'López', '1981-07-22', 'maria.lopez@email.com', '3109876543', 'Avenida Siempre Viva 742', doctor_id),
    (gen_random_uuid(), 'Carlos', 'Ruiz', '1966-11-30', 'carlos.ruiz@email.com', '3151234567', 'Carrera 10 # 20-30', doctor_id);
END $$;
