-- Fix Assets table to allow clientId NULL
-- Execute este SQL manualmente se o erro persistir

-- 1. Permitir clientId NULL
ALTER TABLE "Assets" ALTER COLUMN "client_id" DROP NOT NULL;

-- 2. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Assets';

-- 3. Ver assets existentes
SELECT id, name, "client_id", "user_id", "asset_tag", status 
FROM "Assets" 
LIMIT 10;
