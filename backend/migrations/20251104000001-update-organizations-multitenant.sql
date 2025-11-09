-- Migration: Update Organizations para suportar Provider e Tenant
-- Data: 2025-11-04
-- Descrição: Adiciona campos para hierarquia Provider -> Tenant

BEGIN;

-- 1. Criar ENUM para tipo de organização
DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM ('provider', 'tenant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar novos campos
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS type organization_type NOT NULL DEFAULT 'tenant',
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS subscription JSONB DEFAULT '{
    "plan": "professional",
    "status": "active",
    "maxUsers": 50,
    "maxClients": 100,
    "maxStorageGB": 50,
    "features": ["sla", "automation", "reports"]
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS deployment JSONB DEFAULT '{
    "type": "saas",
    "region": "eu-west"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- 3. Atualizar settings para incluir novos campos padrão
UPDATE organizations
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      settings,
      '{requireApproval}',
      'false'
    ),
    '{sessionTimeout}',
    '480'
  ),
  '{twoFactorAuth}',
  'false'
)
WHERE settings IS NOT NULL;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_tax_id ON organizations(tax_id);

-- 5. Adicionar comentários
COMMENT ON COLUMN organizations.type IS 'Provider = TatuTicket, Tenant = Organizações clientes';
COMMENT ON COLUMN organizations.parent_id IS 'NULL para provider, ID do provider para tenants';
COMMENT ON COLUMN organizations.trade_name IS 'Nome fantasia da organização';
COMMENT ON COLUMN organizations.tax_id IS 'NIF/CNPJ da organização';
COMMENT ON COLUMN organizations.subscription IS 'Plano e limites para tenants';
COMMENT ON COLUMN organizations.deployment IS 'Configurações de deployment (SaaS ou On-Premise)';

-- 6. Criar organização Provider se não existir
INSERT INTO organizations (
  id,
  type,
  parent_id,
  name,
  trade_name,
  slug,
  email,
  phone,
  primary_color,
  secondary_color,
  subscription,
  deployment,
  settings,
  is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'provider',
  NULL,
  'TatuTicket',
  'TatuTicket Solutions',
  'tatuticket',
  'admin@tatuticket.com',
  '+351 210 000 000',
  '#3B82F6',
  '#10B981',
  '{
    "plan": "unlimited",
    "status": "active",
    "maxUsers": 999999,
    "maxClients": 999999,
    "maxStorageGB": 999999,
    "features": ["all"]
  }'::jsonb,
  '{
    "type": "saas",
    "region": "global"
  }'::jsonb,
  '{
    "language": "pt",
    "timezone": "Europe/Lisbon",
    "dateFormat": "DD/MM/YYYY",
    "allowSelfRegistration": false,
    "requireApproval": true,
    "sessionTimeout": 480,
    "twoFactorAuth": true
  }'::jsonb,
  true
) ON CONFLICT (id) DO NOTHING;

-- 7. Atualizar organizações existentes para serem tenants do provider
UPDATE organizations
SET 
  type = 'tenant',
  parent_id = 'a0000000-0000-0000-0000-000000000001'::uuid
WHERE type = 'tenant' AND parent_id IS NULL AND id != 'a0000000-0000-0000-0000-000000000001'::uuid;

COMMIT;
