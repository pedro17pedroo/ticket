/**
 * Script para debugar permissões do org-admin
 */

import { setupAssociations, OrganizationUser, Role, Permission, RolePermission } from '../modules/models/index.js';
import permissionService from '../services/permissionService.js';

setupAssociations();

async function debugOrgAdminPermissions() {
  console.log('🔍 Debugando permissões do org-admin\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Buscar o role org-admin
    const orgAdminRole = await Role.findOne({
      where: { name: 'org-admin' }
    });

    if (!orgAdminRole) {
      console.log('❌ Role org-admin não encontrado!\n');
      return;
    }

    console.log('✅ Role org-admin encontrado:');
    console.log(`   ID: ${orgAdminRole.id}`);
    console.log(`   Nome: ${orgAdminRole.name}`);
    console.log(`   Descrição: ${orgAdminRole.description}`);
    console.log('');

    // 2. Buscar permissões associadas ao role
    const rolePermissions = await RolePermission.findAll({
      where: { roleId: orgAdminRole.id }
    });

    console.log(`📋 Permissões do org-admin: ${rolePermissions.length}`);
    console.log('');

    // Buscar detalhes das permissões
    for (const rp of rolePermissions) {
      const permission = await Permission.findByPk(rp.permissionId);
      if (permission) {
        console.log(`   ✓ ${permission.name} - ${permission.description}`);
      }
    }
    console.log('');

    // 3. Buscar um usuário org-admin
    const orgAdmin = await OrganizationUser.findOne({
      where: { role: 'org-admin' }
    });

    if (!orgAdmin) {
      console.log('❌ Nenhum usuário org-admin encontrado!\n');
      return;
    }

    console.log('✅ Usuário org-admin encontrado:');
    console.log(`   ID: ${orgAdmin.id}`);
    console.log(`   Nome: ${orgAdmin.name}`);
    console.log(`   Email: ${orgAdmin.email}`);
    console.log(`   Organization ID: ${orgAdmin.organizationId}`);
    console.log('');

    // 4. Carregar permissões via permissionService
    console.log('🔐 Carregando permissões via permissionService...\n');
    
    const permissions = await permissionService.getUserPermissions(orgAdmin.id);
    
    console.log(`✅ Permissões carregadas: ${permissions.length}`);
    console.log('');
    
    permissions.forEach(perm => {
      console.log(`   ✓ ${perm}`);
    });
    console.log('');

    // 5. Verificar permissões específicas
    const requiredPermissions = [
      'catalog.read',
      'catalog.create',
      'catalog.update',
      'catalog.delete',
      'catalog.approve',
      'todos.read',
      'todos.create',
      'todos.update',
      'todos.delete'
    ];

    console.log('🔍 Verificando permissões necessárias:\n');
    
    for (const perm of requiredPermissions) {
      const hasPermission = await permissionService.hasPermission(orgAdmin.id, perm);
      console.log(`   ${hasPermission ? '✅' : '❌'} ${perm}`);
    }
    console.log('');

    console.log('✅ Debug concluído!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

debugOrgAdminPermissions();
