-- Corrigir requesterType em tickets antigos
-- Tickets criados por clientes devem ter requesterType = 'client'

-- Atualizar tickets onde requesterType está null
UPDATE tickets 
SET requester_type = 'client'
WHERE requester_type IS NULL 
  AND requester_client_user_id IS NOT NULL;

UPDATE tickets 
SET requester_type = 'organization'
WHERE requester_type IS NULL 
  AND requester_org_user_id IS NOT NULL;

-- Fallback: se requesterId está definido mas requesterType ainda null,
-- assumir que é client (comportamento padrão antigo)
UPDATE tickets 
SET requester_type = 'client'
WHERE requester_type IS NULL 
  AND requester_id IS NOT NULL;

-- Mostrar estatísticas
DO $$
DECLARE
  total_tickets INTEGER;
  tickets_client INTEGER;
  tickets_org INTEGER;
  tickets_null INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tickets FROM tickets;
  SELECT COUNT(*) INTO tickets_client FROM tickets WHERE requester_type = 'client';
  SELECT COUNT(*) INTO tickets_org FROM tickets WHERE requester_type = 'organization';
  SELECT COUNT(*) INTO tickets_null FROM tickets WHERE requester_type IS NULL;
  
  RAISE NOTICE '=== ESTATÍSTICAS DE REQUESTER TYPE ===';
  RAISE NOTICE 'Total de tickets: %', total_tickets;
  RAISE NOTICE 'Tickets de clientes: %', tickets_client;
  RAISE NOTICE 'Tickets de organização: %', tickets_org;
  RAISE NOTICE 'Tickets sem tipo (null): %', tickets_null;
END $$;
