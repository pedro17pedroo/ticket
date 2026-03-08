-- ============================================================================
-- CORREÇÃO: Sistema de Atribuição de Tickets Baseado em Permissões RBAC
-- ============================================================================
-- 
-- PROBLEMA:
-- A lógica de atribuição de tickets estava hardcoded no middleware baseada
-- em roles (if role === 'agent'). Isso viola o princípio do RBAC onde as
-- permissões devem controlar o comportamento, não os roles.
--
-- SOLUÇÃO:
-- Criar permissões granulares para atribuição de tickets:
-- - tickets.assign_self: Pode se auto-atribuir tickets
-- - tickets.assign_team: Pode atribuir tickets a membros da sua equipe
-- - tickets.assign_all: Pode atribuir tickets a qualquer usuário
--
-- HIERARQUIA:
-- tickets.assign_all > tickets.assign_team > tickets.assign_self
-- ============================================================================

-- 1. Criar permissão tickets.assign_self
DO $$
DECLARE
    v_permission_id UUID;
BEGIN
    -- Verificar se já existe
    SELECT id INTO v_permission_id
    FROM permissions
    WHERE resource = 'tickets' AND action = 'assign_self';

    IF v_permission_id IS NULL THEN
        INSERT INTO permissions (id, resource, action, display_name, description, applicable_to, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'tickets',
            'assign_self',
            'Auto-atribuir Tickets',
            'Pode se auto-atribuir tickets',
            '["system", "organization", "client"]'::jsonb,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_permission_id;
        
        RAISE NOTICE '✅ Permissão tickets.assign_self criada com ID: %', v_permission_id;
    ELSE
        RAISE NOTICE '⚠️  Permissão tickets.assign_self já existe com ID: %', v_permission_id;
    END IF;
END $$;

-- 2. Criar permissão tickets.assign_team
DO $$
DECLARE
    v_permission_id UUID;
BEGIN
    -- Verificar se já existe
    SELECT id INTO v_permission_id
    FROM permissions
    WHERE resource = 'tickets' AND action = 'assign_team';

    IF v_permission_id IS NULL THEN
        INSERT INTO permissions (id, resource, action, display_name, description, applicable_to, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'tickets',
            'assign_team',
            'Atribuir Tickets à Equipe',
            'Pode atribuir tickets a membros da sua equipe/estrutura',
            '["system", "organization"]'::jsonb,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_permission_id;
        
        RAISE NOTICE '✅ Permissão tickets.assign_team criada com ID: %', v_permission_id;
    ELSE
        RAISE NOTICE '⚠️  Permissão tickets.assign_team já existe com ID: %', v_permission_id;
    END IF;
END $$;

-- 3. Renomear permissão tickets.assign para tickets.assign_all
DO $$
DECLARE
    v_permission_id UUID;
BEGIN
    -- Verificar se tickets.assign existe
    SELECT id INTO v_permission_id
    FROM permissions
    WHERE resource = 'tickets' AND action = 'assign';

    IF v_permission_id IS NOT NULL THEN
        -- Atualizar para assign_all
        UPDATE permissions
        SET 
            action = 'assign_all',
            display_name = 'Atribuir Tickets a Qualquer Um',
            description = 'Pode atribuir tickets a qualquer usuário da organização',
            updated_at = NOW()
        WHERE id = v_permission_id;
        
        RAISE NOTICE '✅ Permissão tickets.assign renomeada para tickets.assign_all';
    ELSE
        -- Criar tickets.assign_all se não existir
        INSERT INTO permissions (id, resource, action, display_name, description, applicable_to, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'tickets',
            'assign_all',
            'Atribuir Tickets a Qualquer Um',
            'Pode atribuir tickets a qualquer usuário da organização',
            '["system", "organization"]'::jsonb,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_permission_id;
        
        RAISE NOTICE '✅ Permissão tickets.assign_all criada com ID: %', v_permission_id;
    END IF;
END $$;

-- 4. Adicionar tickets.assign_self ao role agent
DO $$
DECLARE
    v_permission_id UUID;
    v_role_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Buscar IDs
    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'tickets' AND action = 'assign_self';
    SELECT id INTO v_role_id FROM roles WHERE name = 'agent' AND level = 'organization';

    IF v_permission_id IS NULL OR v_role_id IS NULL THEN
        RAISE NOTICE '❌ Permissão ou role não encontrado';
        RETURN;
    END IF;

    -- Verificar se já existe
    SELECT EXISTS(
        SELECT 1 FROM role_permissions
        WHERE role_id = v_role_id AND permission_id = v_permission_id
    ) INTO v_exists;

    IF NOT v_exists THEN
        INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
        VALUES (gen_random_uuid(), v_role_id, v_permission_id, NOW(), NOW());
        
        RAISE NOTICE '✅ Permissão tickets.assign_self adicionada ao role agent';
    ELSE
        RAISE NOTICE '⚠️  Role agent já tem permissão tickets.assign_self';
    END IF;
END $$;

-- 5. Remover tickets.assign_all do role agent (agentes não devem atribuir a outros)
DO $$
DECLARE
    v_permission_id UUID;
    v_role_id UUID;
BEGIN
    -- Buscar IDs
    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'tickets' AND action = 'assign_all';
    SELECT id INTO v_role_id FROM roles WHERE name = 'agent' AND level = 'organization';

    IF v_permission_id IS NOT NULL AND v_role_id IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE role_id = v_role_id AND permission_id = v_permission_id;
        
        RAISE NOTICE '✅ Permissão tickets.assign_all removida do role agent';
    END IF;
END $$;

-- 6. Adicionar tickets.assign_team ao role org-manager
DO $$
DECLARE
    v_permission_id UUID;
    v_role_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Buscar IDs
    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'tickets' AND action = 'assign_team';
    SELECT id INTO v_role_id FROM roles WHERE name = 'org-manager' AND level = 'organization';

    IF v_permission_id IS NULL THEN
        RAISE NOTICE '⚠️  Permissão tickets.assign_team não encontrada';
        RETURN;
    END IF;

    IF v_role_id IS NULL THEN
        RAISE NOTICE '⚠️  Role org-manager não encontrado';
        RETURN;
    END IF;

    -- Verificar se já existe
    SELECT EXISTS(
        SELECT 1 FROM role_permissions
        WHERE role_id = v_role_id AND permission_id = v_permission_id
    ) INTO v_exists;

    IF NOT v_exists THEN
        INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
        VALUES (gen_random_uuid(), v_role_id, v_permission_id, NOW(), NOW());
        
        RAISE NOTICE '✅ Permissão tickets.assign_team adicionada ao role org-manager';
    ELSE
        RAISE NOTICE '⚠️  Role org-manager já tem permissão tickets.assign_team';
    END IF;
END $$;

-- 7. Adicionar tickets.assign_all ao role org-admin
DO $$
DECLARE
    v_permission_id UUID;
    v_role_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Buscar IDs
    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'tickets' AND action = 'assign_all';
    SELECT id INTO v_role_id FROM roles WHERE name = 'org-admin' AND level = 'organization';

    IF v_permission_id IS NULL OR v_role_id IS NULL THEN
        RAISE NOTICE '❌ Permissão ou role não encontrado';
        RETURN;
    END IF;

    -- Verificar se já existe
    SELECT EXISTS(
        SELECT 1 FROM role_permissions
        WHERE role_id = v_role_id AND permission_id = v_permission_id
    ) INTO v_exists;

    IF NOT v_exists THEN
        INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
        VALUES (gen_random_uuid(), v_role_id, v_permission_id, NOW(), NOW());
        
        RAISE NOTICE '✅ Permissão tickets.assign_all adicionada ao role org-admin';
    ELSE
        RAISE NOTICE '⚠️  Role org-admin já tem permissão tickets.assign_all';
    END IF;
END $$;

-- 8. Verificar resultado final
SELECT 
    r.name as role_name,
    r.level,
    p.resource,
    p.action,
    p.description
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.resource = 'tickets' AND p.action LIKE 'assign%'
ORDER BY r.name, p.action;

-- 9. Mostrar hierarquia de permissões
SELECT 
    '=== HIERARQUIA DE PERMISSÕES DE ATRIBUIÇÃO ===' as info
UNION ALL
SELECT 'tickets.assign_all: Pode atribuir a QUALQUER usuário (org-admin)'
UNION ALL
SELECT 'tickets.assign_team: Pode atribuir a membros da EQUIPE (org-manager)'
UNION ALL
SELECT 'tickets.assign_self: Pode se AUTO-ATRIBUIR (agent)';
