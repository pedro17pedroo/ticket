-- ================================================
-- LIMPAR TIMER CORROMPIDO DEFINITIVAMENTE
-- ================================================
-- Execute AGORA no PostgreSQL
-- ================================================

-- 1. VER O PROBLEMA
SELECT 
  id,
  ticket_id,
  user_id,
  start_time,
  status,
  total_paused_time,
  is_active,
  EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER as total_elapsed,
  CASE 
    WHEN total_paused_time > EXTRACT(EPOCH FROM (NOW() - start_time)) 
    THEN '❌ CORROMPIDO'
    ELSE '✅ OK'
  END as check_status
FROM time_entries 
WHERE ticket_id = '5390bc65-912d-493f-b5f7-8464d6766623'
  AND is_active = TRUE;

-- ================================================
-- 2. DELETAR TIMER CORROMPIDO (RECOMENDADO)
-- ================================================
DELETE FROM time_entries 
WHERE ticket_id = '5390bc65-912d-493f-b5f7-8464d6766623'
  AND is_active = TRUE;

-- ================================================
-- 3. VERIFICAR QUE FOI DELETADO
-- ================================================
SELECT COUNT(*) as timers_ativos
FROM time_entries 
WHERE ticket_id = '5390bc65-912d-493f-b5f7-8464d6766623'
  AND is_active = TRUE;
-- Deve retornar: 0

-- ================================================
-- 4. LIMPAR TODOS OS TIMERS CORROMPIDOS (OPCIONAL)
-- ================================================
-- Use apenas se houver muitos timers com problema

-- Ver todos corrompidos:
SELECT 
  id,
  ticket_id,
  user_id,
  total_paused_time,
  EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER as total_elapsed
FROM time_entries 
WHERE is_active = TRUE
  AND total_paused_time > EXTRACT(EPOCH FROM (NOW() - start_time)) * 0.8;

-- Deletar todos corrompidos (CUIDADO!):
-- DELETE FROM time_entries 
-- WHERE is_active = TRUE
--   AND total_paused_time > EXTRACT(EPOCH FROM (NOW() - start_time)) * 0.8;
