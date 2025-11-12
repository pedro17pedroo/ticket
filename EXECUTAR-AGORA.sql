-- ============================================
-- MIGRATION: Adicionar First Response At
-- Data: 11/11/2025
-- ============================================

-- 1. Adicionar coluna first_response_at
ALTER TABLE tickets 
ADD COLUMN first_response_at TIMESTAMP NULL;

COMMENT ON COLUMN tickets.first_response_at IS 'Timestamp da primeira resposta de um agente/técnico ao ticket';

-- 2. Criar índice para performance
CREATE INDEX tickets_first_response_at_idx ON tickets(first_response_at);

-- 3. Verificar se foi criado
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name = 'first_response_at';

-- 4. (OPCIONAL) Popular dados históricos
-- Marcar como "primeira resposta" o primeiro comentário de cada ticket feito por não-clientes
UPDATE tickets t
SET first_response_at = (
  SELECT MIN(c.created_at)
  FROM comments c
  INNER JOIN users u ON u.id = c.user_id
  WHERE c.ticket_id = t.id
    AND u.role NOT IN ('client-user', 'client-admin', 'client-viewer')
)
WHERE first_response_at IS NULL
  AND EXISTS (
    SELECT 1 
    FROM comments c
    INNER JOIN users u ON u.id = c.user_id
    WHERE c.ticket_id = t.id
      AND u.role NOT IN ('client-user', 'client-admin', 'client-viewer')
  );

-- 5. Verificar quantos tickets foram atualizados
SELECT 
  COUNT(*) FILTER (WHERE first_response_at IS NOT NULL) AS tickets_com_resposta,
  COUNT(*) FILTER (WHERE first_response_at IS NULL) AS tickets_sem_resposta,
  COUNT(*) AS total_tickets
FROM tickets;

-- 6. Ver exemplos
SELECT 
  ticket_number,
  subject,
  created_at,
  first_response_at,
  EXTRACT(EPOCH FROM (first_response_at - created_at))/60 AS response_time_minutes
FROM tickets 
WHERE first_response_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
