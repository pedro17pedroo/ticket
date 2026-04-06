-- Script para adicionar todas as permissões ao role client-admin
-- O client-admin deve ter acesso completo à seção de Organização no Portal Cliente Empresa

-- Adicionar permissões de client_users (view, create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'client_users'
AND p.action IN ('view', 'create', 'update', 'delete')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- Adicionar permissões de directions (create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'directions'
AND p.action IN ('create', 'update', 'delete')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- Adicionar permissões de departments (create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'departments'
AND p.action IN ('create', 'update', 'delete')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- Adicionar permissões de sections (create, update, delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client-admin'
AND p.resource = 'sections'
AND p.action IN ('create', 'update', 'delete')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- Verificar permissões adicionadas
SELECT 
  r.name as role,
  p.resource,
  p.action,
  p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'client-admin'
ORDER BY p.resource, p.action;
