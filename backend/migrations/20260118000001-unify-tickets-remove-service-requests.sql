-- Migration: Unify Tickets - Remove service_requests
-- Date: 2026-01-18
-- Author: Kiro AI
-- Description: Adiciona campos de service_requests em tickets e prepara para eliminação da tabela

BEGIN;

-- ============================================================================
-- PARTE 1: ADICIONAR NOVOS CAMPOS EM TICKETS
-- ============================================================================

-- Campos de Aprovação
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_comments TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES organization_users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES organization_users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Campos de Formulário e Estimativas
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS estimated_delivery_days INTEGER;

-- ============================================================================
-- PARTE 2: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tickets_approval_status ON tickets(approval_status);
CREATE INDEX IF NOT EXISTS idx_tickets_requires_approval ON tickets(requires_approval);
CREATE INDEX IF NOT EXISTS idx_tickets_approved_by ON tickets(approved_by);
CREATE INDEX IF NOT EXISTS idx_tickets_form_data ON tickets USING gin(form_data);

-- ============================================================================
-- PARTE 3: ADICIONAR COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN tickets.requires_approval IS 'Se o ticket requer aprovação antes de ser processado (tickets de catálogo)';
COMMENT ON COLUMN tickets.approval_status IS 'Status de aprovação: pending, approved, rejected';
COMMENT ON COLUMN tickets.approval_comments IS 'Comentários do aprovador';
COMMENT ON COLUMN tickets.approved_by IS 'Usuário da organização que aprovou';
COMMENT ON COLUMN tickets.approved_at IS 'Data/hora da aprovação';
COMMENT ON COLUMN tickets.rejected_by IS 'Usuário da organização que rejeitou';
COMMENT ON COLUMN tickets.rejected_at IS 'Data/hora da rejeição';
COMMENT ON COLUMN tickets.rejection_reason IS 'Motivo da rejeição';
COMMENT ON COLUMN tickets.form_data IS 'Dados do formulário do catálogo (JSONB)';
COMMENT ON COLUMN tickets.estimated_cost IS 'Custo estimado do serviço';
COMMENT ON COLUMN tickets.estimated_delivery_days IS 'Prazo estimado de entrega em dias';

-- ============================================================================
-- PARTE 4: MIGRAR DADOS DE service_requests (se existirem)
-- ============================================================================

-- Atualizar tickets existentes que têm service_request associado
UPDATE tickets t
SET 
  approval_status = CASE sr.status
    WHEN 'pending_approval' THEN 'pending'
    WHEN 'pending' THEN 'pending'
    WHEN 'approved' THEN 'approved'
    WHEN 'rejected' THEN 'rejected'
    ELSE NULL
  END,
  approval_comments = sr.notes,
  approved_by = sr.approved_by_id,
  approved_at = sr.approved_at,
  rejected_by = sr.rejected_by_id,
  rejected_at = sr.rejected_at,
  rejection_reason = sr.rejection_reason,
  form_data = COALESCE(sr.form_data, '{}'),
  requires_approval = true
FROM service_requests sr
WHERE t.id = sr.ticket_id
  AND sr.ticket_id IS NOT NULL;

-- Criar tickets para service_requests órfãos (sem ticket associado)
INSERT INTO tickets (
  organization_id,
  client_id,
  requester_type,
  requester_org_user_id,
  catalog_item_id,
  catalog_category_id,
  subject,
  description,
  status,
  priority,
  source,
  form_data,
  approval_status,
  approval_comments,
  approved_by,
  approved_at,
  rejected_by,
  rejected_at,
  rejection_reason,
  requires_approval,
  created_at,
  updated_at
)
SELECT 
  sr.organization_id,
  NULL, -- client_id será preenchido se necessário
  'organization', -- service_requests usa organization_users
  sr.user_id,
  sr.catalog_item_id,
  ci.category_id,
  COALESCE(ci.name, 'Solicitação de Serviço'),
  'Solicitação via catálogo de serviços',
  (CASE sr.status
    WHEN 'pending_approval' THEN 'aguardando_aprovacao'
    WHEN 'pending' THEN 'aguardando_aprovacao'
    WHEN 'approved' THEN 'novo'
    WHEN 'rejected' THEN 'rejeitado'
    WHEN 'in_progress' THEN 'em_progresso'
    WHEN 'completed' THEN 'fechado'
    WHEN 'cancelled' THEN 'cancelado'
    ELSE 'novo'
  END)::enum_tickets_status,
  'media',
  'portal',
  COALESCE(sr.form_data, '{}'),
  CASE sr.status
    WHEN 'pending_approval' THEN 'pending'
    WHEN 'pending' THEN 'pending'
    WHEN 'approved' THEN 'approved'
    WHEN 'rejected' THEN 'rejected'
    ELSE NULL
  END,
  sr.notes,
  sr.approved_by_id,
  sr.approved_at,
  sr.rejected_by_id,
  sr.rejected_at,
  sr.rejection_reason,
  true,
  sr.created_at,
  sr.updated_at
FROM service_requests sr
LEFT JOIN catalog_items ci ON sr.catalog_item_id = ci.id
WHERE sr.ticket_id IS NULL;

-- ============================================================================
-- PARTE 5: CRIAR BACKUP DA TABELA service_requests
-- ============================================================================

-- Criar tabela de backup antes de dropar
CREATE TABLE IF NOT EXISTS service_requests_backup AS 
SELECT * FROM service_requests;

COMMENT ON TABLE service_requests_backup IS 'Backup da tabela service_requests antes da unificação (2026-01-18)';

-- ============================================================================
-- PARTE 6: VALIDAÇÃO
-- ============================================================================

-- Contar registros migrados
DO $$
DECLARE
  sr_count INTEGER;
  sr_with_ticket INTEGER;
  sr_without_ticket INTEGER;
  tickets_migrated INTEGER;
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sr_count FROM service_requests;
  SELECT COUNT(*) INTO sr_with_ticket FROM service_requests WHERE ticket_id IS NOT NULL;
  SELECT COUNT(*) INTO sr_without_ticket FROM service_requests WHERE ticket_id IS NULL;
  SELECT COUNT(*) INTO tickets_migrated FROM tickets WHERE requires_approval = true;
  SELECT COUNT(*) INTO backup_count FROM service_requests_backup;
  
  RAISE NOTICE '=== VALIDAÇÃO DA MIGRAÇÃO ===';
  RAISE NOTICE 'Total service_requests: %', sr_count;
  RAISE NOTICE 'Com ticket: %', sr_with_ticket;
  RAISE NOTICE 'Sem ticket: %', sr_without_ticket;
  RAISE NOTICE 'Tickets migrados: %', tickets_migrated;
  RAISE NOTICE 'Backup criado: %', backup_count;
  RAISE NOTICE '============================';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK (se necessário)
-- ============================================================================

-- Para reverter esta migração:
-- BEGIN;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS requires_approval;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS approval_status;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS approval_comments;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS approved_by;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS approved_at;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS rejected_by;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS rejected_at;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS rejection_reason;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS form_data;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS estimated_cost;
-- ALTER TABLE tickets DROP COLUMN IF EXISTS estimated_delivery_days;
-- DROP INDEX IF EXISTS idx_tickets_approval_status;
-- DROP INDEX IF EXISTS idx_tickets_requires_approval;
-- DROP INDEX IF EXISTS idx_tickets_approved_by;
-- DROP INDEX IF EXISTS idx_tickets_form_data;
-- DROP TABLE IF EXISTS service_requests_backup;
-- COMMIT;
