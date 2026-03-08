-- =====================================================
-- MIGRATION: Catalog Access Control (ACL)
-- =====================================================
-- Descrição: Cria tabela para controle de acesso granular
--            ao catálogo de serviços por estrutura organizacional
--            e usuários individuais
-- Data: 2026-02-21
-- =====================================================

-- Criar tabela de controle de acesso ao catálogo
CREATE TABLE IF NOT EXISTS catalog_access_control (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Tipo de entidade que tem acesso
  -- 'direction' = Direção
  -- 'department' = Departamento
  -- 'section' = Secção
  -- 'user' = Usuário individual (organization_user)
  -- 'client' = Empresa cliente (para portal cliente)
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('direction', 'department', 'section', 'user', 'client')),
  
  -- ID da entidade (UUID da direção, departamento, secção, usuário ou cliente)
  entity_id UUID NOT NULL,
  
  -- Tipo de recurso do catálogo
  -- 'category' = Categoria do catálogo
  -- 'item' = Item/Serviço do catálogo
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('category', 'item')),
  
  -- ID do recurso (UUID da categoria ou item)
  resource_id UUID NOT NULL,
  
  -- Tipo de acesso
  -- 'allow' = Permitir acesso
  -- 'deny' = Negar acesso (tem precedência sobre allow)
  access_type VARCHAR(10) NOT NULL DEFAULT 'allow' CHECK (access_type IN ('allow', 'deny')),
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES organization_users(id) ON DELETE SET NULL,
  
  -- Constraint: Não permitir duplicatas
  UNIQUE(organization_id, entity_type, entity_id, resource_type, resource_id)
);

-- Índices para performance
CREATE INDEX idx_catalog_acl_entity ON catalog_access_control(entity_type, entity_id);
CREATE INDEX idx_catalog_acl_resource ON catalog_access_control(resource_type, resource_id);
CREATE INDEX idx_catalog_acl_org ON catalog_access_control(organization_id);
CREATE INDEX idx_catalog_acl_entity_resource ON catalog_access_control(entity_type, entity_id, resource_type, resource_id);

-- Comentários
COMMENT ON TABLE catalog_access_control IS 'Controle de acesso granular ao catálogo de serviços por estrutura organizacional e usuários';
COMMENT ON COLUMN catalog_access_control.entity_type IS 'Tipo de entidade: direction, department, section, user, client';
COMMENT ON COLUMN catalog_access_control.entity_id IS 'UUID da entidade (direção, departamento, secção, usuário ou cliente)';
COMMENT ON COLUMN catalog_access_control.resource_type IS 'Tipo de recurso: category, item';
COMMENT ON COLUMN catalog_access_control.resource_id IS 'UUID do recurso (categoria ou item do catálogo)';
COMMENT ON COLUMN catalog_access_control.access_type IS 'Tipo de acesso: allow (permitir), deny (negar - tem precedência)';

-- =====================================================
-- DADOS INICIAIS (Opcional)
-- =====================================================
-- Por padrão, não inserir nenhum registro = acesso total
-- Administradores podem configurar restrições conforme necessário

-- Exemplo: Dar acesso a uma direção específica a uma categoria
-- INSERT INTO catalog_access_control (
--   organization_id,
--   entity_type,
--   entity_id,
--   resource_type,
--   resource_id,
--   access_type
-- ) VALUES (
--   'uuid-da-organizacao',
--   'direction',
--   'uuid-da-direcao',
--   'category',
--   'uuid-da-categoria',
--   'allow'
-- );

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'catalog_access_control'
ORDER BY ordinal_position;

-- Verificar índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'catalog_access_control';
