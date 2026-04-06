-- Migration: Update Users - Remove cliente-org e adiciona roles Provider/Tenant
-- Data: 2025-11-04
-- Descrição: Atualiza tabela users para nova estrutura de roles

BEGIN;

-- 1. Criar novo ENUM com todas as roles (provider + tenant)
DO $$ BEGIN
  CREATE TYPE user_role_new AS ENUM (
    'super-admin', 'provider-admin', 'provider-support',
    'tenant-admin', 'tenant-manager', 'agent', 'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Migrar usuários 'cliente-org' para tabela client_users (será feito depois)
-- Por agora, vamos converter 'cliente-org' para 'agent' temporariamente
-- Os dados serão migrados corretamente no próximo script

-- 3. Adicionar coluna temporária com novo tipo
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_new user_role_new;

-- 4. Migrar dados para novo tipo
UPDATE users SET role_new = 
  CASE 
    WHEN role = 'admin-org' THEN 'tenant-admin'::user_role_new
    WHEN role = 'agente' THEN 'agent'::user_role_new
    WHEN role = 'cliente-org' THEN 'agent'::user_role_new  -- Temporário, será migrado depois
    ELSE 'agent'::user_role_new
  END;

-- 5. Remover coluna antiga e renomear nova
ALTER TABLE users DROP COLUMN IF EXISTS role CASCADE;
ALTER TABLE users RENAME COLUMN role_new TO role;

-- 6. Definir NOT NULL na nova coluna
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'agent'::user_role_new;

-- 7. Remover campo client_id (obsoleto)
ALTER TABLE users DROP COLUMN IF EXISTS client_id;

-- 8. Adicionar campo permissions se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "canManageUsers": false,
  "canManageClients": false,
  "canManageTickets": true,
  "canViewReports": false,
  "canManageSettings": false,
  "canAccessAPI": false
}'::jsonb;

-- 9. Atualizar permissões baseado no role
UPDATE users SET permissions = 
  CASE 
    WHEN role IN ('super-admin') THEN '{
      "canManageUsers": true,
      "canManageClients": true,
      "canManageTickets": true,
      "canViewReports": true,
      "canManageSettings": true,
      "canAccessAPI": true
    }'::jsonb
    WHEN role IN ('provider-admin', 'tenant-admin') THEN '{
      "canManageUsers": true,
      "canManageClients": true,
      "canManageTickets": true,
      "canViewReports": true,
      "canManageSettings": true,
      "canAccessAPI": true
    }'::jsonb
    WHEN role IN ('tenant-manager') THEN '{
      "canManageUsers": false,
      "canManageClients": false,
      "canManageTickets": true,
      "canViewReports": true,
      "canManageSettings": false,
      "canAccessAPI": false
    }'::jsonb
    WHEN role IN ('agent') THEN '{
      "canManageUsers": false,
      "canManageClients": false,
      "canManageTickets": true,
      "canViewReports": false,
      "canManageSettings": false,
      "canAccessAPI": false
    }'::jsonb
    ELSE permissions
  END
WHERE permissions IS NULL OR permissions = '{}'::jsonb;

-- 10. Adicionar comentário
COMMENT ON COLUMN users.role IS 'Roles para staff interno (Provider ou Tenant). Client users usam ClientUser model';
COMMENT ON COLUMN users.permissions IS 'Permissões granulares para o usuário';

-- 11. Remover o ENUM antigo (se não estiver sendo usado em outro lugar)
-- DROP TYPE IF EXISTS user_role CASCADE;

COMMIT;
