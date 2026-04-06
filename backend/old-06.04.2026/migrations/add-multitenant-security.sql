-- =====================================================
-- Migration: Multi-Tenant Security Enhancements
-- Data: 2025-10-22
-- Descrição: Adiciona organizationId a comments e 
--            altera unique constraint de email
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ADICIONAR organizationId AO MODELO COMMENT
-- =====================================================

-- Adicionar coluna (permitindo NULL temporariamente)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Popular organization_id com base no ticket
UPDATE comments c
SET organization_id = t.organization_id
FROM tickets t
WHERE c.ticket_id = t.id
  AND c.organization_id IS NULL;

-- Verificar se há comentários sem organization_id
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM comments
  WHERE organization_id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'AVISO: % comentários sem organization_id encontrados!', orphan_count;
    RAISE NOTICE 'Verifique dados antes de prosseguir.';
    RAISE EXCEPTION 'Migração abortada - dados inconsistentes';
  END IF;
END $$;

-- Tornar NOT NULL
ALTER TABLE comments 
ALTER COLUMN organization_id SET NOT NULL;

-- Adicionar Foreign Key
ALTER TABLE comments 
ADD CONSTRAINT comments_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE CASCADE;

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_comments_organization_id 
ON comments(organization_id);

CREATE INDEX IF NOT EXISTS idx_comments_org_ticket 
ON comments(organization_id, ticket_id);

-- =====================================================
-- 2. ALTERAR UNIQUE CONSTRAINT DE EMAIL
-- =====================================================

-- Verificar se há emails duplicados entre organizações
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email, COUNT(DISTINCT organization_id) as org_count
    FROM users
    GROUP BY email
    HAVING COUNT(DISTINCT organization_id) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'INFORMAÇÃO: % emails existem em múltiplas organizações', duplicate_count;
    RAISE NOTICE 'Isso é PERMITIDO após a migração.';
  END IF;
END $$;

-- Verificar emails duplicados DENTRO da mesma organização
DO $$
DECLARE
  dup_in_org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_in_org_count
  FROM (
    SELECT email, organization_id, COUNT(*) as user_count
    FROM users
    GROUP BY email, organization_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF dup_in_org_count > 0 THEN
    RAISE EXCEPTION 'ERRO: % emails duplicados encontrados na mesma organização! Corrija antes de prosseguir.', dup_in_org_count;
  END IF;
END $$;

-- Remover constraint unique de email (se existir)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_email_key;

-- Criar unique index composto (email + organization_id)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_organization_unique 
ON users(email, organization_id);

-- =====================================================
-- 3. VERIFICAÇÕES DE INTEGRIDADE
-- =====================================================

-- Verificar que todos comments têm organization_id
DO $$
DECLARE
  comment_count INTEGER;
  comment_with_org INTEGER;
BEGIN
  SELECT COUNT(*) INTO comment_count FROM comments;
  SELECT COUNT(*) INTO comment_with_org FROM comments WHERE organization_id IS NOT NULL;
  
  RAISE NOTICE 'Total de comentários: %', comment_count;
  RAISE NOTICE 'Comentários com organization_id: %', comment_with_org;
  
  IF comment_count != comment_with_org THEN
    RAISE EXCEPTION 'ERRO: Nem todos comentários têm organization_id!';
  END IF;
END $$;

-- Verificar que organization_id de comment coincide com ticket
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM comments c
  JOIN tickets t ON c.ticket_id = t.id
  WHERE c.organization_id != t.organization_id;
  
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'ERRO: % comentários com organization_id diferente do ticket!', mismatch_count;
  END IF;
  
  RAISE NOTICE 'OK: Todos comentários têm organization_id consistente com ticket';
END $$;

-- =====================================================
-- 4. ATUALIZAR ESTATÍSTICAS
-- =====================================================

ANALYZE comments;
ANALYZE users;

-- =====================================================
-- COMMIT
-- =====================================================

COMMIT;

-- =====================================================
-- RESUMO DA MIGRAÇÃO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '1. ✅ Coluna organization_id adicionada a comments';
  RAISE NOTICE '2. ✅ Índices criados para performance';
  RAISE NOTICE '3. ✅ Email agora é unique por organização';
  RAISE NOTICE '4. ✅ Integridade de dados validada';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '- Reiniciar aplicação backend';
  RAISE NOTICE '- Executar testes de segurança';
  RAISE NOTICE '- Validar isolamento multi-tenant';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- ROLLBACK (em caso de erro)
-- =====================================================

-- Para reverter a migração:
/*
BEGIN;

-- Remover índice composto
DROP INDEX IF EXISTS users_email_organization_unique;

-- Recriar unique constraint global de email
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Remover índices de comments
DROP INDEX IF EXISTS idx_comments_org_ticket;
DROP INDEX IF EXISTS idx_comments_organization_id;

-- Remover foreign key
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_organization_id_fkey;

-- Remover coluna organization_id
ALTER TABLE comments DROP COLUMN IF EXISTS organization_id;

COMMIT;
*/
