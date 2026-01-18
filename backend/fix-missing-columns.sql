-- Fix Missing Columns in Database
-- Date: 2026-01-17
-- Description: Adds all missing columns referenced in the code

BEGIN;

-- ============================================================================
-- 1. CLIENT_USERS TABLE - Add hierarchical fields
-- ============================================================================
DO $$ 
BEGIN
    -- Add direction_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_users' AND column_name = 'direction_id'
    ) THEN
        ALTER TABLE client_users 
        ADD COLUMN direction_id UUID REFERENCES directions(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_client_users_direction_id ON client_users(direction_id);
        
        COMMENT ON COLUMN client_users.direction_id IS 'Direção do utilizador cliente';
    END IF;

    -- Add department_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_users' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE client_users 
        ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_client_users_department_id ON client_users(department_id);
        
        COMMENT ON COLUMN client_users.department_id IS 'Departamento do utilizador cliente';
    END IF;

    -- Add section_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_users' AND column_name = 'section_id'
    ) THEN
        ALTER TABLE client_users 
        ADD COLUMN section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_client_users_section_id ON client_users(section_id);
        
        COMMENT ON COLUMN client_users.section_id IS 'Secção do utilizador cliente';
    END IF;
END $$;

-- ============================================================================
-- 2. CATALOG_CATEGORIES TABLE - Add hierarchical and routing fields
-- ============================================================================
DO $$ 
BEGIN
    -- Add parent_category_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_categories' AND column_name = 'parent_category_id'
    ) THEN
        ALTER TABLE catalog_categories 
        ADD COLUMN parent_category_id UUID REFERENCES catalog_categories(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent ON catalog_categories(parent_category_id);
        
        COMMENT ON COLUMN catalog_categories.parent_category_id IS 'ID da categoria pai (para subcategorias)';
    END IF;

    -- Add level if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_categories' AND column_name = 'level'
    ) THEN
        ALTER TABLE catalog_categories 
        ADD COLUMN level INTEGER DEFAULT 1;
        
        COMMENT ON COLUMN catalog_categories.level IS 'Nível hierárquico (1=raiz, 2=subcategoria, etc)';
    END IF;

    -- Add image_url if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_categories' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE catalog_categories 
        ADD COLUMN image_url VARCHAR(500);
        
        COMMENT ON COLUMN catalog_categories.image_url IS 'URL da imagem/logo da categoria';
    END IF;

    -- Add default_direction_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_categories' AND column_name = 'default_direction_id'
    ) THEN
        ALTER TABLE catalog_categories 
        ADD COLUMN default_direction_id UUID REFERENCES directions(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_catalog_categories_direction ON catalog_categories(default_direction_id);
        
        COMMENT ON COLUMN catalog_categories.default_direction_id IS 'Direção padrão para esta categoria';
    END IF;

    -- Add default_department_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_categories' AND column_name = 'default_department_id'
    ) THEN
        ALTER TABLE catalog_categories 
        ADD COLUMN default_department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_catalog_categories_department ON catalog_categories(default_department_id);
        
        COMMENT ON COLUMN catalog_categories.default_department_id IS 'Departamento padrão para esta categoria';
    END IF;

    -- Add default_section_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_categories' AND column_name = 'default_section_id'
    ) THEN
        ALTER TABLE catalog_categories 
        ADD COLUMN default_section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_catalog_categories_section ON catalog_categories(default_section_id);
        
        COMMENT ON COLUMN catalog_categories.default_section_id IS 'Secção padrão para esta categoria';
    END IF;
END $$;

-- ============================================================================
-- 3. CATALOG_ITEMS TABLE - Add all missing fields
-- ============================================================================
DO $$ 
BEGIN
    -- Add image_url if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE catalog_items 
        ADD COLUMN image_url VARCHAR(500);
        
        COMMENT ON COLUMN catalog_items.image_url IS 'URL da imagem/logo do item';
    END IF;

    -- Add item_type if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'item_type'
    ) THEN
        -- Create enum type first
        DO $enum$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'catalog_item_type') THEN
                CREATE TYPE catalog_item_type AS ENUM ('incident', 'service', 'support', 'request');
            END IF;
        END $enum$;
        
        ALTER TABLE catalog_items 
        ADD COLUMN item_type catalog_item_type DEFAULT 'service' NOT NULL;
        
        COMMENT ON COLUMN catalog_items.item_type IS 'incident=Incidente, service=Serviço, support=Suporte, request=Requisição';
    END IF;

    -- Add default_priority if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'default_priority'
    ) THEN
        -- Create enum type first
        DO $enum$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'catalog_item_priority') THEN
                CREATE TYPE catalog_item_priority AS ENUM ('baixa', 'media', 'alta', 'critica');
            END IF;
        END $enum$;
        
        ALTER TABLE catalog_items 
        ADD COLUMN default_priority catalog_item_priority DEFAULT 'media';
        
        COMMENT ON COLUMN catalog_items.default_priority IS 'LEGADO - usar priorityId';
    END IF;

    -- Add auto_assign_priority if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'auto_assign_priority'
    ) THEN
        ALTER TABLE catalog_items 
        ADD COLUMN auto_assign_priority BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN catalog_items.auto_assign_priority IS 'Se true, incidentes recebem prioridade alta/crítica automaticamente';
    END IF;

    -- Add skip_approval_for_incidents if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'skip_approval_for_incidents'
    ) THEN
        ALTER TABLE catalog_items 
        ADD COLUMN skip_approval_for_incidents BOOLEAN DEFAULT true;
        
        COMMENT ON COLUMN catalog_items.skip_approval_for_incidents IS 'Incidentes pulam aprovação automática';
    END IF;

    -- Add default_direction_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'default_direction_id'
    ) THEN
        ALTER TABLE catalog_items 
        ADD COLUMN default_direction_id UUID REFERENCES directions(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_catalog_items_direction ON catalog_items(default_direction_id);
        
        COMMENT ON COLUMN catalog_items.default_direction_id IS 'Direção responsável pelo item/serviço';
    END IF;

    -- Add default_department_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'default_department_id'
    ) THEN
        ALTER TABLE catalog_items 
        ADD COLUMN default_department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_catalog_items_department ON catalog_items(default_department_id);
        
        COMMENT ON COLUMN catalog_items.default_department_id IS 'Departamento responsável pelo item/serviço';
    END IF;

    -- Add default_section_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'default_section_id'
    ) THEN
        ALTER TABLE catalog_items 
        ADD COLUMN default_section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_catalog_items_section ON catalog_items(default_section_id);
        
        COMMENT ON COLUMN catalog_items.default_section_id IS 'Secção responsável pelo item/serviço';
    END IF;

    -- Add incident_workflow_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'incident_workflow_id'
    ) THEN
        ALTER TABLE catalog_items 
        ADD COLUMN incident_workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_catalog_items_workflow ON catalog_items(incident_workflow_id);
        
        COMMENT ON COLUMN catalog_items.incident_workflow_id IS 'Workflow específico quando itemType é incident';
    END IF;

    -- Add keywords if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_items' AND column_name = 'keywords'
    ) THEN
        ALTER TABLE catalog_items 
        ADD COLUMN keywords TEXT[] DEFAULT '{}';
        
        CREATE INDEX IF NOT EXISTS idx_catalog_items_keywords ON catalog_items USING GIN(keywords);
        
        COMMENT ON COLUMN catalog_items.keywords IS 'Palavras-chave para busca e categorização';
    END IF;
END $$;

-- ============================================================================
-- 4. PROJECTS TABLE - Add archived_at if not exists
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE projects 
        ADD COLUMN archived_at TIMESTAMP;
        
        CREATE INDEX IF NOT EXISTS idx_projects_archived_at ON projects(archived_at);
        
        COMMENT ON COLUMN projects.archived_at IS 'Data de arquivamento do projeto (soft delete)';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Uncomment to verify the changes:

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'client_users' 
-- AND column_name IN ('direction_id', 'department_id', 'section_id')
-- ORDER BY column_name;

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'catalog_categories' 
-- AND column_name IN ('parent_category_id', 'level', 'image_url', 'default_direction_id', 'default_department_id', 'default_section_id')
-- ORDER BY column_name;

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'catalog_items' 
-- AND column_name IN ('image_url', 'item_type', 'default_priority', 'auto_assign_priority', 'skip_approval_for_incidents', 'default_direction_id', 'default_department_id', 'default_section_id', 'incident_workflow_id', 'keywords')
-- ORDER BY column_name;

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'projects' 
-- AND column_name = 'archived_at';
