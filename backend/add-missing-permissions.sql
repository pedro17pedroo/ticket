-- Script para adicionar permissões faltantes ao sistema RBAC
-- Data: ${new Date().toLocaleString('pt-BR')}

-- ==================== PERMISSÕES FALTANTES ====================

-- Directions (Direções)
INSERT INTO permissions (resource, action, display_name, description, scope, applicable_to)
VALUES
  ('directions', 'create', 'Criar Direções', 'Criar novas direções organizacionais', 'organization', '["organization"]'::jsonb),
  ('directions', 'read', 'Ver Direções', 'Visualizar direções organizacionais', 'organization', '["organization"]'::jsonb),
  ('directions', 'update', 'Atualizar Direções', 'Editar direções existentes', 'organization', '["organization"]'::jsonb),
  ('directions', 'delete', 'Eliminar Direções', 'Remover direções', 'organization', '["organization"]'::jsonb)
ON CONFLICT (resource, action) DO NOTHING;

-- Departments (Departamentos)
INSERT INTO permissions (resource, action, display_name, description, scope, applicable_to)
VALUES
  ('departments', 'create', 'Criar Departamentos', 'Criar novos departamentos', 'organization', '["organization"]'::jsonb),
  ('departments', 'read', 'Ver Departamentos', 'Visualizar departamentos', 'organization', '["organization"]'::jsonb),
  ('departments', 'update', 'Atualizar Departamentos', 'Editar departamentos existentes', 'organization', '["organization"]'::jsonb),
  ('departments', 'delete', 'Eliminar Departamentos', 'Remover departamentos', 'organization', '["organization"]'::jsonb)
ON CONFLICT (resource, action) DO NOTHING;

-- Sections (Secções)
INSERT INTO permissions (resource, action, display_name, description, scope, applicable_to)
VALUES
  ('sections', 'create', 'Criar Secções', 'Criar novas secções', 'organization', '["organization"]'::jsonb),
  ('sections', 'read', 'Ver Secções', 'Visualizar secções', 'organization', '["organization"]'::jsonb),
  ('sections', 'update', 'Atualizar Secções', 'Editar secções existentes', 'organization', '["organization"]'::jsonb),
  ('sections', 'delete', 'Eliminar Secções', 'Remover secções', 'organization', '["organization"]'::jsonb)
ON CONFLICT (resource, action) DO NOTHING;

-- Client Users (Utilizadores de Cliente)
INSERT INTO permissions (resource, action, display_name, description, scope, applicable_to)
VALUES
  ('client_users', 'create', 'Criar Utilizadores Cliente', 'Criar novos utilizadores de cliente', 'client', '["client"]'::jsonb),
  ('client_users', 'read', 'Ver Utilizadores Cliente', 'Visualizar utilizadores de cliente', 'client', '["client"]'::jsonb),
  ('client_users', 'update', 'Atualizar Utilizadores Cliente', 'Editar utilizadores de cliente', 'client', '["client"]'::jsonb),
  ('client_users', 'delete', 'Eliminar Utilizadores Cliente', 'Remover utilizadores de cliente', 'client', '["client"]'::jsonb)
ON CONFLICT (resource, action) DO NOTHING;

-- Remote Access (Acesso Remoto)
INSERT INTO permissions (resource, action, display_name, description, scope, applicable_to)
VALUES
  ('remote_access', 'request', 'Solicitar Acesso Remoto', 'Solicitar acesso remoto ao computador do cliente', 'organization', '["organization"]'::jsonb),
  ('remote_access', 'approve', 'Aprovar Acesso Remoto', 'Aprovar ou negar solicitações de acesso remoto', 'client', '["client"]'::jsonb),
  ('remote_access', 'view', 'Ver Acessos Remotos', 'Visualizar histórico de acessos remotos', 'organization', '["organization"]'::jsonb)
ON CONFLICT (resource, action) DO NOTHING;

-- ==================== ATRIBUIR PERMISSÕES AOS ROLES ====================

-- org-admin: Todas as permissões de organização
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name = 'org-admin'
  AND (
    (p.resource = 'directions' AND p.action IN ('create', 'read', 'update', 'delete'))
    OR (p.resource = 'departments' AND p.action IN ('create', 'read', 'update', 'delete'))
    OR (p.resource = 'sections' AND p.action IN ('create', 'read', 'update', 'delete'))
    OR (p.resource = 'remote_access' AND p.action IN ('request', 'view'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- org-manager: Permissões de leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name = 'org-manager'
  AND (
    (p.resource = 'directions' AND p.action = 'read')
    OR (p.resource = 'departments' AND p.action = 'read')
    OR (p.resource = 'sections' AND p.action = 'read')
    OR (p.resource = 'remote_access' AND p.action = 'view')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- agent: Permissões de leitura e acesso remoto
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name = 'agent'
  AND (
    (p.resource = 'directions' AND p.action = 'read')
    OR (p.resource = 'departments' AND p.action = 'read')
    OR (p.resource = 'sections' AND p.action = 'read')
    OR (p.resource = 'remote_access' AND p.action IN ('request', 'view'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- client-admin: Todas as permissões de cliente
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name = 'client-admin'
  AND (
    (p.resource = 'client_users' AND p.action IN ('create', 'read', 'update', 'delete'))
    OR (p.resource = 'remote_access' AND p.action = 'approve')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- client-user: Permissões de leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name = 'client-user'
  AND (
    (p.resource = 'client_users' AND p.action = 'read')
    OR (p.resource = 'remote_access' AND p.action = 'approve')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- super-admin e provider-admin: Todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name IN ('super-admin', 'provider-admin')
  AND (
    p.resource IN ('directions', 'departments', 'sections', 'client_users', 'remote_access')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================== VERIFICAÇÃO ====================

-- Contar permissões adicionadas
SELECT 
  'Permissões adicionadas' as tipo,
  COUNT(*) as total
FROM permissions
WHERE resource IN ('directions', 'departments', 'sections', 'client_users', 'remote_access');

-- Contar associações role-permission criadas por role
SELECT 
  r.name as role,
  COUNT(rp.permission_id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE p.resource IN ('directions', 'departments', 'sections', 'client_users', 'remote_access')
GROUP BY r.name
ORDER BY total_permissions DESC;

-- ==================== RESULTADO ESPERADO ====================
-- Permissões adicionadas: 19
-- org-admin: 14 novas permissões
-- org-manager: 4 novas permissões
-- agent: 5 novas permissões
-- client-admin: 5 novas permissões
-- client-user: 2 novas permissões
-- super-admin: 19 novas permissões
-- provider-admin: 19 novas permissões
