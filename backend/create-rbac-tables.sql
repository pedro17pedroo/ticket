-- Create RBAC Tables (Role-Based Access Control)
-- Date: 2026-01-17
-- Description: Creates permissions, roles, and role_permissions tables

BEGIN;

-- ============================================================================
-- 1. PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  scope VARCHAR(50) DEFAULT 'organization',
  category VARCHAR(50) DEFAULT 'general',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_permission UNIQUE(resource, action)
);

-- Indexes for permissions
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_scope ON permissions(scope);

-- Comments
COMMENT ON TABLE permissions IS 'System permissions for RBAC';
COMMENT ON COLUMN permissions.resource IS 'Resource being protected (e.g., tickets, projects, users)';
COMMENT ON COLUMN permissions.action IS 'Action on the resource (e.g., create, read, update, delete)';
COMMENT ON COLUMN permissions.scope IS 'Scope of permission: system, organization, client';
COMMENT ON COLUMN permissions.category IS 'Category for grouping: general, tickets, projects, admin, etc';
COMMENT ON COLUMN permissions.is_system IS 'System permissions cannot be deleted';

-- ============================================================================
-- 2. ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(50) NOT NULL DEFAULT 'organization',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_level CHECK (level IN ('system', 'organization', 'client')),
  CONSTRAINT unique_role_name_per_org UNIQUE(name, organization_id, client_id)
);

-- Indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_client_id ON roles(client_id);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_priority ON roles(priority);

-- Comments
COMMENT ON TABLE roles IS 'Roles for RBAC system';
COMMENT ON COLUMN roles.name IS 'Unique role name (e.g., admin, agent, manager)';
COMMENT ON COLUMN roles.level IS 'Role level: system (provider), organization (tenant), client';
COMMENT ON COLUMN roles.organization_id IS 'Organization that owns this role (NULL for system roles)';
COMMENT ON COLUMN roles.client_id IS 'Client that owns this role (NULL for system/org roles)';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be deleted';
COMMENT ON COLUMN roles.priority IS 'Role priority for hierarchy (higher = more permissions)';

-- ============================================================================
-- 3. ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

-- Indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted ON role_permissions(granted);

-- Comments
COMMENT ON TABLE role_permissions IS 'Association between roles and permissions';
COMMENT ON COLUMN role_permissions.granted IS 'Whether the permission is granted (true) or denied (false)';

-- ============================================================================
-- 4. TRIGGERS FOR updated_at
-- ============================================================================

-- Trigger function
CREATE OR REPLACE FUNCTION update_rbac_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for permissions
DROP TRIGGER IF EXISTS trigger_permissions_updated_at ON permissions;
CREATE TRIGGER trigger_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_rbac_tables_updated_at();

-- Trigger for roles
DROP TRIGGER IF EXISTS trigger_roles_updated_at ON roles;
CREATE TRIGGER trigger_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_rbac_tables_updated_at();

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'RBAC tables created successfully' as status;

SELECT 'permissions table:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'permissions'
ORDER BY ordinal_position;

SELECT 'roles table:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roles'
ORDER BY ordinal_position;

SELECT 'role_permissions table:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'role_permissions'
ORDER BY ordinal_position;
