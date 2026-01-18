-- ============================================================================
-- FIX: Atualizar tickets existentes que requerem aprovação
-- Data: 2026-01-18
-- ============================================================================

-- Atualizar tickets que têm status aguardando_aprovacao mas não têm requiresApproval definido
UPDATE tickets
SET 
  requires_approval = true,
  approval_status = CASE 
    WHEN approval_status IS NULL THEN 'pending'
    ELSE approval_status
  END
WHERE status = 'aguardando_aprovacao'
  AND (requires_approval IS NULL OR requires_approval = false);

-- Verificar resultados
SELECT 
  ticket_number,
  status,
  requires_approval,
  approval_status,
  catalog_item_id
FROM tickets
WHERE status = 'aguardando_aprovacao'
ORDER BY created_at DESC
LIMIT 10;

-- Estatísticas
SELECT 
  status,
  requires_approval,
  approval_status,
  COUNT(*) as total
FROM tickets
WHERE status = 'aguardando_aprovacao'
GROUP BY status, requires_approval, approval_status;
