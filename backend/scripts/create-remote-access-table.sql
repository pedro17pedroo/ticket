-- Criar tipo ENUM para status
DO $$ BEGIN
    CREATE TYPE remote_access_status AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'active', 'ended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela remote_accesses
CREATE TABLE IF NOT EXISTS remote_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON UPDATE CASCADE ON DELETE SET NULL,
  status remote_access_status NOT NULL DEFAULT 'pending',
  access_token VARCHAR(255) UNIQUE,
  session_data JSONB,
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS remote_accesses_organization_id_idx ON remote_accesses(organization_id);
CREATE INDEX IF NOT EXISTS remote_accesses_ticket_id_idx ON remote_accesses(ticket_id);
CREATE INDEX IF NOT EXISTS remote_accesses_client_id_idx ON remote_accesses(client_id);
CREATE INDEX IF NOT EXISTS remote_accesses_status_idx ON remote_accesses(status);
CREATE INDEX IF NOT EXISTS remote_accesses_access_token_idx ON remote_accesses(access_token);

-- Marcar migration como executada
INSERT INTO "SequelizeMeta" (name) VALUES ('20251102-create-remote-access.cjs') ON CONFLICT DO NOTHING;
