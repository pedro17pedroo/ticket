/**
 * Script para adicionar TODAS as permissões faltantes ao org-admin
 * Baseado na análise do frontend Sidebar.jsx
 */

import { setupAssociations, Permission, Role, RolePermission } from '../modules/models/index.js';

setupAssociations();

async function addAllMissingPermissions() {
  console.log('🔧 Adicionando TODAS as permissões faltantes ao org-admin\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Lista completa de permissões necessárias baseadas no frontend
    const allPermissions = [
      // Dashboard
      { resource: 'dashboard', action: 'view', displayName: 'Visualizar Dashboard', description: 'Pode visualizar o dashboard', scope: 'organization', category: 'Dashboard' },
      
      // Tickets (já existem, mas garantir)
      { resource: 'tickets', action: 'view', displayName: 'Visualizar Tickets', description: 'Pode visualizar tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'assign_all', displayName: 'Atribuir Qualquer Ticket', description: 'Pode atribuir qualquer ticket', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'assign_team', displayName: 'Atribuir Tickets da Equipe', description: 'Pode atribuir tickets da equipe', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'assign_self', displayName: 'Atribuir Tickets a Si Mesmo', description: 'Pode atribuir tickets a si mesmo', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'transfer', displayName: 'Transferir Tickets', description: 'Pode transferir tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'merge', displayName: 'Mesclar Tickets', description: 'Pode mesclar tickets', scope: 'organization', category: 'Tickets' },
      
      // Projetos
      { resource: 'projects', action: 'view', displayName: 'Visualizar Projetos', description: 'Pode visualizar projetos', scope: 'organization', category: 'Projetos' },
      
      // Catálogo (já existem, mas garantir)
      { resource: 'catalog', action: 'view', displayName: 'Visualizar Catálogo', description: 'Pode visualizar o catálogo', scope: 'organization', category: 'Catálogo' },
      
      // Inventário
      { resource: 'inventory', action: 'view', displayName: 'Visualizar Inventário', description: 'Pode visualizar inventário', scope: 'organization', category: 'Inventário' },
      { resource: 'licenses', action: 'view', displayName: 'Visualizar Licenças', description: 'Pode visualizar licenças', scope: 'organization', category: 'Inventário' },
      
      // Clientes
      { resource: 'clients', action: 'view', displayName: 'Visualizar Clientes', description: 'Pode visualizar clientes', scope: 'organization', category: 'Clientes' },
      
      // Estrutura Organizacional
      { resource: 'directions', action: 'view', displayName: 'Visualizar Direções', description: 'Pode visualizar direções', scope: 'organization', category: 'Estrutura' },
      { resource: 'departments', action: 'view', displayName: 'Visualizar Departamentos', description: 'Pode visualizar departamentos', scope: 'organization', category: 'Estrutura' },
      { resource: 'sections', action: 'view', displayName: 'Visualizar Secções', description: 'Pode visualizar secções', scope: 'organization', category: 'Estrutura' },
      
      // Sistema
      { resource: 'slas', action: 'view', displayName: 'Visualizar SLAs', description: 'Pode visualizar SLAs', scope: 'organization', category: 'Sistema' },
      { resource: 'priorities', action: 'view', displayName: 'Visualizar Prioridades', description: 'Pode visualizar prioridades', scope: 'organization', category: 'Sistema' },
      { resource: 'types', action: 'view', displayName: 'Visualizar Tipos', description: 'Pode visualizar tipos', scope: 'organization', category: 'Sistema' },
      { resource: 'roles', action: 'view', displayName: 'Visualizar Permissões (RBAC)', description: 'Pode visualizar permissões e roles', scope: 'organization', category: 'Sistema' },
      
      // Outros
      { resource: 'hours_bank', action: 'view', displayName: 'Visualizar Bolsa de Horas', description: 'Pode visualizar bolsa de horas', scope: 'organization', category: 'Outros' },
      { resource: 'knowledge', action: 'view', displayName: 'Visualizar Base de Conhecimento', description: 'Pode visualizar base de conhecimento', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'view', displayName: 'Visualizar Tags', description: 'Pode visualizar tags', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'manage', displayName: 'Gerenciar Tags', description: 'Pode gerenciar tags', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'view', displayName: 'Visualizar Templates', description: 'Pode visualizar templates', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'use', displayName: 'Usar Templates', description: 'Pode usar templates', scope: 'organization', category: 'Outros' },
      { resource: 'desktop_agent', action: 'view', displayName: 'Visualizar Desktop Agent', description: 'Pode visualizar desktop agent', scope: 'organization', category: 'Outros' },
      { resource: 'time_tracking', action: 'create', displayName: 'Registrar Tempo', description: 'Pode registrar tempo', scope: 'organization', category: 'Outros' },
      { resource: 'remote_access', action: 'request', displayName: 'Solicitar Acesso Remoto', description: 'Pode solicitar acesso remoto', scope: 'organization', category: 'Outros' },
    ];

    console.log(`📋 Total de permissões a verificar: ${allPermissions.length}\n`);

    const createdPermissions = [];
    let createdCount = 0;
    let existingCount = 0;

    // Criar ou buscar permissões
    for (const permData of allPermissions) {
      const existing = await Permission.findOne({
        where: {
          resource: permData.resource,
          action: permData.action
        }
      });

      if (existing) {
        console.log(`⏭️  Já existe: ${permData.resource}.${permData.action}`);
        createdPermissions.push(existing);
        existingCount++;
      } else {
        const permission = await Permission.create({
          ...permData,
          isSystem: true
        });
        console.log(`✅ Criada: ${permData.resource}.${permData.action}`);
        createdPermissions.push(permission);
        createdCount++;
      }
    }

    console.log(`\n📊 Resumo de permissões:`);
    console.log(`   ✅ Criadas: ${createdCount}`);
    console.log(`   ⏭️  Já existiam: ${existingCount}`);
    console.log(`   📋 Total: ${createdPermissions.length}\n`);

    // Buscar todos os roles org-admin
    const orgAdminRoles = await Role.findAll({
      where: { name: 'org-admin', isActive: true }
    });

    console.log(`✅ Encontrados ${orgAdminRoles.length} roles org-admin\n`);

    // Adicionar permissões a cada role org-admin
    for (const role of orgAdminRoles) {
      console.log(`\n📋 Processando role: ${role.displayName || role.name}`);
      console.log(`   Org ID: ${role.organizationId || 'Sistema'}`);

      let addedCount = 0;
      let alreadyExistingCount = 0;

      for (const permission of createdPermissions) {
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
          addedCount++;
        } else {
          alreadyExistingCount++;
        }
      }

      console.log(`   ✅ Adicionadas: ${addedCount} permissões`);
      console.log(`   ⏭️  Já existiam: ${alreadyExistingCount} permissões`);
      console.log(`   📊 Total: ${addedCount + alreadyExistingCount} permissões`);
    }

    console.log('\n✅ Processo concluído!\n');
    console.log('🎉 O org-admin agora tem acesso completo a todos os recursos!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

addAllMissingPermissions();
