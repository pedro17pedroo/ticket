-- ============================================================================
-- DEPLOY DE MIGRAÇÕES PARA PRODUÇÃO
-- Data: 2026-02-28
-- Descrição: Adiciona tabelas e campos do sistema SaaS multi-nível
-- ============================================================================

-- Iniciar transação
BEGIN;

-- ============================================================================
-- MIGRAÇÃO 1: Criar tabela clients
-- ============================================================================
\echo '📝 Criando tabela clients...'

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  tax_id VARCHAR(50),
  industry_type VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(255),
  address JSONB DEFAULT '{}'::jsonb,
  contract JSONB DEFAULT '{"status": "active", "slaLevel": "standard", "supportHours": "business-hours", "maxUsers": 10, "maxTicketsPerMonth": 100}'::jsonb,
  billing JSONB DEFAULT '{"currency": "EUR", "billingCycle": "monthly", "paymentMethod": "bank-transfer"}'::jsonb,
  primary_contact JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{"allowUserRegistration": false, "requireApproval": true, "autoAssignTickets": false, "notificationPreferences": {"email": true, "sms": false}}'::jsonb,
  stats JSONB DEFAULT '{"totalUsers": 0, "activeUsers": 0, "totalTickets": 0, "openTickets": 0}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_tax_id ON clients(tax_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_name_org ON clients(name, organization_id);

\echo '✅ Tabela clients criada'

-- ============================================================================
-- MIGRAÇÃO 2: Criar ENUM e tabela client_users
-- ============================================================================
\echo '📝 Criando tabela client_users...'

DO $$ BEGIN
  CREATE TYPE client_user_role AS ENUM ('client-admin', 'client-manager', 'client-user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role client_user_role NOT NULL DEFAULT 'client-user',
  avatar VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  department_name VARCHAR(100),
  direction_id UUID REFERENCES directions(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  location JSONB DEFAULT '{}'::jsonb,
  permissions JSONB DEFAULT '{"canCreateTickets": true, "canViewAllClientTickets": false, "canApproveRequests": false, "canAccessKnowledgeBase": true, "canRequestServices": true}'::jsonb,
  settings JSONB DEFAULT '{"notifications": true, "emailNotifications": true, "theme": "light", "language": "pt", "autoWatchTickets": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT client_users_email_org_unique UNIQUE (email, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_organization_id ON client_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_users_role ON client_users(role);
CREATE INDEX IF NOT EXISTS idx_client_users_is_active ON client_users(is_active);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_direction_id ON client_users(direction_id);
CREATE INDEX IF NOT EXISTS idx_client_users_department_id ON client_users(department_id);
CREATE INDEX IF NOT EXISTS idx_client_users_section_id ON client_users(section_id);

\echo '✅ Tabela client_users criada'

-- ============================================================================
-- MIGRAÇÃO 3: Criar tabelas de controle de acesso ao catálogo
-- ============================================================================
\echo '📝 Criando tabelas de controle de acesso ao catálogo...'

CREATE TABLE IF NOT EXISTS client_catalog_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  access_mode VARCHAR(20) NOT NULL DEFAULT 'all',
  allowed_categories UUID[],
  allowed_items UUID[],
  denied_categories UUID[],
  denied_items UUID[],
  modified_by UUID REFERENCES organization_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_catalog_access_organization_id ON client_catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_catalog_access_client_id ON client_catalog_access(client_id);

CREATE TABLE IF NOT EXISTS client_user_catalog_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  inheritance_mode VARCHAR(20) NOT NULL DEFAULT 'inherit',
  access_mode VARCHAR(20),
  allowed_categories UUID[],
  allowed_items UUID[],
  denied_categories UUID[],
  denied_items UUID[],
  modified_by UUID REFERENCES organization_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_organization_id ON client_user_catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_client_id ON client_user_catalog_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_client_user_id ON client_user_catalog_access(client_user_id);

\echo '✅ Tabelas de controle de acesso criadas'

-- ============================================================================
-- MIGRAÇÃO 4: Adicionar campos faltantes (se tabelas já existirem)
-- ============================================================================
\echo '📝 Verificando e adicionando campos faltantes...'

-- Adicionar campos à client_users se não existirem
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_users') THEN
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES directions(id) ON DELETE SET NULL;
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
    ALTER TABLE client_users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
    
    CREATE INDEX IF NOT EXISTS idx_client_users_direction_id ON client_users(direction_id);
    CREATE INDEX IF NOT EXISTS idx_client_users_department_id ON client_users(department_id);
    CREATE INDEX IF NOT EXISTS idx_client_users_section_id ON client_users(section_id);
  END IF;
END $$;

\echo '✅ Campos adicionados'

-- ============================================================================
-- MIGRAÇÃO 5: Criar tabelas de contexto (se não existirem)
-- ============================================================================
\echo '📝 Criando tabelas de contexto...'

CREATE TABLE IF NOT EXISTS context_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  context_id UUID NOT NULL,
  context_type VARCHAR(50) NOT NULL,
  session_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS context_sessions_session_token_idx ON context_sessions(session_token);
CREATE INDEX IF NOT EXISTS context_sessions_user_id_idx ON context_sessions(user_id);
CREATE INDEX IF NOT EXISTS context_sessions_is_active_idx ON context_sessions(is_active);
CREATE INDEX IF NOT EXISTS context_sessions_expires_at_idx ON context_sessions(expires_at);

CREATE TABLE IF NOT EXISTS context_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  from_context_id UUID,
  from_context_type VARCHAR(50),
  to_context_id UUID NOT NULL,
  to_context_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS context_audit_logs_user_id_idx ON context_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS context_audit_logs_user_email_idx ON context_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS context_audit_logs_action_idx ON context_audit_logs(action);
CREATE INDEX IF NOT EXISTS context_audit_logs_created_at_idx ON context_audit_logs(created_at);

\echo '✅ Tabelas de contexto criadas'

-- ============================================================================
-- COMMIT - Se tudo correu bem
-- ============================================================================
\echo '✅ Todas as migrações aplicadas com sucesso!'
\echo '📊 Verificando tabelas criadas...'

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'client_users', 'client_catalog_access', 'client_user_catalog_access', 'context_sessions', 'context_audit_logs')
ORDER BY table_name;

COMMIT;

\echo '✅ DEPLOY CONCLUÍDO COM SUCESSO!'
