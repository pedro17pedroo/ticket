-- Seed Basic RBAC Data
-- Date: 2026-01-17
-- Description: Inserts basic permissions and system roles

BEGIN;

-- ============================================================================
-- 1. INSERT BASIC PERMISSIONS
-- ============================================================================

-- Tickets permissions
INSERT INTO permissions (resource, action, display_name, description, category, scope, is_system) VALUES
('tickets', 'create', 'Criar Tickets', 'Pode criar novos tickets', 'tickets', 'organization', true),
('tickets', 'read', 'Ver Tickets', 'Pode visualizar tickets', 'tickets', 'organization', true),
('tickets', 'update', 'Editar Tickets', 'Pode editar tickets', 'tickets', 'organization', true),
('tickets', 'delete', 'Deletar Tickets', 'Pode deletar tickets', 'tickets', 'organization', true),
('tickets', 'assign', 'Atribuir Tickets', 'Pode atribuir tickets a outros usuários', 'tickets', 'organization', true),
('tickets', 'close', 'Fechar Tickets', 'Pode fechar tickets', 'tickets', 'organization', true)
ON CONFLICT (resource, action) DO NOTHING;

-- Projects permissions
INSERT INTO permissions (resource, action, display_name, description, category, scope, is_system) VALUES
('projects', 'create', 'Criar Projetos', 'Pode criar novos projetos', 'projects', 'organization', true),
('projects', 'read', 'Ver Projetos', 'Pode visualizar projetos', 'projects', 'organization', true),
('projects', 'update', 'Editar Projetos', 'Pode editar projetos', 'projects', 'organization', true),
('projects', 'delete', 'Deletar Projetos', 'Pode deletar projetos', 'projects', 'organization', true),
('projects', 'manage_tasks', 'Gerenciar Tarefas', 'Pode criar e gerenciar tarefas', 'projects', 'organization', true)
ON CONFLICT (resource, action) DO NOTHING;

-- Users permissions
INSERT INTO permissions (resource, action, display_name, description, category, scope, is_system) VALUES
('users', 'create', 'Criar Usuários', 'Pode criar novos usuários', 'users', 'organization', true),
('users', 'read', 'Ver Usuários', 'Pode visualizar usuários', 'users', 'organization', true),
('users', 'update', 'Editar Usuários', 'Pode editar usuários', 'users', 'organization', true),
('users', 'delete', 'Deletar Usuários', 'Pode deletar usuários', 'users', 'organization', true)
ON CONFLICT (resource, action) DO NOTHING;

-- Catalog permissions
INSERT INTO permissions (resource, action, display_name, description, category, scope, is_system) VALUES
('catalog', 'create', 'Criar Itens do Catálogo', 'Pode criar itens no catálogo', 'catalog', 'organization', true),
('catalog', 'read', 'Ver Catálogo', 'Pode visualizar o catálogo', 'catalog', 'organization', true),
('catalog', 'update', 'Editar Catálogo', 'Pode editar itens do catálogo', 'catalog', 'organization', true),
('catalog', 'delete', 'Deletar Itens', 'Pode deletar itens do catálogo', 'catalog', 'organization', true),
('catalog', 'approve', 'Aprovar Solicitações', 'Pode aprovar solicitações de serviço', 'catalog', 'organization', true)
ON CONFLICT (resource, action) DO NOTHING;

-- Reports permissions
INSERT INTO permissions (resource, action, display_name, description, category, scope, is_system) VALUES
('reports', 'view', 'Ver Relatórios', 'Pode visualizar relatórios', 'reports', 'organization', true),
('reports', 'export', 'Exportar Relatórios', 'Pode exportar relatórios', 'reports', 'organization', true),
('reports', 'advanced', 'Relatórios Avançados', 'Acesso a relatórios avançados', 'reports', 'organization', true)
ON CONFLICT (resource, action) DO NOTHING;

-- Settings permissions
INSERT INTO permissions (resource, action, display_name, description, category, scope, is_system) VALUES
('settings', 'read', 'Ver Configurações', 'Pode visualizar configurações', 'settings', 'organization', true),
('settings', 'update', 'Editar Configurações', 'Pode editar configurações', 'settings', 'organization', true),
('settings', 'manage_roles', 'Gerenciar Roles', 'Pode criar e editar roles', 'settings', 'organization', true)
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- 2. INSERT SYSTEM ROLES
-- ============================================================================

-- System level roles (Provider) - Only insert if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super-admin' AND organization_id IS NULL) THEN
    INSERT INTO roles (name, display_name, description, level, is_system, priority) 
    VALUES ('super-admin', 'Super Administrador', 'Acesso total ao sistema', 'system', true, 1000);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'provider-admin' AND organization_id IS NULL) THEN
    INSERT INTO roles (name, display_name, description, level, is_system, priority) 
    VALUES ('provider-admin', 'Administrador Provider', 'Administrador do provider', 'system', true, 900);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'org-admin' AND organization_id IS NULL) THEN
    INSERT INTO roles (name, display_name, description, level, is_system, priority) 
    VALUES ('org-admin', 'Administrador da Organização', 'Administrador com acesso total à organização', 'organization', true, 800);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'org-manager' AND organization_id IS NULL) THEN
    INSERT INTO roles (name, display_name, description, level, is_system, priority) 
    VALUES ('org-manager', 'Gerente', 'Gerente com permissões de supervisão', 'organization', true, 700);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'agent' AND organization_id IS NULL) THEN
    INSERT INTO roles (name, display_name, description, level, is_system, priority) 
    VALUES ('agent', 'Agente', 'Agente de suporte', 'organization', true, 600);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'user' AND organization_id IS NULL) THEN
    INSERT INTO roles (name, display_name, description, level, is_system, priority) 
    VALUES ('user', 'Usuário', 'Usuário padrão', 'organization', true, 500);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'client-admin' AND organization_id IS NULL) THEN
    INSERT INTO roles (name, display_name, description, level, is_system, priority) 
    VALUES ('client-admin', 'Administrador do Cliente', 'Administrador da empresa cliente', 'client', true, 400);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'client-user' AND organization_id IS NULL) THEN
    INSERT INTO roles (name, display_name, description, level, is_system, priority) 
    VALUES ('client-user', 'Usuário Cliente', 'Usuário da empresa cliente', 'client', true, 300);
  END IF;
END $$;

-- ============================================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- ============================================================================

-- Get role IDs
DO $$
DECLARE
  org_admin_role_id UUID;
  agent_role_id UUID;
  user_role_id UUID;
BEGIN
  -- Get org-admin role
  SELECT id INTO org_admin_role_id FROM roles WHERE name = 'org-admin' AND organization_id IS NULL LIMIT 1;
  
  -- Get agent role
  SELECT id INTO agent_role_id FROM roles WHERE name = 'agent' AND organization_id IS NULL LIMIT 1;
  
  -- Get user role
  SELECT id INTO user_role_id FROM roles WHERE name = 'user' AND organization_id IS NULL LIMIT 1;
  
  -- Assign ALL permissions to org-admin
  IF org_admin_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted)
    SELECT org_admin_role_id, id, true
    FROM permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  -- Assign ticket and project permissions to agent
  IF agent_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted)
    SELECT agent_role_id, id, true
    FROM permissions
    WHERE resource IN ('tickets', 'projects', 'catalog')
    AND action IN ('create', 'read', 'update', 'assign', 'close')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  -- Assign basic read permissions to user
  IF user_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id, granted)
    SELECT user_role_id, id, true
    FROM permissions
    WHERE action = 'read'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'RBAC data seeded successfully' as status;

SELECT 'Total permissions:' as info, COUNT(*) as count FROM permissions;
SELECT 'Total roles:' as info, COUNT(*) as count FROM roles;
SELECT 'Total role_permissions:' as info, COUNT(*) as count FROM role_permissions;

-- Show roles with permission counts
SELECT 
  r.name,
  r.display_name,
  r.level,
  COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.organization_id IS NULL
GROUP BY r.id, r.name, r.display_name, r.level
ORDER BY r.priority DESC;
