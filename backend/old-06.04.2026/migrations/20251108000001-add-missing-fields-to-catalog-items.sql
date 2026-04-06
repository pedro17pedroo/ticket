-- Migração: Adicionar campos faltantes ao catalog_items
-- Data: 2025-11-08
-- Descrição: Adiciona campos de SLA, categoria, aprovador e departamento ao modelo CatalogItem

-- Adicionar campo slaId
ALTER TABLE catalog_items 
ADD COLUMN IF NOT EXISTS sla_id UUID REFERENCES slas(id) ON DELETE SET NULL;

COMMENT ON COLUMN catalog_items.sla_id IS 'SLA padrão para tickets criados a partir deste item';

-- Adicionar campo defaultTicketCategoryId
ALTER TABLE catalog_items 
ADD COLUMN IF NOT EXISTS default_ticket_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN catalog_items.default_ticket_category_id IS 'Categoria padrão para o ticket criado';

-- Adicionar campo defaultApproverId
ALTER TABLE catalog_items 
ADD COLUMN IF NOT EXISTS default_approver_id UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN catalog_items.default_approver_id IS 'Usuário responsável pela aprovação';

-- Adicionar campo assignedDepartmentId
ALTER TABLE catalog_items 
ADD COLUMN IF NOT EXISTS assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

COMMENT ON COLUMN catalog_items.assigned_department_id IS 'Departamento para atribuição automática';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_catalog_items_sla_id ON catalog_items(sla_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_default_ticket_category_id ON catalog_items(default_ticket_category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_default_approver_id ON catalog_items(default_approver_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_assigned_department_id ON catalog_items(assigned_department_id);

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Campos adicionados à tabela catalog_items com sucesso!';
END $$;
