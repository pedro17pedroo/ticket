-- ============================================================================
-- FIX: Adicionar colunas faltantes identificadas nos erros
-- Data: 2026-01-18
-- ============================================================================

-- 1. CLIENT_USERS: Adicionar campos organizacionais
ALTER TABLE client_users 
ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES directions(id),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id);

CREATE INDEX IF NOT EXISTS idx_client_users_direction ON client_users(direction_id);
CREATE INDEX IF NOT EXISTS idx_client_users_department ON client_users(department_id);
CREATE INDEX IF NOT EXISTS idx_client_users_section ON client_users(section_id);

COMMENT ON COLUMN client_users.direction_id IS 'Direção à qual o usuário cliente pertence';
COMMENT ON COLUMN client_users.department_id IS 'Departamento ao qual o usuário cliente pertence';
COMMENT ON COLUMN client_users.section_id IS 'Seção à qual o usuário cliente pertence';

-- 2. CATALOG_CATEGORIES: Adicionar campos de hierarquia e roteamento
ALTER TABLE catalog_categories
ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES catalog_categories(id),
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS default_direction_id UUID REFERENCES directions(id),
ADD COLUMN IF NOT EXISTS default_department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS default_section_id UUID REFERENCES sections(id);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent ON catalog_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_direction ON catalog_categories(default_direction_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_department ON catalog_categories(default_department_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_section ON catalog_categories(default_section_id);

COMMENT ON COLUMN catalog_categories.parent_category_id IS 'ID da categoria pai (para subcategorias)';
COMMENT ON COLUMN catalog_categories.level IS 'Nível hierárquico (1=raiz, 2=subcategoria, etc)';
COMMENT ON COLUMN catalog_categories.image_url IS 'URL da imagem/logo da categoria';
COMMENT ON COLUMN catalog_categories.default_direction_id IS 'Direção padrão para itens desta categoria';
COMMENT ON COLUMN catalog_categories.default_department_id IS 'Departamento padrão para itens desta categoria';
COMMENT ON COLUMN catalog_categories.default_section_id IS 'Seção padrão para itens desta categoria';

-- 3. CATALOG_ITEMS: Adicionar campos de roteamento e configuração
ALTER TABLE catalog_items
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) DEFAULT 'service' CHECK (item_type IN ('incident', 'service', 'support', 'request')),
ADD COLUMN IF NOT EXISTS default_priority VARCHAR(20) DEFAULT 'media',
ADD COLUMN IF NOT EXISTS auto_assign_priority BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS skip_approval_for_incidents BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS default_direction_id UUID REFERENCES directions(id),
ADD COLUMN IF NOT EXISTS default_department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS default_section_id UUID REFERENCES sections(id),
ADD COLUMN IF NOT EXISTS incident_workflow_id INTEGER REFERENCES workflows(id),
ADD COLUMN IF NOT EXISTS keywords TEXT[];

CREATE INDEX IF NOT EXISTS idx_catalog_items_direction ON catalog_items(default_direction_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_department ON catalog_items(default_department_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_section ON catalog_items(default_section_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON catalog_items(item_type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_keywords ON catalog_items USING GIN(keywords);

COMMENT ON COLUMN catalog_items.image_url IS 'URL da imagem/logo do item';
COMMENT ON COLUMN catalog_items.item_type IS 'Tipo: incident=Incidente, service=Serviço, support=Suporte, request=Requisição';
COMMENT ON COLUMN catalog_items.default_priority IS 'Prioridade padrão (legado)';
COMMENT ON COLUMN catalog_items.auto_assign_priority IS 'Auto-definir prioridade baseado no tipo';
COMMENT ON COLUMN catalog_items.skip_approval_for_incidents IS 'Incidentes pulam aprovação automática';
COMMENT ON COLUMN catalog_items.default_direction_id IS 'Direção responsável pelo item/serviço';
COMMENT ON COLUMN catalog_items.default_department_id IS 'Departamento responsável pelo item/serviço';
COMMENT ON COLUMN catalog_items.default_section_id IS 'Seção responsável pelo item/serviço';
COMMENT ON COLUMN catalog_items.incident_workflow_id IS 'Workflow específico quando itemType é incident';
COMMENT ON COLUMN catalog_items.keywords IS 'Palavras-chave para busca e categorização';

-- 4. PROJECTS: Adicionar campo archived_at
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived_at);

COMMENT ON COLUMN projects.archived_at IS 'Data/hora em que o projeto foi arquivado';

-- Verificar se as colunas foram criadas
DO $$
BEGIN
    RAISE NOTICE '✅ Verificando colunas criadas...';
    
    -- Verificar client_users
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_users' AND column_name = 'direction_id') THEN
        RAISE NOTICE '✅ client_users.direction_id criada';
    END IF;
    
    -- Verificar catalog_categories
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_categories' AND column_name = 'parent_category_id') THEN
        RAISE NOTICE '✅ catalog_categories.parent_category_id criada';
    END IF;
    
    -- Verificar catalog_items
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'catalog_items' AND column_name = 'item_type') THEN
        RAISE NOTICE '✅ catalog_items.item_type criada';
    END IF;
    
    -- Verificar projects
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'archived_at') THEN
        RAISE NOTICE '✅ projects.archived_at criada';
    END IF;
    
    RAISE NOTICE '✅ Script de correção executado com sucesso!';
END $$;
