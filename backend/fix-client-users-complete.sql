-- Fix ALL missing columns in client_users table
BEGIN;

-- Add permissions if not exists
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Add settings if not exists
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"notifications": true, "language": "pt", "timezone": "Europe/Lisbon"}'::jsonb;

-- Add email_verified if not exists
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add email_verified_at if not exists
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Add is_active if not exists
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add last_login if not exists
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Add created_at if not exists
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at if not exists
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_organization_id ON client_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_users_is_active ON client_users(is_active);

COMMIT;

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'client_users'
ORDER BY ordinal_position;
