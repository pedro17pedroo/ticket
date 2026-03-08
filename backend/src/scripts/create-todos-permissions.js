/**
 * Script para criar permissões de todos (tarefas)
 */

import { setupAssociations, Permission, Role, RolePermission } from '../modules/models/index.js';

setupAssociations();

async function createTodosPermissions() {
  console.log('🔧 Criando permissões de todos (tarefas)\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Definir permissões de todos
    const todosPermissions = [
      {
        resource: 'todos',
        action: 'read',
        displayName: 'Visualizar Tarefas',
        description: 'Pode visualizar tarefas',
        scope: 'organization',
        category: 'Tarefas',
        isSystem: true
      },
      {
        resource: 'todos',
        action: 'create',
        displayName: 'Criar Tarefas',
        description: 'Pode criar novas tarefas',
        scope: 'organization',
        category: 'Tarefas',
        isSystem: true
      },
      {
        resource: 'todos',
        action: 'update',
        displayName: 'Editar Tarefas',
        description: 'Pode editar tarefas',
        scope: 'organization',
        category: 'Tarefas',
        isSystem: true
      },
      {
        resource: 'todos',
        action: 'delete',
        displayName: 'Deletar Tarefas',
        description: 'Pode deletar tarefas',
        scope: 'organization',
        category: 'Tarefas',
        isSystem: true
      }
    ];

    const createdPermissions = [];

    // Criar permissões
    for (const permData of todosPermissions) {
      // Verificar se já existe
      const existing = await Permission.findOne({
        where: {
          resource: permData.resource,
          action: permData.action
        }
      });

      if (existing) {
        console.log(`⏭️  Já existe: ${permData.resource}.${permData.action}`);
        createdPermissions.push(existing);
      } else {
        const permission = await Permission.create(permData);
        console.log(`✅ Criada: ${permData.resource}.${permData.action}`);
        createdPermissions.push(permission);
      }
    }

    console.log(`\n✅ Total de permissões: ${createdPermissions.length}\n`);

    // Adicionar permissões aos roles org-admin
    console.log('📋 Adicionando permissões aos roles org-admin...\n');

    const orgAdminRoles = await Role.findAll({
      where: { name: 'org-admin', isActive: true }
    });

    console.log(`✅ Encontrados ${orgAdminRoles.length} roles org-admin\n`);

    for (const role of orgAdminRoles) {
      console.log(`\n📋 Processando role: ${role.displayName || role.name}`);
      console.log(`   Org ID: ${role.organizationId || 'Sistema'}`);

      let addedCount = 0;

      for (const permission of createdPermissions) {
        // Verificar se já existe
        const existing = await RolePermission.findOne({
          where: {
            roleId: role.id,
            permissionId: permission.id
          }
        });

        if (!existing) {
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

createTodosPermissions();
