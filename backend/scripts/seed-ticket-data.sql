-- Script para criar prioridades, tipos e categorias de exemplo
-- Execute este script para popular as tabelas

-- Obter o ID da organização (substitua pelo ID correto)
-- Para encontrar o ID: SELECT id, name FROM organizations;

-- PRIORIDADES
-- Deletar prioridades existentes (opcional)
-- DELETE FROM priorities WHERE organization_id = 'SEU_ORG_ID';

-- Inserir prioridades padrão (ajuste o organization_id)
INSERT INTO priorities (id, organization_id, name, color, "order", created_at, updated_at)
VALUES 
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Baixa', '#10b981', 1, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Média', '#f59e0b', 2, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Alta', '#ef4444', 3, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Urgente', '#dc2626', 4, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- TIPOS
-- Inserir tipos padrão
INSERT INTO types (id, organization_id, name, description, "order", created_at, updated_at)
VALUES 
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Incidente', 'Problema que afeta o serviço', 1, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Solicitação', 'Pedido de serviço ou informação', 2, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Bug', 'Erro no sistema', 3, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Melhoria', 'Sugestão de melhoria', 4, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- CATEGORIAS
-- Inserir categorias padrão
INSERT INTO categories (id, organization_id, name, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Suporte Técnico', 'Problemas técnicos gerais', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Software', 'Problemas com software', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Hardware', 'Problemas com equipamentos', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Rede', 'Problemas de conectividade', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM organizations LIMIT 1), 'Acesso', 'Problemas de login e permissões', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verificar dados inseridos
SELECT 'Prioridades:' as tipo, COUNT(*) as total FROM priorities;
SELECT 'Tipos:' as tipo, COUNT(*) as total FROM types;
SELECT 'Categorias:' as tipo, COUNT(*) as total FROM categories;
