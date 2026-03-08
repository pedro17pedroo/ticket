import { sequelize } from '../config/database.js';
import '../modules/models/index.js';

async function addReportsPermission() {
  try {
    console.log('🔧 Adicionando permissão de relatórios...');

    // 1. Criar permissão de relatórios se não existir
    await sequelize.query(`
      INSERT INTO permissions (resource, action, description, created_at, updated_at)
      SELECT 'reports', 'view', 'Visualizar relatórios de horas', NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM permissions 
        WHERE resource = 'reports' AND action = 'view'
      );
    `);

    console.log('✅ Permissão de relatórios criada');

    // 2. Adicionar permissão para org-admin
    const [orgAdminResult] = await sequelize.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'org-admin' 
        AND p.resource = 'reports' 
        AND p.action = 'view'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp 
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
      RETURNING *;
    `);

    console.log(`✅ Permissão adicionada para org-admin: ${orgAdminResult.length} registros`);

    // 3. Adicionar permissão para org-manager
    const [orgManagerResult] = await sequelize.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'org-manager' 
        AND p.resource = 'reports' 
        AND p.action = 'view'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp 
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
      RETURNING *;
    `);

    console.log(`✅ Permissão adicionada para org-manager: ${orgManagerResult.length} registros`);

    // 4. Verificar permissões criadas
    const [permissions] = await sequelize.query(`
      SELECT 
        r.name as role_name,
        p.resource,
        p.action,
        p.description
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.resource = 'reports'
      ORDER BY r.name;
    `);

    console.log('\n📊 Permissões de relatórios configuradas:');
    permissions.forEach(perm => {
      console.log(`  - ${perm.role_name}: ${perm.resource}.${perm.action} (${perm.description})`);
    });

    console.log('\n✅ Permissões de relatórios configuradas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar permissões:', error);
    process.exit(1);
  }
}

addReportsPermission();
