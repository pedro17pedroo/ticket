-- Script para verificar status dos timers de um ticket
-- Substitua 'UUID_DO_TICKET' pelo ID real do ticket

-- 1. Ver todos os timers do ticket
SELECT 
  id, 
  "ticketId", 
  "userId", 
  "organizationId",
  "startTime",
  "endTime",
  duration,
  "isActive",
  status,
  "totalPausedTime",
  description,
  "createdAt",
  "updatedAt"
FROM time_entries
WHERE "ticketId" = 'UUID_DO_TICKET'
ORDER BY "createdAt" DESC;

-- 2. Ver apenas timers ATIVOS (que não aparecem no portal do cliente)
SELECT 
  id, 
  "isActive", 
  status, 
  duration,
  "startTime",
  "endTime",
  CASE 
    WHEN "endTime" IS NULL THEN 'Timer ainda rodando'
    ELSE 'Timer parado mas isActive=true'
  END as observacao
FROM time_entries
WHERE "ticketId" = 'UUID_DO_TICKET'
  AND "isActive" = true;

-- 3. Ver apenas timers PARADOS (que aparecem no portal do cliente)
SELECT 
  id, 
  "isActive", 
  status, 
  duration,
  "startTime",
  "endTime",
  ROUND(duration::numeric / 3600, 2) as horas
FROM time_entries
WHERE "ticketId" = 'UUID_DO_TICKET'
  AND "isActive" = false;

-- 4. Calcular total de tempo trabalhado (como o backend faz)
SELECT 
  COUNT(*) as total_timers,
  SUM(duration) as total_segundos,
  ROUND(SUM(duration)::numeric / 3600, 2) as total_horas
FROM time_entries
WHERE "ticketId" = 'UUID_DO_TICKET'
  AND "isActive" = false
  AND duration IS NOT NULL;

-- 5. Ver informações do ticket
SELECT 
  id,
  "ticketNumber",
  subject,
  status,
  "organizationId",
  "clientId",
  "assigneeId",
  "createdAt"
FROM tickets
WHERE id = 'UUID_DO_TICKET';

-- 6. CORRIGIR timer ativo (se necessário) - CUIDADO!
-- Descomente apenas se tiver certeza que quer parar o timer manualmente
/*
UPDATE time_entries
SET 
  "isActive" = false,
  status = 'stopped',
  "endTime" = NOW(),
  duration = EXTRACT(EPOCH FROM (NOW() - "startTime"))::integer - COALESCE("totalPausedTime", 0)
WHERE "ticketId" = 'UUID_DO_TICKET'
  AND "isActive" = true
  AND "endTime" IS NULL;
*/
