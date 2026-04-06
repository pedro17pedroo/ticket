-- Migration: Create Catalog Access Control Tables
-- Date: 2026-01-14
-- Description: Creates tables for managing catalog access permissions for clients and client users

BEGIN;

-- ============================================================================
-- CLIENT CATALOG ACCESS TABLE
-- Stores catalog access permissions for client companies
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_catalog_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  access_mode VARCHAR(20) DEFAULT 'all' CHECK (access_mode IN ('all', 'selected', 'none')),
  allowed_categories UUID[] DEFAULT '{}',
  allowed_items UUID[] DEFAULT '{}',
  denied_categories UUID[] DEFAULT '{}',
  denied_items UUID[] DEFAULT '{}',
  modified_by UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for client_catalog_access
CREATE INDEX IF NOT EXISTS idx_client_catalog_access_organization_id ON client_catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_catalog_access_client_id ON client_catalog_access(client_id);

-- Comments for client_catalog_access
COMMENT ON TABLE client_catalog_access IS 'Stores catalog access permissions for client companies';
COMMENT ON COLUMN client_catalog_access.organization_id IS 'Tenant organization that owns this access rule';
COMMENT ON COLUMN client_catalog_access.client_id IS 'Client company this access rule applies to';
COMMENT ON COLUMN client_catalog_access.access_mode IS 'Access mode: all (full access), selected (specific items), none (no access)';
COMMENT ON COLUMN client_catalog_access.allowed_categories IS 'Array of allowed category UUIDs (whitelist)';
COMMENT ON COLUMN client_catalog_access.allowed_items IS 'Array of allowed item UUIDs (whitelist)';
COMMENT ON COLUMN client_catalog_access.denied_categories IS 'Array of denied category UUIDs (blacklist)';
COMMENT ON COLUMN client_catalog_access.denied_items IS 'Array of denied item UUIDs (blacklist)';
COMMENT ON COLUMN client_catalog_access.modified_by IS 'Organization user who last modified this rule';

-- ============================================================================
-- CLIENT USER CATALOG ACCESS TABLE
-- Stores catalog access permissions for individual client users
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_user_catalog_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL UNIQUE REFERENCES client_users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  inheritance_mode VARCHAR(20) DEFAULT 'inherit' CHECK (inheritance_mode IN ('inherit', 'override', 'extend')),
  access_mode VARCHAR(20) DEFAULT 'all' CHECK (access_mode IN ('all', 'selected', 'none')),
  allowed_categories UUID[] DEFAULT '{}',
  allowed_items UUID[] DEFAULT '{}',
  denied_categories UUID[] DEFAULT '{}',
  denied_items UUID[] DEFAULT '{}',
  modified_by UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for client_user_catalog_access
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_organization_id ON client_user_catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_client_id ON client_user_catalog_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_client_user_id ON client_user_catalog_access(client_user_id);

-- Comments for client_user_catalog_access
COMMENT ON TABLE client_user_catalog_access IS 'Stores catalog access permissions for individual client users';
COMMENT ON COLUMN client_user_catalog_access.organization_id IS 'Tenant organization that owns this access rule';
COMMENT ON COLUMN client_user_catalog_access.client_user_id IS 'Client user this access rule applies to';
COMMENT ON COLUMN client_user_catalog_access.client_id IS 'Parent client company for reference';
COMMENT ON COLUMN client_user_catalog_access.inheritance_mode IS 'How permissions are inherited: inherit (use client rules), override (use user rules), extend (add to client rules)';
COMMENT ON COLUMN client_user_catalog_access.access_mode IS 'Access mode when inheritance_mode is override: all, selected, none';
COMMENT ON COLUMN client_user_catalog_access.allowed_categories IS 'Array of allowed category UUIDs (whitelist)';
COMMENT ON COLUMN client_user_catalog_access.allowed_items IS 'Array of allowed item UUIDs (whitelist)';
COMMENT ON COLUMN client_user_catalog_access.denied_categories IS 'Array of denied category UUIDs (blacklist)';
COMMENT ON COLUMN client_user_catalog_access.denied_items IS 'Array of denied item UUIDs (blacklist)';
COMMENT ON COLUMN client_user_catalog_access.modified_by IS 'Organization user who last modified this rule';

-- ============================================================================
-- CATALOG ACCESS AUDIT LOGS TABLE
-- Stores audit trail for catalog access permission changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog_access_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('client', 'client_user')),
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  previous_state JSONB,
  new_state JSONB,
  changed_by UUID NOT NULL,
  changed_by_name VARCHAR(255),
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for catalog_access_audit_logs
CREATE INDEX IF NOT EXISTS idx_catalog_access_audit_logs_organization_id ON catalog_access_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_access_audit_logs_entity ON catalog_access_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_catalog_access_audit_logs_created_at ON catalog_access_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_catalog_access_audit_logs_changed_by ON catalog_access_audit_logs(changed_by);

-- Comments for catalog_access_audit_logs
COMMENT ON TABLE catalog_access_audit_logs IS 'Audit trail for catalog access permission changes';
COMMENT ON COLUMN catalog_access_audit_logs.organization_id IS 'Tenant organization where the change occurred';
COMMENT ON COLUMN catalog_access_audit_logs.entity_type IS 'Type of entity: client or client_user';
COMMENT ON COLUMN catalog_access_audit_logs.entity_id IS 'ID of the client or client_user';
COMMENT ON COLUMN catalog_access_audit_logs.action IS 'Action performed: create, update, delete';
COMMENT ON COLUMN catalog_access_audit_logs.previous_state IS 'JSON snapshot of permissions before change';
COMMENT ON COLUMN catalog_access_audit_logs.new_state IS 'JSON snapshot of permissions after change';
COMMENT ON COLUMN catalog_access_audit_logs.changed_by IS 'User ID who made the change';
COMMENT ON COLUMN catalog_access_audit_logs.changed_by_name IS 'Name of user who made the change';
COMMENT ON COLUMN catalog_access_audit_logs.ip_address IS 'IP address from which the change was made';

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_catalog_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for client_catalog_access
DROP TRIGGER IF EXISTS trigger_client_catalog_access_updated_at ON client_catalog_access;
CREATE TRIGGER trigger_client_catalog_access_updated_at
  BEFORE UPDATE ON client_catalog_access
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_access_updated_at();

-- Trigger for client_user_catalog_access
DROP TRIGGER IF EXISTS trigger_client_user_catalog_access_updated_at ON client_user_catalog_access;
CREATE TRIGGER trigger_client_user_catalog_access_updated_at
  BEFORE UPDATE ON client_user_catalog_access
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_access_updated_at();

COMMIT;
