-- ================================================
-- FIX: Timer Corrompido - Resetar totalPausedTime
-- ================================================
-- Data: 11/11/2025 - 21:08
-- Timer ID: 8f1aa991-a768-464d-bc48-f5c0ec055818
-- Problema: totalPausedTime (8579s) > elapsedUntilPause (4997s)
-- ================================================

-- 1. VISUALIZAR O PROBLEMA
SELECT 
  id,
  ticket_id,
  start_time,
  status,
  total_paused_time,
  last_pause_start,
  is_active,
  EXTRACT(EPOCH FROM (NOW() - start_time)) as total_elapsed_seconds,
  CASE 
    WHEN total_paused_time >= EXTRACT(EPOCH FROM (NOW() - start_time)) 
    THEN '❌ CORROMPIDO'
    ELSE '✅ OK'
  END as status_check
FROM time_entries 
WHERE id = '8f1aa991-a768-464d-bc48-f5c0ec055818';

-- ================================================
-- OPÇÃO 1: Resetar totalPausedTime (RECOMENDADO)
-- ================================================
-- Mantém o timer ativo mas reseta tempo pausado

UPDATE time_entries 
SET 
  total_paused_time = 0,
  last_pause_start = NULL,
  status = 'running',
  updated_at = NOW()
WHERE id = '8f1aa991-a768-464d-bc48-f5c0ec055818';

-- ================================================
-- OPÇÃO 2: Parar o Timer
-- ================================================
-- Para o timer e registra duração aproximada

-- Calcular duração aproximada (total elapsed - paused time resetado)
UPDATE time_entries 
SET 
  end_time = NOW(),
  duration = GREATEST(0, EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER),
  total_paused_time = 0,
  is_active = FALSE,
  status = 'stopped',
  updated_at = NOW()
WHERE id = '8f1aa991-a768-464d-bc48-f5c0ec055818';

-- ================================================
-- OPÇÃO 3: Deletar o Timer Corrompido
-- ================================================
-- Remove completamente (use apenas se necessário)

-- DELETE FROM time_entries 
-- WHERE id = '8f1aa991-a768-464d-bc48-f5c0ec055818';

-- ================================================
-- VERIFICAR RESULTADO
-- ================================================

SELECT 
  id,
  start_time,
  end_time,
  duration,
  status,
  total_paused_time,
  is_active,
  EXTRACT(EPOCH FROM (NOW() - start_time)) as total_elapsed_seconds
FROM time_entries 
WHERE id = '8f1aa991-a768-464d-bc48-f5c0ec055818';

-- ================================================
-- PROCURAR OUTROS TIMERS CORROMPIDOS
-- ================================================

SELECT 
  id,
  ticket_id,
  start_time,
  status,
  total_paused_time,
  EXTRACT(EPOCH FROM (NOW() - start_time)) as total_elapsed,
  CASE 
    WHEN total_paused_time >= EXTRACT(EPOCH FROM (NOW() - start_time)) * 0.9
    THEN '⚠️ SUSPEITO'
    WHEN total_paused_time >= EXTRACT(EPOCH FROM (NOW() - start_time))
    THEN '❌ CORROMPIDO'
    ELSE '✅ OK'
  END as status_check
FROM time_entries 
WHERE is_active = TRUE
ORDER BY total_paused_time DESC;

-- ================================================
-- LIMPAR TODOS OS TIMERS CORROMPIDOS (CUIDADO!)
-- ================================================
-- Use apenas se houver muitos timers corrompidos

-- UPDATE time_entries 
-- SET 
--   total_paused_time = 0,
--   last_pause_start = NULL
-- WHERE 
--   is_active = TRUE 
--   AND total_paused_time >= EXTRACT(EPOCH FROM (NOW() - start_time)) * 0.9;
