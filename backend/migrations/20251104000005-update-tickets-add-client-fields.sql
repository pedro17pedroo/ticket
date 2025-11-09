-- Migration: Update Tickets - Adicionar suporte para Clients e ClientUsers
-- Data: 2025-11-04
-- Descrição: Adiciona campos para rastrear empresa cliente e tipo de requester

BEGIN;

-- 1. Criar ENUM para tipo de requester
DO $$ BEGIN
  CREATE TYPE requester_type AS ENUM ('user', 'client_user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar campo client_id
ALTER TABLE tickets 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 3. Adicionar campo requester_type
ALTER TABLE tickets 
  ADD COLUMN IF NOT EXISTS requester_type requester_type DEFAULT 'client_user';

-- 4. Atualizar tickets existentes
-- Por padrão, marcar como 'user' se não tiver client_id
UPDATE tickets 
SET requester_type = 'user'
WHERE client_id IS NULL AND requester_type IS NULL;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_requester_type ON tickets(requester_type);
CREATE INDEX IF NOT EXISTS idx_tickets_org_client ON tickets(organization_id, client_id);

-- 6. Adicionar comentários
COMMENT ON COLUMN tickets.client_id IS 'Empresa cliente - preenchido quando requester é um client_user';
COMMENT ON COLUMN tickets.requester_type IS 'Tipo do requester: user = staff interno, client_user = usuário de empresa cliente';

-- 7. Remover constraint antiga de foreign key do requester_id (se existir)
-- Agora requester_id pode apontar para users OU client_users dependendo do requester_type

COMMIT;
