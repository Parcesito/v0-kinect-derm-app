-- Add identification_number field to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS identification_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_identification_number ON patients(identification_number);
