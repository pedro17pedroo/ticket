-- Adicionar permissões ao role agent

-- Buscar o ID do role agent
DO $$
DECLARE
  agent_role_id UUID;
BEGIN
  SELECT id INTO agent_role_id FROM roles WHERE name = 'agent' LIMIT 1;
  
  IF agent_role_id IS NULL THEN
    RAISE NOTICE 'Role agent não encontrado!';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Role agent encontrado: %', agent_role_id;
  
  -- Adicionar permissões ao agent
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT 
    agent_role_id,
    p.id
  FROM permissions p
  WHERE (p.resource, p.action) IN (
    -- Dashboard
    ('dashboard', 'view'),
    -- Tickets
    ('tickets', 'read'),
    ('tickets', 'create'),
    ('tickets', 'update'),
    ('tickets', 'assign'),
    ('tickets', 'close'),
    -- Comentários
    ('comments', 'create'),
    ('comments', 'create_internal'),
    ('comments', 'view'),
    -- Clientes
    ('clients', 'read'),
    -- Estrutura organizacional (apenas visualização)
    ('directions', 'read'),
    ('departments', 'read'),
    ('sections', 'read'),
    -- Catálogo
    ('catalog', 'read'),
    -- Inventário
    ('assets', 'view'),
    ('assets', 'read'),
    -- Base de conhecimento
    ('knowledge', 'read'),
    ('knowledge', 'create'),
    ('knowledge', 'update'),
    -- Bolsa de horas
    ('hours_bank', 'view'),
    ('hours_bank', 'consume'),
    -- Relatórios
    ('reports', 'view'),
    -- Tags
    ('tags', 'view'),
    ('tags', 'read'),
    -- Templates
    ('templates', 'view'),
    ('templates', 'read'),
    -- Desktop Agent
    ('desktop_agent', 'view'),
    ('desktop_agent', 'read'),
    -- Projetos
    ('projects', 'view'),
    -- Tarefas de projetos
    ('project_tasks', 'view'),
    ('project_tasks', 'update')
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  RAISE NOTICE 'Permissões adicionadas ao role agent!';
END $$;

-- Verificar permissões do agent
SELECT 
  r.name as role,
  p.resource,
  p.action,
  p.display_name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'agent'
ORDER BY p.resource, p.action;
