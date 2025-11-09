-- Migration: Create Clients Table
-- Data: 2025-11-04
-- Descrição: Cria tabela para empresas clientes B2B dos tenants

BEGIN;

-- 1. Criar tabela clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identificação da Empresa
  name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  tax_id VARCHAR(50),
  industry_type VARCHAR(100),
  
  -- Contato Principal
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(255),
  
  -- Endereço (JSONB)
  address JSONB DEFAULT '{}'::jsonb,
  
  -- Contrato/SLA (JSONB)
  contract JSONB DEFAULT '{
    "status": "active",
    "slaLevel": "standard",
    "supportHours": "business-hours",
    "maxUsers": 10,
    "maxTicketsPerMonth": 100
  }'::jsonb,
  
  -- Faturação (JSONB)
  billing JSONB DEFAULT '{
    "currency": "EUR",
    "billingCycle": "monthly",
    "paymentMethod": "bank-transfer"
  }'::jsonb,
  
  -- Contato Primário (JSONB)
  primary_contact JSONB DEFAULT '{}'::jsonb,
  
  -- Configurações (JSONB)
  settings JSONB DEFAULT '{
    "allowUserRegistration": false,
    "requireApproval": true,
    "autoAssignTickets": false,
    "notificationPreferences": {
      "email": true,
      "sms": false
    }
  }'::jsonb,
  
  -- Estatísticas (cache)
  stats JSONB DEFAULT '{
    "totalUsers": 0,
    "activeUsers": 0,
    "totalTickets": 0,
    "openTickets": 0
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMP,
  suspended_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar índices
CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_clients_tax_id ON clients(tax_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_is_active ON clients(is_active);
CREATE INDEX idx_clients_name_org ON clients(name, organization_id);

-- 3. Adicionar comentários
COMMENT ON TABLE clients IS 'Empresas clientes B2B das organizações tenant';
COMMENT ON COLUMN clients.organization_id IS 'Tenant ao qual este cliente pertence';
COMMENT ON COLUMN clients.name IS 'Razão social da empresa';
COMMENT ON COLUMN clients.trade_name IS 'Nome fantasia';
COMMENT ON COLUMN clients.tax_id IS 'NIF/CNPJ da empresa';
COMMENT ON COLUMN clients.contract IS 'Detalhes do contrato e SLA específico';
COMMENT ON COLUMN clients.billing IS 'Informações de billing e pagamento';
COMMENT ON COLUMN clients.stats IS 'Cache de estatísticas para performance';

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

COMMIT;
