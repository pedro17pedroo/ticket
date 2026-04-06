-- Migration: Unificar service_requests em tickets
-- Data: 2026-01-16
-- Descrição: Remove a tabela service_requests e consolida tudo em tickets

-- PASSO 1: Verificar se todos os service_requests têm ticket associado
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM service_requests
  WHERE ticket_id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Existem % service_requests sem ticket associado. Migração abortada.', orphan_count;
  END IF;
  
  RAISE NOTICE 'Verificação OK: Todos os service_requests têm ticket associado';
END $$;

-- PASSO 2: Adicionar campos à tabela tickets para armazenar dados do service_request
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS request_form_data JSONB,
ADD COLUMN IF NOT EXISTS request_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES organization_users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_comments TEXT,
ADD COLUMN IF NOT EXISTS approved_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- PASSO 3: Migrar dados de service_requests para tickets
UPDATE tickets t
SET 
  request_form_data = sr.form_data,
  request_status = sr.status,
  approver_id = sr.approver_id,
  approval_date = sr.approval_date,
  approval_comments = sr.approval_comments,
  approved_cost = sr.approved_cost,
  rejection_reason = sr.rejection_reason
FROM service_requests sr
WHERE t.id = sr.ticket_id
  AND sr.ticket_id IS NOT NULL;

-- PASSO 4: Verificar migração
DO $$
DECLARE
  migrated_count INTEGER;
  total_requests INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_requests FROM service_requests;
  SELECT COUNT(*) INTO migrated_count 
  FROM tickets 
  WHERE request_form_data IS NOT NULL;
  
  RAISE NOTICE 'Total de service_requests: %', total_requests;
  RAISE NOTICE 'Tickets com dados migrados: %', migrated_count;
  
  IF migrated_count != total_requests THEN
    RAISE WARNING 'Atenção: Nem todos os dados foram migrados!';
  ELSE
    RAISE NOTICE 'Migração completa: Todos os dados foram transferidos';
  END IF;
END $$;

-- PASSO 5: Criar backup da tabela service_requests (opcional, comentado por padrão)
-- CREATE TABLE service_requests_backup AS SELECT * FROM service_requests;
-- COMMENT ON TABLE service_requests_backup IS 'Backup da tabela service_requests antes da remoção';

-- PASSO 6: Remover a tabela service_requests
DROP TABLE IF EXISTS service_requests CASCADE;

-- PASSO 7: Adicionar comentários
COMMENT ON COLUMN tickets.request_form_data IS 'Dados do formulário da solicitação de serviço (migrado de service_requests)';
COMMENT ON COLUMN tickets.request_status IS 'Status da solicitação de serviço (migrado de service_requests)';
COMMENT ON COLUMN tickets.approver_id IS 'ID do aprovador da solicitação (migrado de service_requests)';
COMMENT ON COLUMN tickets.approval_date IS 'Data de aprovação da solicitação (migrado de service_requests)';
COMMENT ON COLUMN tickets.approval_comments IS 'Comentários da aprovação (migrado de service_requests)';
COMMENT ON COLUMN tickets.approved_cost IS 'Custo aprovado da solicitação (migrado de service_requests)';
COMMENT ON COLUMN tickets.rejection_reason IS 'Motivo da rejeição da solicitação (migrado de service_requests)';

-- PASSO 8: Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_tickets_request_status ON tickets(request_status) WHERE request_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_approver ON tickets(approver_id) WHERE approver_id IS NOT NULL;

-- PASSO 9: Log final
DO $$
BEGIN
  RAISE NOTICE '✅ Migração concluída com sucesso!';
  RAISE NOTICE '📊 Tabela service_requests removida';
  RAISE NOTICE '🎫 Todos os dados consolidados em tickets';
END $$;
