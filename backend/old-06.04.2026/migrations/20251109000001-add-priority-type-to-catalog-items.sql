-- Migração: Adicionar priorityId e typeId ao catalog_items
-- Data: 2025-11-09
-- Descrição: Permite que itens do catálogo referenciem Prioridades e Tipos configuráveis por organização

-- Adicionar campo priorityId
ALTER TABLE catalog_items
ADD COLUMN IF NOT EXISTS priority_id UUID REFERENCES priorities(id) ON DELETE SET NULL;

COMMENT ON COLUMN catalog_items.priority_id IS 'Prioridade padrão configurável pela organização';

-- Adicionar campo typeId
ALTER TABLE catalog_items
ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES types(id) ON DELETE SET NULL;

COMMENT ON COLUMN catalog_items.type_id IS 'Tipo de ticket configurável pela organização';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_catalog_items_priority_id ON catalog_items(priority_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_type_id ON catalog_items(type_id);

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Campos configuráveis adicionados ao catalog_items!';
  RAISE NOTICE '   - priority_id: Prioridade configurável';
  RAISE NOTICE '   - type_id: Tipo configurável';
  RAISE NOTICE '   - sla_id: Já existia (SLA configurável)';
END $$;
