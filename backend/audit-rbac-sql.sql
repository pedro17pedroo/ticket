-- ============================================================================
-- AUDITORIA COMPLETA DO SISTEMA RBAC
-- ============================================================================

\echo '================================================================================'
\echo '1. ESTRUTURA DO BANCO DE DADOS'
\echo '================================================================================'

\echo '\n1.1 Tabelas RBAC:'
SELECT 
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as columns,
    (SELECT COUNT(*) FROM pg_class WHERE relname = tablename) as exists
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('roles', 'permissions', 'role_permissions', 'user_permissions')
ORDER BY tablename;

\echo '\n1.2 Contagem de registros:'
SELECT 'roles' as tabela, COUNT(*) as registros FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'user_permissions', COUNT(*) FROM user_permissions;

\echo '\n================================================================================'
\echo '2. PERMISSÕES'
\echo '================================================================================'

\echo '\n2.1 Recursos cadastrados:'
SELECT 
    resource,
    COUNT(*) as permission_count,
    STRING_AGG(DISTINCT action, ', ' ORDER BY action) as actions
FROM permissions
GROUP BY resource
ORDER BY resource;

\echo '\n2.2 Permissões sem display_name:'
SELECT resource, action, description
FROM permissions
WHERE display_name IS NULL OR display_name = ''
ORDER BY resource, action;

\echo '\n2.3 Permissões por applicable_to:'
SELECT 
    CASE 
        WHEN applicable_to @> '["system"]'::jsonb THEN 'system'
        WHEN applicable_to @> '["organization"]'::jsonb THEN 'organization'
        WHEN applicable_to @> '["client"]'::jsonb THEN 'client'
        ELSE 'unknown'
    END as level,
    COUNT(*) as count
FROM permissions
GROUP BY level
ORDER BY count DESC;

\echo '\n================================================================================'
\echo '3. ROLES'
\echo '================================================================================'

\echo '\n3.1 Roles cadastrados:'
SELECT 
    name,
    level,
    display_name,
    (SELECT COUNT(*) FROM role_permissions WHERE role_id = roles.id) as permission_count
FROM roles
ORDER BY level, name;

\echo '\n3.2 Roles sem permissões:'
SELECT r.name, r.level, r.display_name
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE rp.id IS NULL
ORDER BY r.level, r.name;

\echo '\n3.3 Distribuição de permissões por role:'
SELECT 
    r.name as role_name,
    r.level,
    COUNT(rp.id) as permission_count,
    STRING_AGG(p.resource || '.' || p.action, ', ' ORDER BY p.resource, p.action) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name, r.level
ORDER BY permission_count DESC;

\echo '\n================================================================================'
\echo '4. PERMISSÕES CRÍTICAS'
\echo '================================================================================'

\echo '\n4.1 Permissões de atribuição de tickets:'
SELECT 
    p.resource || '.' || p.action as permission,
    p.display_name,
    STRING_AGG(r.name, ', ' ORDER BY r.name) as roles
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id
WHERE p.resource = 'tickets' AND p.action LIKE 'assign%'
GROUP BY p.id, p.resource, p.action, p.display_name
ORDER BY p.action;

\echo '\n4.2 Permissões de usuários:'
SELECT 
    p.resource || '.' || p.action as permission,
    p.display_name,
    STRING_AGG(r.name, ', ' ORDER BY r.name) as roles
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id
WHERE p.resource = 'users'
GROUP BY p.id, p.resource, p.action, p.display_name
ORDER BY p.action;

\echo '\n4.3 Permissões de tickets:'
SELECT 
    p.action,
    p.display_name,
    STRING_AGG(r.name, ', ' ORDER BY r.name) as roles
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN roles r ON rp.role_id = r.id
WHERE p.resource = 'tickets'
GROUP BY p.id, p.action, p.display_name
ORDER BY p.action;

\echo '\n================================================================================'
\echo '5. PERMISSÕES NÃO UTILIZADAS'
\echo '================================================================================'

\echo '\n5.1 Permissões não atribuídas a nenhum role:'
SELECT 
    p.resource,
    p.action,
    p.display_name,
    p.description
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.id IS NULL
ORDER BY p.resource, p.action;

\echo '\n================================================================================'
\echo '6. USUÁRIOS E ROLES'
\echo '================================================================================'

\echo '\n6.1 Distribuição de usuários por role (organization_users):'
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM organization_users
GROUP BY role
ORDER BY user_count DESC;

\echo '\n6.2 Usuários com permissões customizadas:'
SELECT 
    u.name,
    u.email,
    u.role,
    COUNT(up.id) as custom_permissions
FROM organization_users u
LEFT JOIN user_permissions up ON u.id = up.user_id
GROUP BY u.id, u.name, u.email, u.role
HAVING COUNT(up.id) > 0
ORDER BY custom_permissions DESC;

\echo '\n================================================================================'
\echo '7. ANÁLISE DE CONSISTÊNCIA'
\echo '================================================================================'

\echo '\n7.1 Verificar integridade referencial:'
-- Verificar role_permissions com role_id inválido
SELECT 'role_permissions com role_id inválido' as issue, COUNT(*) as count
FROM role_permissions rp
LEFT JOIN roles r ON rp.role_id = r.id
WHERE r.id IS NULL
UNION ALL
-- Verificar role_permissions com permission_id inválido
SELECT 'role_permissions com permission_id inválido', COUNT(*)
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE p.id IS NULL
UNION ALL
-- Verificar user_permissions com user_id inválido
SELECT 'user_permissions com user_id inválido', COUNT(*)
FROM user_permissions up
LEFT JOIN organization_users u ON up.user_id = u.id
WHERE u.id IS NULL;

\echo '\n7.2 Permissões duplicadas:'
SELECT 
    resource,
    action,
    COUNT(*) as duplicates
FROM permissions
GROUP BY resource, action
HAVING COUNT(*) > 1;

\echo '\n================================================================================'
\echo '8. RECOMENDAÇÕES'
\echo '================================================================================'

\echo '\n8.1 Roles que precisam de atenção:'
\echo '   - Roles sem permissões (ver seção 3.2)'
\echo '   - Roles com poucas permissões (< 5)'

SELECT 
    r.name,
    r.level,
    COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.level
HAVING COUNT(rp.id) < 5 AND COUNT(rp.id) > 0
ORDER BY permission_count;

\echo '\n8.2 Permissões que precisam de atenção:'
\echo '   - Permissões não utilizadas (ver seção 5.1)'
\echo '   - Permissões sem display_name (ver seção 2.2)'

\echo '\n================================================================================'
\echo 'AUDITORIA CONCLUÍDA'
\echo '================================================================================'
