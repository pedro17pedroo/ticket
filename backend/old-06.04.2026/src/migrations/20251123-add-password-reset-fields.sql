-- Migration to add password_reset_token and password_reset_expires columns to users table
-- Date: 2025-11-23

-- Add password_reset_token column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);

-- Add password_reset_expires column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Add index for password_reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
ON users(password_reset_token) 
WHERE password_reset_token IS NOT NULL;
