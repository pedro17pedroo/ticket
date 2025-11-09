-- Seed for Priorities and Types
-- Get organization ID
DO $$
DECLARE
  org_id UUID;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'empresa-demo' LIMIT 1;
  
  -- Insert Priorities
  INSERT INTO priorities (id, organization_id, name, level, color, "order", is_active, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), org_id, 'Urgente', 1, '#EF4444', 1, true, NOW(), NOW()),
    (gen_random_uuid(), org_id, 'Alta', 2, '#F59E0B', 2, true, NOW(), NOW()),
    (gen_random_uuid(), org_id, 'Média', 3, '#3B82F6', 3, true, NOW(), NOW()),
    (gen_random_uuid(), org_id, 'Baixa', 4, '#10B981', 4, true, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  -- Delete existing types first
  DELETE FROM types WHERE organization_id = org_id;
  
  -- Insert Types
  INSERT INTO types (id, organization_id, name, description, icon, color, "order", is_active, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), org_id, 'Incidente', 'Problema que afeta ou pode afetar o serviço', 'AlertTriangle', '#EF4444', 1, true, NOW(), NOW()),
    (gen_random_uuid(), org_id, 'Solicitação', 'Pedido de serviço ou informação', 'HelpCircle', '#3B82F6', 2, true, NOW(), NOW()),
    (gen_random_uuid(), org_id, 'Mudança', 'Alteração planejada no ambiente', 'Settings', '#F59E0B', 3, true, NOW(), NOW()),
    (gen_random_uuid(), org_id, 'Problema', 'Causa raiz de um ou mais incidentes', 'AlertCircle', '#8B5CF6', 4, true, NOW(), NOW());
  
  RAISE NOTICE 'Seed concluído com sucesso!';
END $$;
