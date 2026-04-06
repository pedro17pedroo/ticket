-- Migration: Create Client Users Table
-- Data: 2025-11-04
-- Descrição: Cria tabela para usuários das empresas clientes

BEGIN;

-- 1. Criar ENUM para roles de client users
DO $$ BEGIN
  CREATE TYPE client_user_role AS ENUM ('client-admin', 'client-manager', 'client-user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela client_users
CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Identificação
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  
  -- Role dentro da empresa cliente
  role client_user_role NOT NULL DEFAULT 'client-user',
  
  -- Perfil
  avatar VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  department_name VARCHAR(100),
  
  -- Localização (JSONB para suporte on-site)
  location JSONB DEFAULT '{}'::jsonb,
  
  -- Permissões (JSONB)
  permissions JSONB DEFAULT '{
    "canCreateTickets": true,
    "canViewAllClientTickets": false,
    "canApproveRequests": false,
    "canAccessKnowledgeBase": true,
    "canRequestServices": true
  }'::jsonb,
  
  -- Configurações pessoais (JSONB)
  settings JSONB DEFAULT '{
    "notifications": true,
    "emailNotifications": true,
    "theme": "light",
    "language": "pt",
    "autoWatchTickets": true
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  last_login TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: email único por organização
  CONSTRAINT client_users_email_org_unique UNIQUE (email, organization_id)
);

-- 3. Criar índices
CREATE INDEX idx_client_users_client_id ON client_users(client_id);
CREATE INDEX idx_client_users_organization_id ON client_users(organization_id);
CREATE INDEX idx_client_users_role ON client_users(role);
CREATE INDEX idx_client_users_is_active ON client_users(is_active);
CREATE INDEX idx_client_users_email ON client_users(email);

-- 4. Adicionar comentários
COMMENT ON TABLE client_users IS 'Usuários das empresas clientes B2B';
COMMENT ON COLUMN client_users.organization_id IS 'Tenant - para multi-tenancy';
COMMENT ON COLUMN client_users.client_id IS 'Empresa cliente à qual pertence';
COMMENT ON COLUMN client_users.role IS 'client-admin pode criar users, client-manager aprova, client-user apenas usa';
COMMENT ON COLUMN client_users.position IS 'Cargo na empresa cliente';
COMMENT ON COLUMN client_users.department_name IS 'Departamento dentro da empresa cliente';
COMMENT ON COLUMN client_users.location IS 'building, floor, room, site para multi-site';

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_client_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_client_users_updated_at
  BEFORE UPDATE ON client_users
  FOR EACH ROW
  EXECUTE FUNCTION update_client_users_updated_at();

COMMIT;
