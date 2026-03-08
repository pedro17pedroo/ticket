-- ============================================================================
-- Script: Ajustar RBAC para Suportar SaaS Multi-Nível
-- ============================================================================
-- Este script adiciona suporte completo para o modelo SaaS multi-nível:
-- - Provider (system) → Organization (tenant) → Client (cliente B2B)
-- ============================================================================

-- 1. Adicionar campo applicable_to na tabela permissions
-- ============================================================================
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS applicable_to JSONB DEFAULT '["system", "organization", "client"]'::jsonb;

COMMENT ON COLUMN permissions.applicable_to IS 'Níveis onde esta permissão pode ser aplicada: system, organization, client';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_permissions_applicable_to ON permissions USING GIN (applicable_to);

-- 2. Atualizar permissões existentes com applicable_to correto
-- ============================================================================

-- Permissões APENAS para SYSTEM (Provider)
UPDATE permissions 
SET applicable_to = '["system"]'::jsonb
WHERE resource IN (
  'organizations',      -- Gerenciar organizações
  'plans',             -- Gerenciar planos
  'billing',           -- Gerenciar billing
  'system_settings',   -- Configurações do sistema
  'system_logs',       -- Logs do sistema
  'system_monitoring'  -- Monitoramento do sistema
);

-- Permissões para ORGANIZATION e SYSTEM (não aplicável a clients)
UPDATE permissions 
SET applicable_to = '["system", "organization"]'::jsonb
WHERE resource IN (
  'users',             -- Gerenciar usuários da organização
  'directions',        -- Estrutura organizacional
  'departments',       -- Estrutura organizacional
  'sections',          -- Estrutura organizacional
  'roles',             -- Gerenciar roles
  'settings',          -- Configurações da organização
  'slas',              -- SLAs
  'priorities',        -- Prioridades
  'types',             -- Tipos de ticket
  'categories',        -- Categorias
  'tags',              -- Tags
  'templates',         -- Templates
  'desktop_agent',     -- Desktop Agent
  'hours_bank',        -- Bolsa de horas
  'projects',          -- Projetos
  'project_tasks',     -- Tarefas de projetos
  'project_stakeholders' -- Stakeholders
);

-- Permissões para TODOS OS NÍVEIS (system, organization, client)
UPDATE permissions 
SET applicable_to = '["system", "organization", "client"]'::jsonb
WHERE resource IN (
  'tickets',           -- Tickets (todos podem criar/ver)
  'comments',          -- Comentários
  'knowledge',         -- Base de conhecimento
  'catalog',           -- Catálogo de serviços
  'reports',           -- Relatórios
  'dashboard'          -- Dashboard
);

-- Permissões APENAS para ORGANIZATION e CLIENT (não system)
UPDATE permissions 
SET applicable_to = '["organization", "client"]'::jsonb
WHERE resource IN (
  'clients',           -- Gerenciar clientes (empresas B2B)
  'client_users',      -- Gerenciar usuários de clientes
  'assets'             -- Inventário
);

-- 3. Corrigir campo level nos roles existentes
-- ============================================================================

-- Roles de SYSTEM (Provider)
UPDATE roles 
SET level = 'system'
WHERE name IN ('super-admin', 'provider-admin')
AND organization_id IS NULL;

-- Roles de ORGANIZATION (Tenant)
UPDATE roles 
SET level = 'organization'
WHERE name IN ('org-admin', 'org-manager', 'agent', 'technician', 'supervisor', 'user')
AND organization_id IS NULL;

-- Roles de CLIENT (Cliente B2B)
UPDATE roles 
SET level = 'client'
WHERE name IN ('client-admin', 'client-manager', 'client-user')
AND organization_id IS NULL;

-- 4. Adicionar constraint para garantir consistência
-- ============================================================================

-- Garantir que roles de client sempre têm organization_id
ALTER TABLE roles 
ADD CONSTRAINT check_client_role_has_org 
CHECK (
  (level != 'client') OR 
  (level = 'client' AND organization_id IS NOT NULL)
);

-- Garantir que roles customizados de client têm client_id
ALTER TABLE roles 
ADD CONSTRAINT check_custom_client_role_has_client 
CHECK (
  (level != 'client' OR is_system = true) OR 
  (level = 'client' AND is_system = false AND client_id IS NOT NULL)
);

-- 5. Criar função para verificar se permissão é aplicável ao nível
-- ============================================================================

CREATE OR REPLACE FUNCTION is_permission_applicable_to_level(
  p_permission_id UUID,
  p_level TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_applicable_to JSONB;
BEGIN
  SELECT applicable_to INTO v_applicable_to
  FROM permissions
  WHERE id = p_permission_id;
  
  RETURN v_applicable_to @> to_jsonb(p_level);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_permission_applicable_to_level IS 'Verifica se uma permissão é aplicável a um determinado nível (system, organization, client)';

-- 6. Criar view para facilitar consultas de roles e permissões
-- ============================================================================

CREATE OR REPLACE VIEW v_role_permissions_with_level AS
SELECT 
  r.id as role_id,
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level,
  r.organization_id,
  r.client_id,
  r.is_system as role_is_system,
  p.id as permission_id,
  p.resource,
  p.action,
  p.display_name as permission_display_name,
  p.scope,
  p.applicable_to,
  p.category,
  rp.granted,
  CASE 
    WHEN r.level = 'system' THEN 'Provider'
    WHEN r.level = 'organization' THEN 'Organization'
    WHEN r.level = 'client' THEN 'Client'
  END as level_display,
  CASE
    WHEN r.organization_id IS NULL AND r.client_id IS NULL THEN 'Global'
    WHEN r.organization_id IS NOT NULL AND r.client_id IS NULL THEN 'Organization Custom'
    WHEN r.client_id IS NOT NULL THEN 'Client Custom'
  END as role_scope
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.is_active = true
AND rp.granted = true;

COMMENT ON VIEW v_role_permissions_with_level IS 'View que mostra roles, permissões e níveis hierárquicos';

-- 7. Criar índices adicionais para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_roles_level_org_client 
ON roles(level, organization_id, client_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_roles_name_org_client 
ON roles(name, organization_id, client_id) 
WHERE is_active = true;

-- 8. Atualizar comentários das tabelas
-- ============================================================================

COMMENT ON TABLE roles IS 'Roles do sistema com suporte a multi-nível (system, organization, client)';
COMMENT ON COLUMN roles.level IS 'Nível hierárquico: system (provider), organization (tenant), client (cliente B2B)';
COMMENT ON COLUMN roles.organization_id IS 'NULL = role global, UUID = role customizado da organização';
COMMENT ON COLUMN roles.client_id IS 'NULL = role da org, UUID = role customizado do cliente';

COMMENT ON TABLE permissions IS 'Permissões do sistema com suporte a multi-nível';
COMMENT ON COLUMN permissions.scope IS 'Escopo de acesso: global, organization, client, own';
COMMENT ON COLUMN permissions.applicable_to IS 'Níveis onde esta permissão pode ser aplicada (array JSON)';

-- 9. Verificar integridade dos dados
-- ============================================================================

-- Verificar roles sem level
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM roles
  WHERE level IS NULL;
  
  IF v_count > 0 THEN
    RAISE WARNING 'Existem % roles sem level definido', v_count;
  ELSE
    RAISE NOTICE '✅ Todos os roles têm level definido';
  END IF;
END $$;

-- Verificar permissões sem applicable_to
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM permissions
  WHERE applicable_to IS NULL;
  
  IF v_count > 0 THEN
    RAISE WARNING 'Existem % permissões sem applicable_to definido', v_count;
  ELSE
    RAISE NOTICE '✅ Todas as permissões têm applicable_to definido';
  END IF;
END $$;

-- 10. Criar função helper para buscar role correto
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role(
  p_role_name TEXT,
  p_organization_id UUID,
  p_client_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Tentar buscar role customizado do cliente
  IF p_client_id IS NOT NULL THEN
    SELECT id INTO v_role_id
    FROM roles
    WHERE name = p_role_name
    AND organization_id = p_organization_id
    AND client_id = p_client_id
    AND is_active = true
    LIMIT 1;
    
    IF v_role_id IS NOT NULL THEN
      RETURN v_role_id;
    END IF;
  END IF;
  
  -- Tentar buscar role customizado da organização
  IF p_organization_id IS NOT NULL THEN
    SELECT id INTO v_role_id
    FROM roles
    WHERE name = p_role_name
    AND organization_id = p_organization_id
    AND client_id IS NULL
    AND is_active = true
    LIMIT 1;
    
    IF v_role_id IS NOT NULL THEN
      RETURN v_role_id;
    END IF;
  END IF;
  
  -- Buscar role global
  SELECT id INTO v_role_id
  FROM roles
  WHERE name = p_role_name
  AND organization_id IS NULL
  AND client_id IS NULL
  AND is_active = true
  LIMIT 1;
  
  RETURN v_role_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_role IS 'Busca o role correto seguindo a hierarquia: cliente → organização → global';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Exibir resumo
SELECT 
  '✅ Script executado com sucesso!' as status,
  (SELECT COUNT(*) FROM roles WHERE level = 'system') as roles_system,
  (SELECT COUNT(*) FROM roles WHERE level = 'organization') as roles_organization,
  (SELECT COUNT(*) FROM roles WHERE level = 'client') as roles_client,
  (SELECT COUNT(*) FROM permissions WHERE applicable_to @> '["system"]'::jsonb) as permissions_system,
  (SELECT COUNT(*) FROM permissions WHERE applicable_to @> '["organization"]'::jsonb) as permissions_organization,
  (SELECT COUNT(*) FROM permissions WHERE applicable_to @> '["client"]'::jsonb) as permissions_client;

