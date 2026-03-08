/**
 * Script para testar carregamento de permissões
 * Executa: node src/scripts/test-permissions-loading.js
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres',
    logging: console.log
  }
);

async function testPermissionsLoading() {
  try {
    console.log('🧪 Testando carregamento de permissões...\n');

    // Buscar usuário de teste
    const [users] = await sequelize.query(`
      SELECT id, email, role, organization_id
      FROM organization_users
      WHERE email = 'multicontext@test.com'
      LIMIT 1
    `);

    if (users.length === 0) {
      console.log('❌ Usuário de teste não encontrado');
      return;
    }

    const user = users[0];
    user.client_id = null; // organization_users não têm client_id
    console.log('👤 Usuário encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Organization ID: ${user.organization_id}`);
    console.log(`   Client ID: NULL (organization user)`);

    // Buscar role do usuário
    console.log('\n🔍 Buscando role...');
    const [roles] = await sequelize.query(`
      SELECT id, name, display_name, level, priority, organization_id, client_id
      FROM roles
      WHERE name = :roleName
        AND (
          (organization_id = :orgId AND client_id IS NULL)
          OR (organization_id IS NULL AND client_id IS NULL)
        )
      ORDER BY 
        CASE 
          WHEN organization_id IS NOT NULL THEN 1
          ELSE 2
        END
      LIMIT 1
    `, {
      replacements: {
        roleName: user.role,
        orgId: user.organization_id
      }
    });

    if (roles.length === 0) {
      console.log(`❌ Role "${user.role}" não encontrado`);
      return;
    }

    const role = roles[0];
    console.log('✅ Role encontrado:');
    console.log(`   ID: ${role.id}`);
    console.log(`   Name: ${role.name}`);
    console.log(`   Display Name: ${role.display_name}`);
    console.log(`   Level: ${role.level}`);
    console.log(`   Priority: ${role.priority}`);
    console.log(`   Organization ID: ${role.organization_id || 'NULL (global)'}`);

    // Buscar permissões do role
    console.log('\n🔍 Buscando permissões do role...');
    const [permissions] = await sequelize.query(`
      SELECT 
        p.id,
        p.resource,
        p.action,
        p.description,
        rp.granted
      FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = :roleId
        AND rp.granted = true
      ORDER BY p.resource, p.action
    `, {
      replacements: {
        roleId: role.id
      }
    });

    console.log(`✅ ${permissions.length} permissões encontradas:`);
    permissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm.resource}.${perm.action} - ${perm.description || 'Sem descrição'}`);
    });

    // Testar com Sequelize models
    console.log('\n🧪 Testando com Sequelize models...');
    
    const { Role, Permission, RolePermission } = await import('../modules/models/index.js');
    
    const roleWithPermissions = await Role.findOne({
      where: {
        name: user.role,
        organizationId: user.organization_id,
        clientId: null,
        isActive: true
      },
      include: [{
        model: Permission,
        as: 'permissions',
        through: {
          where: { granted: true },
          attributes: []
        }
      }]
    });

    if (!roleWithPermissions) {
      console.log('❌ Role não encontrado via Sequelize');
      
      // Tentar buscar role global
      console.log('\n🔍 Tentando buscar role global...');
      const globalRole = await Role.findOne({
        where: {
          name: user.role,
          organizationId: null,
          clientId: null,
          isActive: true
        },
        include: [{
          model: Permission,
          as: 'permissions',
          through: {
            where: { granted: true },
            attributes: []
          }
        }]
      });

      if (globalRole) {
        console.log('✅ Role global encontrado via Sequelize');
        console.log(`   Permissões: ${globalRole.permissions?.length || 0}`);
        if (globalRole.permissions && globalRole.permissions.length > 0) {
          globalRole.permissions.slice(0, 5).forEach((perm, index) => {
            console.log(`   ${index + 1}. ${perm.resource}.${perm.action}`);
          });
        }
      } else {
        console.log('❌ Role global também não encontrado');
      }
    } else {
      console.log('✅ Role encontrado via Sequelize');
      console.log(`   Permissões: ${roleWithPermissions.permissions?.length || 0}`);
      if (roleWithPermissions.permissions && roleWithPermissions.permissions.length > 0) {
        roleWithPermissions.permissions.slice(0, 5).forEach((perm, index) => {
          console.log(`   ${index + 1}. ${perm.resource}.${perm.action}`);
        });
      }
    }

    // Testar permissionService
    console.log('\n🧪 Testando permissionService...');
    const PermissionService = (await import('../services/permissionService.js')).default;
    const permissionService = new PermissionService();
    
    const userPermissions = await permissionService.getUserPermissions(user.id);
    console.log(`✅ PermissionService retornou ${userPermissions.length} permissões:`);
    userPermissions.slice(0, 10).forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm}`);
    });

  } catch (error) {
    console.error('❌ Erro ao testar permissões:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

testPermissionsLoading()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
