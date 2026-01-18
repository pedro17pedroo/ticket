-- Script para criar tabelas críticas faltantes
-- Data: 2026-01-16

-- ============================================================================
-- CLIENT_USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'client-user' CHECK (role IN ('client-admin', 'client-manager', 'client-user')),
  position VARCHAR(100),
  department_name VARCHAR(100),
  phone VARCHAR(50),
  location JSONB,
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, client_id, email)
);

CREATE INDEX IF NOT EXISTS idx_client_users_organization_id ON client_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_is_active ON client_users(is_active);

COMMENT ON TABLE client_users IS 'Usuários das empresas clientes (B2B2C)';

-- ============================================================================
-- CATALOG_CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'FolderOpen',
  color VARCHAR(20) DEFAULT '#3B82F6',
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_organization_id ON catalog_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_is_active ON catalog_categories(is_active);

COMMENT ON TABLE catalog_categories IS 'Categorias do catálogo de serviços';

-- ============================================================================
-- CATALOG_ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES catalog_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  short_description VARCHAR(255),
  full_description TEXT,
  icon VARCHAR(50) DEFAULT 'Box',
  color VARCHAR(20) DEFAULT '#3B82F6',
  sla_id UUID REFERENCES slas(id) ON DELETE SET NULL,
  priority_id UUID REFERENCES priorities(id) ON DELETE SET NULL,
  type_id UUID REFERENCES types(id) ON DELETE SET NULL,
  default_ticket_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  requires_approval BOOLEAN DEFAULT false,
  default_approver_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  estimated_cost DECIMAL(10, 2),
  cost_currency VARCHAR(3) DEFAULT 'EUR',
  estimated_delivery_time INTEGER,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  request_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_organization_id ON catalog_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category_id ON catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_sla_id ON catalog_items(sla_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_is_active ON catalog_items(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_items_is_public ON catalog_items(is_public);

COMMENT ON TABLE catalog_items IS 'Itens/Serviços do catálogo';

-- ============================================================================
-- KNOWLEDGE_BASE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[],
  author_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  visibility VARCHAR(50) DEFAULT 'internal' CHECK (visibility IN ('internal', 'public', 'client')),
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_organization_id ON knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category_id ON knowledge_base(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON knowledge_base(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_visibility ON knowledge_base(visibility);

COMMENT ON TABLE knowledge_base IS 'Base de conhecimento para artigos e documentação';

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  methodology VARCHAR(50) DEFAULT 'agile' CHECK (methodology IN ('waterfall', 'agile', 'scrum', 'kanban', 'hybrid')),
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  end_date DATE,
  actual_end_date DATE,
  budget DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  created_by UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);

COMMENT ON TABLE projects IS 'Projetos de gestão';

-- ============================================================================
-- PROJECT_TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  estimated_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_organization_id ON project_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);

COMMENT ON TABLE project_tasks IS 'Tarefas dos projetos';

-- ============================================================================
-- PROJECT_REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('project_charter', 'project_closure', 'status_report', 'schedule_report', 'task_report', 'stakeholder_report', 'executive_summary')),
  format VARCHAR(10) NOT NULL CHECK (format IN ('pdf', 'excel')),
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  options JSONB DEFAULT '{}'::jsonb,
  generated_by UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_reports_organization_id ON project_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_project_id ON project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_type ON project_reports(type);

COMMENT ON TABLE project_reports IS 'Relatórios gerados dos projetos';

-- ============================================================================
-- CLIENT_CATALOG_ACCESS TABLE
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

CREATE INDEX IF NOT EXISTS idx_client_catalog_access_organization_id ON client_catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_catalog_access_client_id ON client_catalog_access(client_id);

COMMENT ON TABLE client_catalog_access IS 'Controle de acesso ao catálogo por cliente';

-- ============================================================================
-- CLIENT_USER_CATALOG_ACCESS TABLE
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

CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_organization_id ON client_user_catalog_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_client_id ON client_user_catalog_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_user_catalog_access_client_user_id ON client_user_catalog_access(client_user_id);

COMMENT ON TABLE client_user_catalog_access IS 'Controle de acesso ao catálogo por usuário cliente';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'client_users', 'catalog_categories', 'catalog_items',
      'knowledge_base', 'projects', 'project_tasks', 'project_reports',
      'client_catalog_access', 'client_user_catalog_access'
    );
  
  RAISE NOTICE '✅ Tabelas críticas criadas: %/9', table_count;
END $$;
