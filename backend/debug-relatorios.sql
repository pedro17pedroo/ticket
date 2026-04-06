-- Script para debugar por que relatórios não mostram dados

-- 1. Ver estrutura da tabela time_tracking
\d time_tracking

-- 2. Ver todos os registros de time_tracking
SELECT 
  id,
  "ticketId",
  "userId",
  "organizationId",
  "startTime",
  "endTime",
  "totalSeconds",
  status,
  "createdAt"
FROM time_tracking
ORDER BY "createdAt" DESC;

-- 3. Ver o ticket específico TKT-20260309-4344
SELECT 
  id,
  "ticketNumber",
  subject,
  status,
  "organizationId",
  "assigneeId",
  "createdAt"
FROM tickets
WHERE "ticketNumber" = 'TKT-20260309-4344';

-- 4. Ver time tracking desse ticket específico
SELECT 
  tt.id,
  tt."ticketId",
  tt."userId",
  tt."organizationId",
  tt."startTime",
  tt."endTime",
  tt."totalSeconds",
  tt.status,
  t."ticketNumber",
  t.subject
FROM time_tracking tt
INNER JOIN tickets t ON tt."ticketId" = t.id
WHERE t."ticketNumber" = 'TKT-20260309-4344';

-- 5. Simular a query do relatório (com snake_case)
SELECT 
  tt."ticketId",
  COUNT(DISTINCT tt."userId") as total_users,
  SUM(tt."totalSeconds") as total_seconds,
  COUNT(tt.id) as total_sessions,
  t."ticketNumber",
  t.subject
FROM time_tracking tt
INNER JOIN tickets t ON tt."ticketId" = t.id
WHERE tt."organizationId" = (SELECT "organizationId" FROM tickets WHERE "ticketNumber" = 'TKT-20260309-4344' LIMIT 1)
GROUP BY tt."ticketId", t.id, t."ticketNumber", t.subject
ORDER BY SUM(tt."totalSeconds") DESC;

-- 6. Ver se há problema com status
SELECT 
  status,
  COUNT(*) as count,
  SUM("totalSeconds") as total_seconds
FROM time_tracking
GROUP BY status;

-- 7. Ver se há registros com totalSeconds NULL
SELECT 
  COUNT(*) as total_records,
  COUNT("totalSeconds") as records_with_seconds,
  COUNT(*) - COUNT("totalSeconds") as records_without_seconds
FROM time_tracking;

-- 8. Ver organizationId do usuário logado vs time_tracking
SELECT DISTINCT
  tt."organizationId" as time_tracking_org,
  t."organizationId" as ticket_org,
  CASE 
    WHEN tt."organizationId" = t."organizationId" THEN 'MATCH'
    ELSE 'MISMATCH'
  END as status
FROM time_tracking tt
INNER JOIN tickets t ON tt."ticketId" = t.id;
