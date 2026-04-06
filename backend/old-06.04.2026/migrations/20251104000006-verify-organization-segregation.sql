-- Migration: Verificar e garantir segregação por organizationId em todas as tabelas
-- Data: 2025-11-04
-- Descrição: Adiciona organizationId onde necessário e cria índices

BEGIN;

-- Verificar e adicionar organization_id nas tabelas que precisam
-- (A maioria já deve ter, mas garantimos aqui)

-- 1. ATTACHMENTS (se não tiver)
ALTER TABLE attachments 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_attachments_organization_id ON attachments(organization_id);

-- 2. COMMENTS (se não tiver)
ALTER TABLE comments 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_organization_id ON comments(organization_id);

-- 3. NOTIFICATIONS (se não tiver)
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);

-- 4. TIME_TRACKING (se não tiver)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_tracking') THEN
    ALTER TABLE time_tracking 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_time_tracking_organization_id ON time_tracking(organization_id);
  END IF;
END $$;

-- 5. TICKET_HISTORY (se não tiver)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_history') THEN
    ALTER TABLE ticket_history 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_ticket_history_organization_id ON ticket_history(organization_id);
  END IF;
END $$;

-- 6. TICKET_TAGS (se não tiver)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_tags') THEN
    ALTER TABLE ticket_tags 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_ticket_tags_organization_id ON ticket_tags(organization_id);
  END IF;
END $$;

-- 7. Atualizar registros sem organization_id baseado nas relações
-- ATTACHMENTS -> pegar do ticket
UPDATE attachments a
SET organization_id = t.organization_id
FROM tickets t
WHERE a.ticket_id = t.id AND a.organization_id IS NULL;

-- COMMENTS -> pegar do ticket
UPDATE comments c
SET organization_id = t.organization_id
FROM tickets t
WHERE c.ticket_id = t.id AND c.organization_id IS NULL;

-- NOTIFICATIONS -> pegar do user
UPDATE notifications n
SET organization_id = u.organization_id
FROM users u
WHERE n.user_id = u.id AND n.organization_id IS NULL;

-- TIME_TRACKING -> pegar do ticket
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_tracking') THEN
    UPDATE time_tracking tt
    SET organization_id = t.organization_id
    FROM tickets t
    WHERE tt.ticket_id = t.id AND tt.organization_id IS NULL;
  END IF;
END $$;

-- TICKET_HISTORY -> pegar do ticket
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_history') THEN
    UPDATE ticket_history th
    SET organization_id = t.organization_id
    FROM tickets t
    WHERE th.ticket_id = t.id AND th.organization_id IS NULL;
  END IF;
END $$;

-- 8. Adicionar NOT NULL depois de popular os dados
-- (Comentado por segurança - descomente após validar que todos os dados estão corretos)

-- ALTER TABLE attachments ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE comments ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE notifications ALTER COLUMN organization_id SET NOT NULL;

-- 9. Criar views para facilitar queries com segregação

-- View: tickets com informações de cliente
CREATE OR REPLACE VIEW v_tickets_with_client AS
SELECT 
  t.*,
  c.name as client_name,
  c.email as client_email,
  CASE 
    WHEN t.requester_type = 'user' THEN u.name
    WHEN t.requester_type = 'client_user' THEN cu.name
  END as requester_name,
  CASE 
    WHEN t.requester_type = 'user' THEN u.email
    WHEN t.requester_type = 'client_user' THEN cu.email
  END as requester_email
FROM tickets t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN users u ON t.requester_id = u.id AND t.requester_type = 'user'
LEFT JOIN client_users cu ON t.requester_id = cu.id AND t.requester_type = 'client_user';

COMMENT ON VIEW v_tickets_with_client IS 'View de tickets com informações enriquecidas de cliente e requester';

-- 10. Função para verificar segregação
CREATE OR REPLACE FUNCTION verify_organization_isolation()
RETURNS TABLE (
  table_name TEXT,
  has_organization_id BOOLEAN,
  record_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    EXISTS(
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.table_name AND c.column_name = 'organization_id'
    ) as has_organization_id,
    (SELECT count(*) FROM information_schema.tables WHERE table_name = t.table_name)::BIGINT as record_count
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_organization_isolation() IS 'Função para verificar quais tabelas têm organization_id';

COMMIT;
