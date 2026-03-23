-- Disable Row Level Security since we're using session-based auth
-- All security checks are now handled in the application code

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Org admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Org admins can view org profiles" ON profiles;
DROP POLICY IF EXISTS "Org admins can create org profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all patients" ON patients;
DROP POLICY IF EXISTS "Patient admins can create patients" ON patients;
DROP POLICY IF EXISTS "Patient admins can update patients" ON patients;
DROP POLICY IF EXISTS "Patient admins can delete patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can view folders" ON folders;
DROP POLICY IF EXISTS "Doctors can create folders" ON folders;
DROP POLICY IF EXISTS "Doctors can delete folders" ON folders;
DROP POLICY IF EXISTS "Authenticated users can view files" ON files;
DROP POLICY IF EXISTS "Doctors can upload files" ON files;
DROP POLICY IF EXISTS "Doctors can update files" ON files;
DROP POLICY IF EXISTS "Doctors can delete files" ON files;

-- Disable RLS on all tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
