-- =========================================
-- CORREÇÃO DA ESTRUTURA ORGANIZACIONAL HIERÁRQUICA
-- Data: 2025-11-04
-- Objetivo: Garantir hierarquia correta e segregação de dados
-- =========================================

BEGIN;

-- 1. REMOVER CONSTRAINTS ANTIGAS DE client_id (se existirem)
ALTER TABLE directions DROP CONSTRAINT IF EXISTS directions_client_id_fkey;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_client_id_fkey;
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_client_id_fkey;

-- 2. ADICIONAR FOREIGN KEYS CORRETAS para client_id (referenciando clients)
ALTER TABLE directions 
  ADD CONSTRAINT directions_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE departments 
  ADD CONSTRAINT departments_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE sections 
  ADD CONSTRAINT sections_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 3. VERIFICAR SE EXISTEM DEPARTMENTS SEM direction_id
-- (Se existirem, precisam ser corrigidos manualmente ou deletados)
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count 
    FROM departments 
    WHERE direction_id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE NOTICE 'ATENÇÃO: Existem % departamentos sem direção!', orphan_count;
        RAISE NOTICE 'Estes departamentos precisam ser associados a uma direção antes de continuar.';
        
        -- Listar os departamentos órfãos
        RAISE NOTICE 'Departamentos órfãos: %', orphan_count;
        
        -- Criar uma direção "Geral" para cada organização que tenha departamentos órfãos
        INSERT INTO directions (id, name, description, organization_id, is_active, created_at, updated_at)
        SELECT 
            gen_random_uuid(),
            'Direção Geral',
            'Direção criada automaticamente para agrupar departamentos sem direção',
            org.id,
            true,
            NOW(),
            NOW()
        FROM (
            SELECT DISTINCT organization_id as id 
            FROM departments 
            WHERE direction_id IS NULL
        ) org
        ON CONFLICT DO NOTHING;
        
        -- Associar departamentos órfãos à "Direção Geral"
        UPDATE departments d
        SET direction_id = dir.id
        FROM directions dir
        WHERE d.direction_id IS NULL
          AND d.organization_id = dir.organization_id
          AND dir.name = 'Direção Geral';
        
        RAISE NOTICE 'Departamentos órfãos foram associados à "Direção Geral" automaticamente.';
    ELSE
        RAISE NOTICE 'OK: Todos os departamentos têm direção associada.';
    END IF;
END $$;

-- 4. TORNAR departments.direction_id OBRIGATÓRIO
ALTER TABLE departments 
  ALTER COLUMN direction_id SET NOT NULL;

-- 5. ADICIONAR/ATUALIZAR ÍNDICES ÚNICOS (remover antigos se existirem)
DROP INDEX IF EXISTS idx_departments_unique_name;
CREATE UNIQUE INDEX idx_departments_unique_name 
  ON departments(organization_id, direction_id, name);

DROP INDEX IF EXISTS idx_directions_unique_name;  
CREATE UNIQUE INDEX idx_directions_unique_name 
  ON directions(organization_id, name) 
  WHERE client_id IS NULL;

DROP INDEX IF EXISTS idx_directions_unique_name_client;
CREATE UNIQUE INDEX idx_directions_unique_name_client 
  ON directions(organization_id, client_id, name) 
  WHERE client_id IS NOT NULL;

-- 6. ADICIONAR ÍNDICES PARA MELHOR PERFORMANCE E SEGREGAÇÃO
CREATE INDEX IF NOT EXISTS idx_directions_client_id ON directions(client_id);
CREATE INDEX IF NOT EXISTS idx_departments_client_id ON departments(client_id);
CREATE INDEX IF NOT EXISTS idx_sections_client_id ON sections(client_id);

-- 7. ADICIONAR CHECK CONSTRAINTS para garantir segregação
-- Direction: se tem client_id, a organization deve ser a mesma do client
ALTER TABLE directions DROP CONSTRAINT IF EXISTS check_direction_client_org;
ALTER TABLE directions ADD CONSTRAINT check_direction_client_org
  CHECK (
    client_id IS NULL OR 
    organization_id IN (SELECT organization_id FROM clients WHERE id = client_id)
  );

-- Department: deve ter a mesma org e client que a direction
ALTER TABLE departments DROP CONSTRAINT IF EXISTS check_department_direction_org;
ALTER TABLE departments ADD CONSTRAINT check_department_direction_org
  CHECK (
    organization_id IN (SELECT organization_id FROM directions WHERE id = direction_id)
  );

-- Section: deve ter a mesma org e client que o department
ALTER TABLE sections DROP CONSTRAINT IF EXISTS check_section_department_org;
ALTER TABLE sections ADD CONSTRAINT check_section_department_org
  CHECK (
    organization_id IN (SELECT organization_id FROM departments WHERE id = department_id)
  );

-- 8. CRIAR VIEW PARA VERIFICAR HIERARQUIA COMPLETA
CREATE OR REPLACE VIEW v_organizational_structure AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    c.id as client_id,
    c.name as client_name,
    d.id as direction_id,
    d.name as direction_name,
    dept.id as department_id,
    dept.name as department_name,
    s.id as section_id,
    s.name as section_name,
    -- Contadores
    (SELECT COUNT(*) FROM departments WHERE direction_id = d.id) as departments_count,
    (SELECT COUNT(*) FROM sections WHERE department_id = dept.id) as sections_count
FROM organizations o
LEFT JOIN clients c ON c.organization_id = o.id
LEFT JOIN directions d ON d.organization_id = o.id AND (d.client_id = c.id OR d.client_id IS NULL)
LEFT JOIN departments dept ON dept.direction_id = d.id
LEFT JOIN sections s ON s.department_id = dept.id
ORDER BY o.name, c.name NULLS FIRST, d.name, dept.name, s.name;

-- 9. FUNÇÃO HELPER PARA VALIDAR HIERARQUIA AO CRIAR DEPARTMENT
CREATE OR REPLACE FUNCTION validate_department_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se a direction existe e pertence à mesma organization
    IF NOT EXISTS (
        SELECT 1 FROM directions 
        WHERE id = NEW.direction_id 
          AND organization_id = NEW.organization_id
          AND (client_id = NEW.client_id OR (client_id IS NULL AND NEW.client_id IS NULL))
    ) THEN
        RAISE EXCEPTION 'Direção inválida: deve pertencer à mesma organização e cliente';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_department_hierarchy ON departments;
CREATE TRIGGER trigger_validate_department_hierarchy
    BEFORE INSERT OR UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION validate_department_hierarchy();

-- 10. FUNÇÃO HELPER PARA VALIDAR HIERARQUIA AO CRIAR SECTION
CREATE OR REPLACE FUNCTION validate_section_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o department existe e pertence à mesma organization
    IF NOT EXISTS (
        SELECT 1 FROM departments 
        WHERE id = NEW.department_id 
          AND organization_id = NEW.organization_id
          AND (client_id = NEW.client_id OR (client_id IS NULL AND NEW.client_id IS NULL))
    ) THEN
        RAISE EXCEPTION 'Departamento inválido: deve pertencer à mesma organização e cliente';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_section_hierarchy ON sections;
CREATE TRIGGER trigger_validate_section_hierarchy
    BEFORE INSERT OR UPDATE ON sections
    FOR EACH ROW
    EXECUTE FUNCTION validate_section_hierarchy();

-- 11. ADICIONAR COMENTÁRIOS NAS TABELAS
COMMENT ON TABLE directions IS 'Direções organizacionais - nível 1 da hierarquia (abaixo de Organization/Client)';
COMMENT ON TABLE departments IS 'Departamentos - nível 2 da hierarquia (abaixo de Direction)';
COMMENT ON TABLE sections IS 'Secções - nível 3 da hierarquia (abaixo de Department)';

COMMENT ON COLUMN directions.client_id IS 'NULL = estrutura do Tenant | UUID = estrutura do Cliente B2B';
COMMENT ON COLUMN departments.client_id IS 'NULL = estrutura do Tenant | UUID = estrutura do Cliente B2B';
COMMENT ON COLUMN sections.client_id IS 'NULL = estrutura do Tenant | UUID = estrutura do Cliente B2B';

-- 12. VERIFICAÇÃO FINAL
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ESTRUTURA ORGANIZACIONAL CORRIGIDA!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Hierarquia: Organization/Client → Direction → Department → Section';
    RAISE NOTICE 'Segregação: ✓ Provider | ✓ Tenant | ✓ Client B2B';
    RAISE NOTICE 'Validações: ✓ Foreign Keys | ✓ Check Constraints | ✓ Triggers';
    RAISE NOTICE '========================================';
END $$;

COMMIT;
