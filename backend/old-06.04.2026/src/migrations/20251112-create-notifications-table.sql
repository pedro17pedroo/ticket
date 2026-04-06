-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Destinatário
  recipient_id UUID NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('organization', 'client')),
  
  -- Compatibilidade
  user_id UUID,
  
  -- Organização (multi-tenant)
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Tipo e conteúdo
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'ticket_created', 'ticket_assigned', 'ticket_updated', 
    'ticket_status_changed', 'ticket_priority_changed', 
    'ticket_transferred', 'ticket_merged', 'ticket_approved', 
    'ticket_rejected', 'ticket_resolved', 'ticket_closed', 
    'ticket_reopened', 'comment_added', 'comment_mentioned', 
    'sla_warning', 'sla_breached', 'resolution_updated',
    'service_request_created', 'service_request_approved', 
    'service_request_rejected'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Dados relacionados
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  
  -- URL de ação
  link VARCHAR(500),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Prioridade
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- E-mail
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  email_error TEXT,
  
  -- Autor da ação
  actor_id UUID,
  actor_type VARCHAR(20) CHECK (actor_type IN ('organization', 'client', 'system')),
  actor_name VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_email_sent ON notifications(email_sent);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket_id ON notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);

-- Comentários
COMMENT ON TABLE notifications IS 'Notificações para usuários de organizações e clientes';
COMMENT ON COLUMN notifications.recipient_id IS 'ID do usuário que recebe (organization_user ou client_user)';
COMMENT ON COLUMN notifications.recipient_type IS 'Tipo do destinatário: organization ou client';
COMMENT ON COLUMN notifications.user_id IS 'Legado - ID do usuário';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificação';
COMMENT ON COLUMN notifications.data IS 'Dados adicionais em JSON';
COMMENT ON COLUMN notifications.actor_id IS 'ID do usuário que causou a notificação';
COMMENT ON COLUMN notifications.actor_type IS 'Tipo do autor da ação';
