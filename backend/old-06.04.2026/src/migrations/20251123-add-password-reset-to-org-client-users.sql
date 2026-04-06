-- Migration to add password_reset_token and password_reset_expires columns
-- to organization_users and client_users tables
-- Date: 2025-11-23

-- Add columns to organization_users table
ALTER TABLE organization_users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);

ALTER TABLE organization_users 
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Add index for organization_users password_reset_token
CREATE INDEX IF NOT EXISTS idx_org_users_password_reset_token 
ON organization_users(password_reset_token) 
WHERE password_reset_token IS NOT NULL;

-- Add columns to client_users table
ALTER TABLE client_users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);

ALTER TABLE client_users 
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Add index for client_users password_reset_token
CREATE INDEX IF NOT EXISTS idx_client_users_password_reset_token 
ON client_users(password_reset_token) 
WHERE password_reset_token IS NOT NULL;
