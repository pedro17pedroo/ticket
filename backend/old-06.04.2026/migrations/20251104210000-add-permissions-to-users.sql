-- Migration: Adicionar coluna permissions à tabela users
-- Data: 2025-11-04

-- Adicionar coluna permissions (JSONB)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"canManageUsers": false, "canManageClients": false, "canManageTickets": true, "canViewReports": false, "canManageSettings": false}'::jsonb;

-- Comentário
COMMENT ON COLUMN users.permissions IS 'Permissões específicas do usuário (JSONB)';

-- Atualizar usuários existentes com permissões padrão baseadas no role
UPDATE users 
SET permissions = CASE
  WHEN role = 'admin-org' THEN '{"canManageUsers": true, "canManageClients": true, "canManageTickets": true, "canViewReports": true, "canManageSettings": true}'::jsonb
  WHEN role = 'agente' THEN '{"canManageUsers": false, "canManageClients": false, "canManageTickets": true, "canViewReports": true, "canManageSettings": false}'::jsonb
  ELSE '{"canManageUsers": false, "canManageClients": false, "canManageTickets": true, "canViewReports": false, "canManageSettings": false}'::jsonb
END
WHERE permissions IS NULL;

-- Verificação
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'permissions'
  ) THEN
    RAISE NOTICE '✅ Coluna permissions adicionada com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro ao adicionar coluna permissions';
  END IF;
END $$;
