-- Adicionar coluna uploaded_by_type à tabela attachments
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS uploaded_by_type VARCHAR(50) DEFAULT 'user';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'attachments' AND column_name = 'uploaded_by_type';
