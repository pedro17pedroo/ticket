-- Migration: Adicionar Tabelas do Catálogo de Serviços
-- Data: 2025-01-25

-- Tabela de Categorias do Catálogo
CREATE TABLE IF NOT EXISTS catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'FolderOpen',
  "order" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Catálogo (Serviços)
CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES catalog_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  "shortDescription" VARCHAR(255),
  "fullDescription" TEXT,
  icon VARCHAR(50) DEFAULT 'Box',
  "slaId" UUID REFERENCES slas(id) ON DELETE SET NULL,
  "defaultTicketCategoryId" UUID REFERENCES categories(id) ON DELETE SET NULL,
  "defaultPriority" VARCHAR(20) DEFAULT 'media' CHECK ("defaultPriority" IN ('baixa', 'media', 'alta', 'critica')),
  "requiresApproval" BOOLEAN DEFAULT false,
  "defaultApproverId" UUID REFERENCES users(id) ON DELETE SET NULL,
  "assignedDepartmentId" UUID REFERENCES departments(id) ON DELETE SET NULL,
  "estimatedCost" DECIMAL(10, 2),
  "costCurrency" VARCHAR(3) DEFAULT 'EUR',
  "estimatedDeliveryTime" INTEGER,
  "customFields" JSONB DEFAULT '[]'::jsonb,
  "requestCount" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "isPublic" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Solicitações de Serviço
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "catalogItemId" UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  "requesterId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "ticketId" UUID REFERENCES tickets(id) ON DELETE SET NULL,
  "formData" JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),
  "approverId" UUID REFERENCES users(id) ON DELETE SET NULL,
  "approvalDate" TIMESTAMP WITH TIME ZONE,
  "approvalComments" TEXT,
  "approvedCost" DECIMAL(10, 2),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_catalog_categories_org ON catalog_categories("organizationId");
CREATE INDEX IF NOT EXISTS idx_catalog_items_org ON catalog_items("organizationId");
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items("categoryId");
CREATE INDEX IF NOT EXISTS idx_service_requests_org ON service_requests("organizationId");
CREATE INDEX IF NOT EXISTS idx_service_requests_item ON service_requests("catalogItemId");
CREATE INDEX IF NOT EXISTS idx_service_requests_requester ON service_requests("requesterId");
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- Comentários
COMMENT ON TABLE catalog_categories IS 'Categorias do catálogo de serviços';
COMMENT ON TABLE catalog_items IS 'Itens (serviços) disponíveis no catálogo';
COMMENT ON TABLE service_requests IS 'Solicitações de serviço feitas pelos clientes';
