-- Criar tabela de audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID,
  organization_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Inserir alguns logs de exemplo
INSERT INTO audit_logs (id, action, entity_type, entity_id, changes, created_at)
VALUES 
  (gen_random_uuid()::text, 'create', 'organization', gen_random_uuid()::text, '{"name": "Tech Solutions"}'::jsonb, NOW() - INTERVAL '2 days'),
  (gen_random_uuid()::text, 'update', 'user', gen_random_uuid()::text, '{"role": "admin"}'::jsonb, NOW() - INTERVAL '1 day'),
  (gen_random_uuid()::text, 'delete', 'plan', gen_random_uuid()::text, '{"name": "Basic"}'::jsonb, NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

SELECT 'Tabela audit_logs criada com sucesso!' as message;
