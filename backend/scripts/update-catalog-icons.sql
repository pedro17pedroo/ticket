-- ============================================
-- Script de Atualização de Ícones do Catálogo
-- Data: 09/11/2025
-- Descrição: Substitui emojis por ícones do Lucide-react
-- ============================================

-- CATEGORIAS PRINCIPAIS
-- ============================================

-- RH: Users (pessoas)
UPDATE catalog_categories 
SET icon = 'Users' 
WHERE name = 'RH' OR name ILIKE '%recursos%humanos%';

-- TI: Monitor (tecnologia)
UPDATE catalog_categories 
SET icon = 'Monitor' 
WHERE name = 'TI' OR name ILIKE '%tecnologia%';

-- Facilities: Building (prédio)
UPDATE catalog_categories 
SET icon = 'Building' 
WHERE name ILIKE '%facilities%' OR name ILIKE '%infraestrutura%';

-- Financeiro: Briefcase (maleta)
UPDATE catalog_categories 
SET icon = 'Briefcase' 
WHERE name ILIKE '%financ%' OR name ILIKE '%contab%';

-- Suporte: Headphones (fone)
UPDATE catalog_categories 
SET icon = 'Headphones' 
WHERE name ILIKE '%suporte%' OR name ILIKE '%atendimento%';

-- ============================================
-- SUBCATEGORIAS DE TI
-- ============================================

-- Hardware
UPDATE catalog_categories 
SET icon = 'Box' 
WHERE name ILIKE '%hardware%' AND parent_category_id IS NOT NULL;

-- Impressoras
UPDATE catalog_categories 
SET icon = 'Printer' 
WHERE name ILIKE '%impress%' AND parent_category_id IS NOT NULL;

-- Computadores
UPDATE catalog_categories 
SET icon = 'Monitor' 
WHERE (name ILIKE '%computad%' OR name ILIKE '%desktop%' OR name ILIKE '%laptop%') 
  AND parent_category_id IS NOT NULL;

-- Rede
UPDATE catalog_categories 
SET icon = 'Wifi' 
WHERE name ILIKE '%rede%' AND parent_category_id IS NOT NULL;

-- Servidores
UPDATE catalog_categories 
SET icon = 'Server' 
WHERE name ILIKE '%servidor%' AND parent_category_id IS NOT NULL;

-- Banco de Dados
UPDATE catalog_categories 
SET icon = 'Database' 
WHERE name ILIKE '%banco%dados%' AND parent_category_id IS NOT NULL;

-- Telefonia
UPDATE catalog_categories 
SET icon = 'Phone' 
WHERE name ILIKE '%telefon%' AND parent_category_id IS NOT NULL;

-- Cloud
UPDATE catalog_categories 
SET icon = 'Cloud' 
WHERE name ILIKE '%cloud%' OR name ILIKE '%nuvem%';

-- ============================================
-- SUBCATEGORIAS DE RH
-- ============================================

-- Férias
UPDATE catalog_categories 
SET icon = 'Calendar' 
WHERE name ILIKE '%férias%' OR name ILIKE '%ferias%';

-- Folha de Pagamento
UPDATE catalog_categories 
SET icon = 'FileText' 
WHERE name ILIKE '%folha%' OR name ILIKE '%pagamento%';

-- Benefícios
UPDATE catalog_categories 
SET icon = 'Shield' 
WHERE name ILIKE '%benefic%';

-- ============================================
-- ITENS/SERVIÇOS
-- ============================================

-- Impressoras
UPDATE catalog_items 
SET icon = 'Printer' 
WHERE name ILIKE '%impress%';

-- Hardware
UPDATE catalog_items 
SET icon = 'Box' 
WHERE name ILIKE '%hardware%' OR name ILIKE '%equipamento%';

-- Computadores
UPDATE catalog_items 
SET icon = 'Monitor' 
WHERE name ILIKE '%computad%' OR name ILIKE '%desktop%' OR name ILIKE '%laptop%';

-- Rede/Internet
UPDATE catalog_items 
SET icon = 'Wifi' 
WHERE name ILIKE '%rede%' OR name ILIKE '%internet%' OR name ILIKE '%wifi%';

-- Telefonia
UPDATE catalog_items 
SET icon = 'Phone' 
WHERE name ILIKE '%telefon%' OR name ILIKE '%ramal%';

-- E-mail
UPDATE catalog_items 
SET icon = 'Mail' 
WHERE name ILIKE '%email%' OR name ILIKE '%e-mail%' OR name ILIKE '%correio%';

-- Acesso/Permissão
UPDATE catalog_items 
SET icon = 'Shield' 
WHERE name ILIKE '%acesso%' OR name ILIKE '%permiss%' OR name ILIKE '%credencial%';

-- Suporte
UPDATE catalog_items 
SET icon = 'Wrench' 
WHERE name ILIKE '%suport%' OR name ILIKE '%manuten%' OR name ILIKE '%reparo%';

-- Instalação
UPDATE catalog_items 
SET icon = 'Settings' 
WHERE name ILIKE '%instala%' OR name ILIKE '%config%';

-- Documentos
UPDATE catalog_items 
SET icon = 'FileText' 
WHERE name ILIKE '%documento%' OR name ILIKE '%certidão%' OR name ILIKE '%atestado%';

-- Cloud/Armazenamento
UPDATE catalog_items 
SET icon = 'Cloud' 
WHERE name ILIKE '%cloud%' OR name ILIKE '%armazenamento%' OR name ILIKE '%nuvem%';

-- Servidores
UPDATE catalog_items 
SET icon = 'Server' 
WHERE name ILIKE '%servidor%';

-- Banco de Dados
UPDATE catalog_items 
SET icon = 'Database' 
WHERE name ILIKE '%banco%dados%' OR name ILIKE '%database%';

-- Atualização de Software
UPDATE catalog_items 
SET icon = 'Zap' 
WHERE name ILIKE '%atualiza%' OR name ILIKE '%upgrade%';

-- Backup
UPDATE catalog_items 
SET icon = 'HardDrive' 
WHERE name ILIKE '%backup%' OR name ILIKE '%cópia%';

-- Pacotes/Entregas
UPDATE catalog_items 
SET icon = 'Package' 
WHERE icon IS NULL;

-- ============================================
-- RELATÓRIO
-- ============================================

-- Contar categorias atualizadas
SELECT 'Categorias atualizadas:' as tipo, COUNT(*) as total 
FROM catalog_categories 
WHERE icon IN ('Users', 'Monitor', 'Building', 'Briefcase', 'Headphones', 'Box', 
               'Printer', 'Wifi', 'Server', 'Database', 'Phone', 'Cloud', 'Shield', 
               'FileText', 'Calendar');

-- Contar itens atualizados
SELECT 'Itens atualizados:' as tipo, COUNT(*) as total 
FROM catalog_items 
WHERE icon IN ('Printer', 'Box', 'Monitor', 'Wifi', 'Phone', 'Mail', 'Shield', 
               'Wrench', 'Settings', 'FileText', 'Cloud', 'Server', 'Database', 
               'Zap', 'HardDrive', 'Package');

-- Listar ícones mais usados
SELECT icon, COUNT(*) as quantidade 
FROM (
  SELECT icon FROM catalog_categories
  UNION ALL
  SELECT icon FROM catalog_items
) as all_icons
GROUP BY icon
ORDER BY quantidade DESC
LIMIT 10;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
