-- Migration: Drop service_requests table
-- Date: 2026-01-18
-- Author: Kiro AI
-- Description: Remove tabela service_requests após unificação completa

BEGIN;

-- ============================================================================
-- VALIDAÇÃO ANTES DE DROPAR
-- ============================================================================

DO $$
DECLARE
  sr_count INTEGER;
  backup_count INTEGER;
  tickets_with_approval INTEGER;
BEGIN
  -- Contar registros
  SELECT COUNT(*) INTO sr_count FROM service_requests;
  SELECT COUNT(*) INTO backup_count FROM service_requests_backup;
  SELECT COUNT(*) INTO tickets_with_approval FROM tickets WHERE requires_approval = true;
  
  RAISE NOTICE '=== VALIDAÇÃO ANTES DE DROPAR ===';
  RAISE NOTICE 'service_requests: % registros', sr_count;
  RAISE NOTICE 'service_requests_backup: % registros', backup_count;
  RAISE NOTICE 'tickets com aprovação: % registros', tickets_with_approval;
  RAISE NOTICE '==================================';
  
  -- Validar que não há dados não migrados
  IF sr_count > 0 THEN
    RAISE EXCEPTION 'ATENÇÃO: service_requests ainda tem % registros! Migre antes de dropar.', sr_count;
  END IF;
END $$;

-- ============================================================================
-- DROPAR TABELA service_requests
-- ============================================================================

DROP TABLE IF EXISTS service_requests CASCADE;

-- ============================================================================
-- COMENTÁRIO NO BACKUP
-- ============================================================================

COMMENT ON TABLE service_requests_backup IS 
'Backup da tabela service_requests antes da unificação (2026-01-18). 
Esta tabela foi substituída pelos campos de aprovação em tickets.
Pode ser removida após validação completa do sistema.';

COMMIT;

-- ============================================================================
-- NOTAS
-- ============================================================================

-- A tabela service_requests_backup pode ser removida após validação:
-- DROP TABLE IF EXISTS service_requests_backup;

-- Para restaurar (se necessário):
-- CREATE TABLE service_requests AS SELECT * FROM service_requests_backup;
