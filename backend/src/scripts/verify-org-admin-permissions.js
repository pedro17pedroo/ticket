/**
 * Script para verificar todas as permissões do org-admin
 * Mostra um resumo completo de todas as permissões por categoria
 */

import { setupAssociations, Permission, Role, RolePermission } from '../modules/models/index.js';

setupAssociations();

async function verifyOrgAdminPermissions() {
  console.log('🔍 Verificando permissões do org-admin\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Buscar todos os roles org-admin
    const orgAdminRoles = await Role.findAll({
      where: { name: 'org-admin', isActive: true }
    });

    console.log(`✅ Encontrados ${orgAdminRoles.length} roles org-admin\n`);

    for (const role of orgAdminRoles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Role: ${role.displayName || role.name}`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Org ID: ${role.organizationId || 'Sistema'}`);
      console.log(`${'='.repeat(60)}\n`);

      // Buscar permissões do role
      const rolePermissions = await RolePermission.findAll({
        where: { roleId: role.id, granted: true }
      });

      // Buscar detalhes das permissões
      const permissionIds = rolePermissions.map(rp => rp.permissionId);
      const permissions = await Permission.findAll({
        where: { id: permissionIds }
      });

      // Criar mapa de permissões
      const permissionMap = {};
      for (const perm of permissions) {
        permissionMap[perm.id] = perm;
      }

      // Agrupar permissões por categoria
      const permissionsByCategory = {};
      
      for (const rp of rolePermissions) {
        const perm = permissionMap[rp.permissionId];
        if (perm) {
          const category = perm.category || 'Outros';
          if (!permissionsByCategory[category]) {
            permissionsByCategory[category] = [];
          }
          permissionsByCategory[category].push({
            resource: perm.resource,
            action: perm.action,
            displayName: perm.displayName
          });
        }
      }

      // Ordenar categorias
      const sortedCategories = Object.keys(permissionsByCategory).sort();

      // Exibir permissões por categoria
      for (const category of sortedCategories) {
        console.log(`\n📂 ${category}:`);
        console.log(`${'─'.repeat(60)}`);
        
        const perms = permissionsByCategory[category].sort((a, b) => {
          if (a.resource === b.resource) {
            return a.action.localeCompare(b.action);
          }
          return a.resource.localeCompare(b.resource);
        });

        for (const perm of perms) {
          console.log(`   ✓ ${perm.resource}.${perm.action.padEnd(15)} - ${perm.displayName}`);
        }
      }

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📊 Total de permissões: ${rolePermissions.length}`);
      console.log(`📂 Total de categorias: ${sortedCategories.length}`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

verifyOrgAdminPermissions();
