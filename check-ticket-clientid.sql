-- Verificar o ticket e seu clientId
SELECT 
  t.id,
  t.ticket_number,
  t.client_id,
  t.requester_type,
  t.requester_client_user_id,
  cu.name as requester_name,
  cu.email as requester_email,
  cu.client_id as requester_client_id,
  c.name as client_name
FROM tickets t
LEFT JOIN client_users cu ON t.requester_client_user_id = cu.id
LEFT JOIN clients c ON cu.client_id = c.id
WHERE t.id = '12b31c82-15a8-44a1-b786-4a65789af6d3';

-- Verificar o usuário pedro17pedroo@gmail.com
SELECT 
  id,
  name,
  email,
  role,
  client_id,
  is_active
FROM client_users
WHERE email = 'pedro17pedroo@gmail.com';
