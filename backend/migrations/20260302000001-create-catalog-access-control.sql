-- Migration: Create catalog_access_control table
-- Date: 2026-03-02
-- Description: Tabela para controle de acesso granular ao catálogo de serviços

-- Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE catalog_entity_type AS ENUM ('direction', 'department', 'section', 'user', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE catalog_resource_type AS ENUM ('category', 'item');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE catalog_access_type AS ENUM ('allow', 'deny');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table
CREATE TABLE IF NOT EXISTS catalog_access_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Entidade que tem acesso
    entity_type catalog_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Recurso do catálogo
    resource_type catalog_resource_type NOT NULL,
    resource_id UUID NOT NULL,
    
    -- Tipo de acesso
    access_type catalog_access_type NOT NULL DEFAULT 'allow',
    
    -- Metadados
    created_by UUID REFERENCES organization_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint única: uma regra por combinação
    CONSTRAINT unique_catalog_acl UNIQUE (organization_id, entity_type, entity_id, resource_type, resource_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_catalog_acl_entity ON catalog_access_control(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_catalog_acl_resource ON catalog_access_control(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_catalog_acl_org ON catalog_access_control(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_acl_entity_resource ON catalog_access_control(entity_type, entity_id, resource_type, resource_id);

-- Add comments
COMMENT ON TABLE catalog_access_control IS 'Controle de acesso granular ao catálogo de serviços';
COMMENT ON COLUMN catalog_access_control.entity_type IS 'Tipo de entidade: direction, department, section, user, client';
COMMENT ON COLUMN catalog_access_control.entity_id IS 'UUID da entidade (direção, departamento, secção, usuário ou cliente)';
COMMENT ON COLUMN catalog_access_control.resource_type IS 'Tipo de recurso: category, item';
COMMENT ON COLUMN catalog_access_control.resource_id IS 'UUID do recurso (categoria ou item do catálogo)';
COMMENT ON COLUMN catalog_access_control.access_type IS 'Tipo de acesso: allow (permitir), deny (negar - tem precedência)';
COMMENT ON COLUMN catalog_access_control.created_by IS 'Usuário que criou a regra';
