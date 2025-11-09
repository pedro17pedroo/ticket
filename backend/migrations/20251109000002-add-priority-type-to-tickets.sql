-- Migração: Adicionar priorityId e typeId à tabela tickets
-- Data: 2025-11-09
-- Descrição: Permite que tickets referenciem Prioridades e Tipos configuráveis por organização

-- Adicionar campo priorityId
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS priority_id UUID REFERENCES priorities(id) ON DELETE SET NULL;

COMMENT ON COLUMN tickets.priority_id IS 'Referência à prioridade configurável da organização';

-- Adicionar campo typeId
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES types(id) ON DELETE SET NULL;

COMMENT ON COLUMN tickets.type_id IS 'Referência ao tipo configurável da organização';

-- Atualizar comment do campo priority
COMMENT ON COLUMN tickets.priority IS 'Prioridade definida pelo cliente (string legada)';

-- Atualizar comment do campo type
COMMENT ON COLUMN tickets.type IS 'Nome do tipo (string legada)';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_priority_id ON tickets(priority_id);
CREATE INDEX IF NOT EXISTS idx_tickets_type_id ON tickets(type_id);

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Campos configuráveis adicionados à tabela tickets!';
  RAISE NOTICE '   - priority_id: Prioridade configurável';
  RAISE NOTICE '   - type_id: Tipo configurável';
  RAISE NOTICE '   Nota: Campos legados priority e type mantidos por compatibilidade';
END $$;
