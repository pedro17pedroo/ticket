-- ============================================================================
-- CORREÇÃO COMPLETA: Adicionar Permissões aos Roles
-- ============================================================================

\echo '================================================================================'
\echo 'CORRIGINDO PERMISSÕES DOS ROLES'
\echo '================================================================================'

-- 1. Adicionar permissões ao client-admin
\echo '\n1. Adicionando permissões ao client-admin...'

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'client-admin' 
  AND r.level = 'client'
  AND p.resource IN ('tickets', 'dashboard', 'catalog', 'comments')
  AND p.action IN ('read', 'create', 'update', 'view', 'close')
  AND (p.applicable_to @> '["client"]'::jsonb OR p.applicable_to @> '["organization"]'::jsonb)
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 2. Adicionar permissões ao client-user
\echo '2. Adicionando permissões ao client-user...'

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'client-user' 
  AND r.level = 'client'
  AND p.resource IN ('tickets', 'dashboard', 'catalog', 'comments')
  AND p.action IN ('read', 'create', 'view')
  AND (p.applicable_to @> '["client"]'::jsonb OR p.applicable_to @> '["organization"]'::jsonb)
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 3. Adicionar permissões ao super-admin (todas as permissões)
\echo '3. Adicionando TODAS as permissões ao super-admin...'

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super-admin' 
  AND r.level = 'system'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 4. Adicionar permissões ao provider-admin (todas as permissões)
\echo '4. Adicionando TODAS as permissões ao provider-admin...'

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'provider-admin' 
  AND r.level = 'system'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 5. Adicionar mais permissões ao org-manager
\echo '5. Adicionando mais permissões ao org-manager...'

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'org-manager' 
  AND r.level = 'organization'
  AND p.resource IN ('tickets', 'users', 'dashboard', 'reports', 'projects', 'catalog', 'comments', 'knowledge')
  AND p.action IN ('read', 'view', 'create', 'update', 'close')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 6. Atribuir permissões não utilizadas ao org-admin
\echo '6. Atribuindo permissões não utilizadas ao org-admin...'

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'org-admin' 
  AND r.level = 'organization'
  AND p.resource IN ('assets', 'clients', 'desktop_agent', 'hours_bank', 'knowledge', 'project_stakeholders', 'project_tasks', 'tags', 'templates')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

\echo '\n================================================================================'
\echo 'VERIFICANDO RESULTADO'
\echo '================================================================================'

\echo '\nPermissões por role:'
SELECT 
    r.name as role_name,
    r.level,
    COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.level
ORDER BY permission_count DESC;

\echo '\nRoles que ainda precisam de atenção (< 5 permissões):'
SELECT 
    r.name,
    r.level,
    COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.level
HAVING COUNT(rp.id) < 5
ORDER BY permission_count;

\echo '\n================================================================================'
\echo 'CORREÇÃO CONCLUÍDA'
\echo '================================================================================'
