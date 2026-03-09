-- Adicionar permissão de relatórios ao sistema RBAC
-- Data: 08/03/2026

-- 1. Inserir permissão de relatórios (se não existir)
INSERT INTO permissions (id, resource, action, display_name, description, scope, category, is_system, created_at, updated_at)
SELECT 
  uuid_generate_v4(),
  'reports',
  'read',
  'Visualizar Relatórios',
  'Visualizar relatórios de horas e produtividade',
  'organization',
  'general',
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE resource = 'reports' AND action = 'read'
);

-- 2. Associar permissão ao role org-admin
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
  uuid_generate_v4(),
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'org-admin'
  AND p.resource = 'reports'
  AND p.action = 'read'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 3. Associar permissão ao role org-manager
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
  uuid_generate_v4(),
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'org-manager'
  AND p.resource = 'reports'
  AND p.action = 'read'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 4. Associar permissão ao role org-agent (acesso limitado)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
  uuid_generate_v4(),
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'org-agent'
  AND p.resource = 'reports'
  AND p.action = 'read'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Verificar permissões adicionadas
SELECT 
  r.name as role_name,
  p.resource,
  p.action,
  p.display_name,
  p.description
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.resource = 'reports' AND p.action = 'read'
ORDER BY r.name;
