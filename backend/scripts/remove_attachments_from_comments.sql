-- Migration: Remove attachments JSONB column from comments table
-- Date: 2025-11-01
-- Purpose: Remove old JSONB attachments field to use proper Sequelize association

-- Verificar se a coluna existe antes de remover
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='comments' 
    AND column_name='attachments'
  ) THEN
    -- Remover a coluna attachments
    ALTER TABLE comments DROP COLUMN attachments;
    RAISE NOTICE 'Coluna attachments removida com sucesso';
  ELSE
    RAISE NOTICE 'Coluna attachments não existe';
  END IF;
END $$;

-- Verificação (deve retornar 0 linhas)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name='comments' 
AND column_name='attachments';
