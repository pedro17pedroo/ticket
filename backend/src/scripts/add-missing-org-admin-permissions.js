/**
 * Script para adicionar permissões faltantes ao org-admin
 */

import { setupAssociations, Role, Permission, RolePermission } from '../modules/models/index.js';

setupAssociations();

async function addMissingPermissions() {
  console.log('🔧 Adicionando permissões faltantes ao org-admin\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Buscar todos os roles org-admin (sistema e customizados)
    const orgAdminRoles = await Role.findAll({
      where: { name: 'org-admin', isActive: true }
    });

    console.log(`✅ Encontrados ${orgAdminRoles.length} roles org-admin\n`);

    // Permissões que devem existir (resource.action)
    const requiredPermissions = [
      { resource: 'catalog', action: 'approve' },
      { resource: 'todos', action: 'read' },
      { resource: 'todos', action: 'create' },
      { resource: 'todos', action: 'update' },
      { resource: 'todos', action: 'delete' }
    ];

    // Buscar as permissões no banco
    const permissions = [];
    for (const perm of requiredPermissions) {
      const permission = await Permission.findOne({
        where: {
          resource: perm.resource,
          action: perm.action
        }
      });
      if (permission) {
        permissions.push(permission);
      } else {
        console.log(`⚠️  Permissão não encontrada: ${perm.resource}.${perm.action}`);
      }
    }

    console.log(`✅ Encontradas ${permissions.length} permissões necessárias\n`);

    // Para cada role org-admin
    for (const role of orgAdminRoles) {
      console.log(`\n📋 Processando role: ${role.displayName || role.name}`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Org ID: ${role.organizationId || 'Sistema'}`);
      console.log('');

      let addedCount = 0;

      // Para cada permissão necessária
      for (const permission of permissions) {
        // Verificar se já existe
        const existing = await RolePermission.findOne({
          where: {
            roleId: role.id,
            permissionId: permission.id
          }
        });

        if (!existing) {
          // Adicionar permissão
          await RolePermission.create({
            roleId: role.id,
            permissionId: permission.id,
            granted: true
          });

          console.log(`   ✅ Adicionada: ${permission.resource}.${permission.action}`);
          addedCount++;
        } else {
          console.log(`   ⏭️  Já existe: ${permission.resource}.${permission.action}`);
        }
      }

      console.log(`\n   📊 Total adicionado: ${addedCount} permissões`);
    }

    console.log('\n✅ Processo concluído!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

addMissingPermissions();
