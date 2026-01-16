-- =====================================================
-- MIGRAÇÃO: Unificação de Categorias
-- Data: 2026-01-08
-- Descrição: Migrar de 'categories' para 'catalog_categories'
-- =====================================================

-- 1. Criar tabela temporária de mapeamento
CREATE TEMP TABLE category_mapping (
    old_id UUID,
    new_id UUID,
    name VARCHAR(255)
);

-- 2. Para cada categoria em 'categories', encontrar ou criar em 'catalog_categories'
-- Primeiro, inserir categorias que não existem (por nome)
INSERT INTO catalog_categories (id, organization_id, name, description, icon, color, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    c.organization_id,
    c.name,
    c.description,
    COALESCE(c.icon, 'folder'),
    COALESCE(c.color, '#6366f1'),
    c.is_active,
    c.created_at,
    c.updated_at
FROM categories c
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_categories cc 
    WHERE cc.name = c.name AND cc.organization_id = c.organization_id
);

-- 3. Criar mapeamento (categoria antiga -> categoria nova com mesmo nome na mesma org)
INSERT INTO category_mapping (old_id, new_id, name)
SELECT DISTINCT ON (c.id)
    c.id as old_id,
    cc.id as new_id,
    c.name
FROM categories c
JOIN catalog_categories cc ON cc.name = c.name AND cc.organization_id = c.organization_id;

-- 4. Verificar mapeamento
SELECT 'Mapeamento criado:' as info, COUNT(*) as total FROM category_mapping;

-- 5. Atualizar tickets - migrar category_id para catalog_category_id
UPDATE tickets t
SET catalog_category_id = cm.new_id
FROM category_mapping cm
WHERE t.category_id = cm.old_id
AND t.catalog_category_id IS NULL;

SELECT 'Tickets atualizados:' as info, COUNT(*) as total 
FROM tickets WHERE catalog_category_id IS NOT NULL;

-- 6. Adicionar coluna catalog_category_id em knowledge_articles se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_articles' AND column_name = 'catalog_category_id'
    ) THEN
        ALTER TABLE knowledge_articles ADD COLUMN catalog_category_id UUID;
        ALTER TABLE knowledge_articles 
            ADD CONSTRAINT fk_knowledge_articles_catalog_category 
            FOREIGN KEY (catalog_category_id) REFERENCES catalog_categories(id);
    END IF;
END $$;

-- 7. Migrar knowledge_articles
UPDATE knowledge_articles ka
SET catalog_category_id = cm.new_id
FROM category_mapping cm
WHERE ka.category_id = cm.old_id;

SELECT 'Artigos atualizados:' as info, COUNT(*) as total 
FROM knowledge_articles WHERE catalog_category_id IS NOT NULL;

-- 8. Adicionar coluna catalog_category_id em ticket_templates se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ticket_templates' AND column_name = 'catalog_category_id'
    ) THEN
        ALTER TABLE ticket_templates ADD COLUMN catalog_category_id UUID;
        ALTER TABLE ticket_templates 
            ADD CONSTRAINT fk_ticket_templates_catalog_category 
            FOREIGN KEY (catalog_category_id) REFERENCES catalog_categories(id);
    END IF;
END $$;

-- 9. Migrar ticket_templates
UPDATE ticket_templates tt
SET catalog_category_id = cm.new_id
FROM category_mapping cm
WHERE tt.category_id = cm.old_id;

-- 10. Verificar se response_templates tem category_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'response_templates' AND column_name = 'category_id'
    ) THEN
        -- Adicionar catalog_category_id se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'response_templates' AND column_name = 'catalog_category_id'
        ) THEN
            ALTER TABLE response_templates ADD COLUMN catalog_category_id UUID;
            ALTER TABLE response_templates 
                ADD CONSTRAINT fk_response_templates_catalog_category 
                FOREIGN KEY (catalog_category_id) REFERENCES catalog_categories(id);
        END IF;
        
        -- Migrar dados
        UPDATE response_templates rt
        SET catalog_category_id = cm.new_id
        FROM category_mapping cm
        WHERE rt.category_id = cm.old_id;
    END IF;
END $$;

-- 11. Remover foreign keys antigas
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS fk_tickets_category;
ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_category_id_fkey;
ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS fk_knowledge_articles_category;
ALTER TABLE ticket_templates DROP CONSTRAINT IF EXISTS ticket_templates_category_id_fkey;
ALTER TABLE ticket_templates DROP CONSTRAINT IF EXISTS fk_ticket_templates_category;

-- 12. Remover colunas category_id antigas
ALTER TABLE tickets DROP COLUMN IF EXISTS category_id;
ALTER TABLE knowledge_articles DROP COLUMN IF EXISTS category_id;
ALTER TABLE ticket_templates DROP COLUMN IF EXISTS category_id;
ALTER TABLE ticket_templates DROP COLUMN IF EXISTS category;

-- 13. Verificar se response_templates tem category_id e remover
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'response_templates' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE response_templates DROP CONSTRAINT IF EXISTS response_templates_category_id_fkey;
        ALTER TABLE response_templates DROP CONSTRAINT IF EXISTS fk_response_templates_category;
        ALTER TABLE response_templates DROP COLUMN category_id;
    END IF;
END $$;

-- 14. Remover tabelas legadas
DROP TABLE IF EXISTS knowledge_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 15. Verificação final
SELECT 'Migração concluída!' as status;
SELECT 'Categorias em catalog_categories:' as info, COUNT(*) as total FROM catalog_categories;
SELECT 'Tickets com catalog_category_id:' as info, COUNT(*) as total FROM tickets WHERE catalog_category_id IS NOT NULL;
SELECT 'Artigos com catalog_category_id:' as info, COUNT(*) as total FROM knowledge_articles WHERE catalog_category_id IS NOT NULL;
