-- ============================================
-- Script de Atualização de Cores do Catálogo
-- Data: 09/11/2025
-- Descrição: Define cores azuis para todas as categorias
-- ============================================

-- Atualizar todas as categorias para usar tons de azul
-- (cor padrão do sistema)

-- RH: Azul claro
UPDATE catalog_categories 
SET color = 'lightblue' 
WHERE name = 'RH' OR name ILIKE '%recursos%humanos%';

-- TI: Azul escuro
UPDATE catalog_categories 
SET color = 'darkblue' 
WHERE name = 'TI' OR name ILIKE '%tecnologia%';

-- Outras categorias principais: Azul padrão ou variações
UPDATE catalog_categories 
SET color = 'blue' 
WHERE color IS NULL OR color = '';

-- Ou definir cores específicas:
UPDATE catalog_categories 
SET color = 'cyan' 
WHERE name ILIKE '%facilities%' OR name ILIKE '%infraestrutura%';

UPDATE catalog_categories 
SET color = 'sky' 
WHERE name ILIKE '%suporte%' OR name ILIKE '%atendimento%';

-- Relatório
SELECT name, color 
FROM catalog_categories 
ORDER BY name;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
