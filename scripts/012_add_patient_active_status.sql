-- Add is_active field to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster lookups of active patients
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active);
