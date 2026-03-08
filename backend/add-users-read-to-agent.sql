-- ============================================================================
-- ADICIONAR PERMISSÃO users.read AO ROLE AGENT
-- ============================================================================
-- 
-- CONTEXTO:
-- Quando o sistema consulta tickets, faz JOINs com tabelas de usuários para
-- trazer informações do solicitante e responsável. Agentes precisam VER essas
-- informações (nome, email, avatar) mas não GERENCIAR usuários.
--
-- SOLUÇÃO:
-- Adicionar permissão users.read ao role agent para permitir visualização
-- de informações de usuários em contexto de tickets.
--
-- IMPORTANTE:
-- - users.read permite VER informações de usuários
-- - users.create, users.update, users.delete permanecem restritas a admins
-- ============================================================================

-- Verificar se a permissão users.read existe
DO $$
DECLARE
    v_permission_id UUID;
    v_role_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Buscar ID da permissão users.read
    SELECT id INTO v_permission_id
    FROM permissions
    WHERE resource = 'users' AND action = 'read';

    IF v_permission_id IS NULL THEN
        RAISE NOTICE '❌ Permissão users.read não encontrada. Criando...';
        
        INSERT INTO permissions (id, resource, action, description, applicable_to, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'users',
            'read',
            'Visualizar informações de usuários',
            '["system", "organization", "client"]'::jsonb,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_permission_id;
        
        RAISE NOTICE '✅ Permissão users.read criada com ID: %', v_permission_id;
    ELSE
        RAISE NOTICE '✅ Permissão users.read encontrada com ID: %', v_permission_id;
    END IF;

    -- Buscar ID do role agent
    SELECT id INTO v_role_id
    FROM roles
    WHERE name = 'agent' AND level = 'organization';

    IF v_role_id IS NULL THEN
        RAISE NOTICE '❌ Role agent não encontrado';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Role agent encontrado com ID: %', v_role_id;

    -- Verificar se a associação já existe
    SELECT EXISTS(
        SELECT 1 FROM role_permissions
        WHERE role_id = v_role_id AND permission_id = v_permission_id
    ) INTO v_exists;

    IF v_exists THEN
        RAISE NOTICE '⚠️  Permissão users.read já está associada ao role agent';
    ELSE
        -- Adicionar permissão ao role agent
        INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            v_role_id,
            v_permission_id,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Permissão users.read adicionada ao role agent';
    END IF;

END $$;

-- Verificar resultado
SELECT 
    r.name as role_name,
    p.resource,
    p.action,
    p.description
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'agent' AND p.resource = 'users'
ORDER BY p.action;
