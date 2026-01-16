-- Corrigir tickets que não têm clientId mas têm requesterClientUserId
-- Preencher o clientId baseado no client_id do requesterClientUser

UPDATE tickets t
SET client_id = cu.client_id
FROM client_users cu
WHERE t.requester_client_user_id = cu.id
  AND t.client_id IS NULL
  AND t.requester_type = 'client';

-- Verificar quantos tickets foram atualizados
SELECT COUNT(*) as tickets_corrigidos
FROM tickets t
JOIN client_users cu ON t.requester_client_user_id = cu.id
WHERE t.requester_type = 'client'
  AND t.client_id = cu.client_id;

-- Verificar se ainda há tickets sem clientId
SELECT COUNT(*) as tickets_sem_clientid
FROM tickets
WHERE requester_type = 'client'
  AND client_id IS NULL;
