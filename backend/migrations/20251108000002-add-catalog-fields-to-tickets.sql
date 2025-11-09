-- Migração: Adicionar campos do catálogo ao tickets
-- Data: 2025-11-08
-- Descrição: Adiciona catalogCategoryId e catalogItemId para vincular tickets à hierarquia do catálogo

-- Adicionar campo catalogCategoryId
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS catalog_category_id UUID REFERENCES catalog_categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN tickets.catalog_category_id IS 'Categoria do catálogo (hierarquia visual: TI, RH, Facilities)';

-- Adicionar campo catalogItemId
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL;

COMMENT ON COLUMN tickets.catalog_item_id IS 'Item/Serviço do catálogo selecionado';

-- Atualizar comment do categoryId para indicar que é legado
COMMENT ON COLUMN tickets.category_id IS 'LEGADO - Categoria funcional do ticket (manter por compatibilidade)';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_catalog_category_id ON tickets(catalog_category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_catalog_item_id ON tickets(catalog_item_id);

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Campos do catálogo adicionados à tabela tickets com sucesso!';
  RAISE NOTICE '   - catalog_category_id: Categoria do catálogo';
  RAISE NOTICE '   - catalog_item_id: Item/Serviço do catálogo';
END $$;
