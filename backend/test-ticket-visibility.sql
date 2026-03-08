-- Script para testar visibilidade de tickets
-- Usuário: Teste Agente (superuser@sistema.com)
-- ID: 9e7a29ec-763c-49c5-b10f-e2666dde3876

-- 1. Verificar dados do usuário
SELECT 
  id,
  name,
  email,
  role,
  organization_id,
  direction_id,
  department_id,
  section_id
FROM organization_users
WHERE id = '9e7a29ec-763c-49c5-b10f-e2666dde3876';

-- 2. Verificar ticket criado
SELECT 
  ticket_number,
  subject,
  requester_type,
  requester_org_user_id,
  assignee_id,
  direction_id,
  department_id,
  section_id,
  status,
  created_at
FROM tickets
WHERE ticket_number = 'TKT-20260220-6464';

-- 3. Simular filtro de visibilidade (o que o backend deveria fazer)
-- Este query deve retornar o ticket TKT-20260220-6464
SELECT 
  ticket_number,
  subject,
  requester_type,
  requester_org_user_id,
  assignee_id,
  status,
  CASE 
    WHEN assignee_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876' THEN 'Atribuído a mim'
    WHEN requester_type = 'organization' AND requester_org_user_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876' THEN 'Criado por mim'
    WHEN direction_id IS NULL THEN 'Sem direção (visível a todos)'
    ELSE 'Outro motivo'
  END as motivo_visibilidade
FROM tickets
WHERE 
  organization_id = (SELECT organization_id FROM organization_users WHERE id = '9e7a29ec-763c-49c5-b10f-e2666dde3876')
  AND (
    -- Condição 1: Atribuído ao usuário
    assignee_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876'
    -- Condição 2: Criado pelo usuário (CORREÇÃO APLICADA)
    OR (requester_type = 'organization' AND requester_org_user_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876')
    -- Condição 3: Sem direção (visível a todos)
    OR direction_id IS NULL
  )
ORDER BY created_at DESC;

-- 4. Verificar todos os tickets do usuário (criados por ele)
SELECT 
  ticket_number,
  subject,
  requester_type,
  requester_org_user_id,
  status,
  created_at
FROM tickets
WHERE 
  requester_type = 'organization'
  AND requester_org_user_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876'
ORDER BY created_at DESC;

-- 5. Contar tickets por tipo de visibilidade
SELECT 
  CASE 
    WHEN assignee_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876' THEN 'Atribuídos a mim'
    WHEN requester_type = 'organization' AND requester_org_user_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876' THEN 'Criados por mim'
    WHEN direction_id IS NULL THEN 'Sem direção'
    ELSE 'Outros'
  END as tipo,
  COUNT(*) as total
FROM tickets
WHERE 
  organization_id = (SELECT organization_id FROM organization_users WHERE id = '9e7a29ec-763c-49c5-b10f-e2666dde3876')
  AND (
    assignee_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876'
    OR (requester_type = 'organization' AND requester_org_user_id = '9e7a29ec-763c-49c5-b10f-e2666dde3876')
    OR direction_id IS NULL
  )
GROUP BY tipo
ORDER BY total DESC;
