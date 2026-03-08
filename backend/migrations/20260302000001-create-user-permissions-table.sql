-- Migration: Create user_permissions table for RBAC
-- Date: 2026-03-02

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, permission_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_granted ON user_permissions(granted);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires_at ON user_permissions(expires_at);

-- Add comments
COMMENT ON TABLE user_permissions IS 'User-specific permission overrides for RBAC system';
COMMENT ON COLUMN user_permissions.user_id IS 'ID of the user (can be from users, organization_users, or client_users)';
COMMENT ON COLUMN user_permissions.permission_id IS 'ID of the permission being granted or revoked';
COMMENT ON COLUMN user_permissions.granted IS 'Whether the permission is granted (true) or revoked (false)';
COMMENT ON COLUMN user_permissions.granted_by IS 'ID of the user who granted/revoked this permission';
COMMENT ON COLUMN user_permissions.expires_at IS 'Optional expiration date for temporary permissions';
COMMENT ON COLUMN user_permissions.reason IS 'Optional reason for granting/revoking the permission';
