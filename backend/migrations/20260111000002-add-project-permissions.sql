-- Migration: Add Project Management Permissions to RBAC
-- Date: 2026-01-11
-- Description: Adds permissions for projects, project_tasks, and project_stakeholders

-- Insert project permissions
INSERT INTO permissions (id, resource, action, display_name, description, scope, category, is_system, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'projects', 'view', 'Ver Projetos', 'Visualizar projetos', 'organization', 'Projetos', true, NOW(), NOW()),
  (gen_random_uuid(), 'projects', 'create', 'Criar Projetos', 'Criar novos projetos', 'organization', 'Projetos', true, NOW(), NOW()),
  (gen_random_uuid(), 'projects', 'update', 'Editar Projetos', 'Editar projetos existentes', 'organization', 'Projetos', true, NOW(), NOW()),
  (gen_random_uuid(), 'projects', 'delete', 'Eliminar Projetos', 'Eliminar/arquivar projetos', 'organization', 'Projetos', true, NOW(), NOW()),
  (gen_random_uuid(), 'project_tasks', 'view', 'Ver Tarefas de Projeto', 'Visualizar tarefas de projetos', 'organization', 'Projetos', true, NOW(), NOW()),
  (gen_random_uuid(), 'project_tasks', 'create', 'Criar Tarefas de Projeto', 'Criar tarefas em projetos', 'organization', 'Projetos', true, NOW(), NOW()),
  (gen_random_uuid(), 'project_tasks', 'update', 'Editar Tarefas de Projeto', 'Editar tarefas de projetos', 'organization', 'Projetos', true, NOW(), NOW()),
  (gen_random_uuid(), 'project_tasks', 'delete', 'Eliminar Tarefas de Projeto', 'Eliminar tarefas de projetos', 'organization', 'Projetos', true, NOW(), NOW()),
  (gen_random_uuid(), 'project_stakeholders', 'manage', 'Gerir Stakeholders', 'Adicionar, editar e remover stakeholders de projetos', 'organization', 'Projetos', true, NOW(), NOW())
ON CONFLICT (resource, action) DO NOTHING;

-- Grant all project permissions to org-admin role (they already have all via '*')
-- Grant project permissions to org-manager role
INSERT INTO role_permissions (id, role_id, permission_id, granted, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, true, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('org-manager', 'gerente')
  AND p.resource IN ('projects', 'project_tasks', 'project_stakeholders')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant limited project permissions to supervisor role
INSERT INTO role_permissions (id, role_id, permission_id, granted, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, true, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'supervisor'
  AND (
    (p.resource = 'projects' AND p.action IN ('view', 'create', 'update'))
    OR (p.resource = 'project_tasks' AND p.action IN ('view', 'create', 'update'))
    OR (p.resource = 'project_stakeholders' AND p.action = 'manage')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant view/update permissions to agent and agente roles
INSERT INTO role_permissions (id, role_id, permission_id, granted, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, true, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('agent', 'agente', 'technician')
  AND (
    (p.resource = 'projects' AND p.action = 'view')
    OR (p.resource = 'project_tasks' AND p.action IN ('view', 'update'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
