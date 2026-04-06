-- Script para verificar se há registros de time tracking

-- 1. Ver todos os tickets
SELECT 
  id,
  "ticketNumber",
  subject,
  status,
  "organizationId",
  "createdAt"
FROM tickets
ORDER BY "createdAt" DESC
LIMIT 10;

-- 2. Ver todos os registros de time tracking
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
ORDER BY "createdAt" DESC
LIMIT 10;

-- 3. Contar tickets vs time tracking
SELECT 
  (SELECT COUNT(*) FROM tickets) as total_tickets,
  (SELECT COUNT(*) FROM time_tracking) as total_time_entries,
  (SELECT COUNT(*) FROM time_tracking WHERE status = 'stopped') as stopped_entries;

-- 4. Ver tickets SEM time tracking
SELECT 
  t.id,
  t."ticketNumber",
  t.subject,
  t.status,
  COUNT(tt.id) as time_entries_count
FROM tickets t
LEFT JOIN time_tracking tt ON t.id = tt."ticketId"
GROUP BY t.id, t."ticketNumber", t.subject, t.status
HAVING COUNT(tt.id) = 0
ORDER BY t."createdAt" DESC;

-- 5. Ver tickets COM time tracking
SELECT 
  t.id,
  t."ticketNumber",
  t.subject,
  t.status,
  COUNT(tt.id) as time_entries_count,
  SUM(tt."totalSeconds") as total_seconds,
  ROUND(SUM(tt."totalSeconds")::numeric / 3600, 2) as total_hours
FROM tickets t
INNER JOIN time_tracking tt ON t.id = tt."ticketId"
WHERE tt.status = 'stopped'
GROUP BY t.id, t."ticketNumber", t.subject, t.status
ORDER BY total_seconds DESC;
