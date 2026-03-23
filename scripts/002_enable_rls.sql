-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
-- Org admins can only see their own organization
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only org admins can update their organization
CREATE POLICY "Org admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'org_admin'
    )
  );

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Org admins can view profiles in their organization
CREATE POLICY "Org admins can view org profiles"
  ON profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'org_admin'
    )
  );

-- Org admins can insert profiles in their organization
CREATE POLICY "Org admins can create org profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'org_admin'
    )
  );

-- RLS Policies for patients
-- All authenticated users can view all patients
CREATE POLICY "Authenticated users can view all patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

-- Only patient admins can insert patients
CREATE POLICY "Patient admins can create patients"
  ON patients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'patient_admin'
    )
  );

-- Only patient admins can update patients
CREATE POLICY "Patient admins can update patients"
  ON patients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'patient_admin'
    )
  );

-- Only patient admins can delete patients
CREATE POLICY "Patient admins can delete patients"
  ON patients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'patient_admin'
    )
  );

-- RLS Policies for folders
-- All authenticated users can view folders
CREATE POLICY "Authenticated users can view folders"
  ON folders FOR SELECT
  TO authenticated
  USING (true);

-- Doctors can create folders
CREATE POLICY "Doctors can create folders"
  ON folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Doctors can delete folders
CREATE POLICY "Doctors can delete folders"
  ON folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- RLS Policies for files
-- All authenticated users can view files
CREATE POLICY "Authenticated users can view files"
  ON files FOR SELECT
  TO authenticated
  USING (true);

-- Doctors can upload files
CREATE POLICY "Doctors can upload files"
  ON files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Doctors can update file metadata
CREATE POLICY "Doctors can update files"
  ON files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Doctors can delete files
CREATE POLICY "Doctors can delete files"
  ON files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );
