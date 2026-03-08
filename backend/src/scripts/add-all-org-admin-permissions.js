/**
 * Script para adicionar TODAS as permissões necessárias ao org-admin
 * Baseado no menu do portal de organização
 */

import { setupAssociations, Role, Permission, RolePermission } from '../modules/models/index.js';

setupAssociations();

async function addAllOrgAdminPermissions() {
  console.log('🔧 Adicionando TODAS as permissões ao org-admin\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Todas as permissões necessárias baseadas no Sidebar.jsx
    const allPermissions = [
      // Dashboard
      { resource: 'dashboard', action: 'view', displayName: 'Visualizar Dashboard', description: 'Pode visualizar o dashboard', scope: 'organization', category: 'Dashboard' },
      
      // Tickets
      { resource: 'tickets', action: 'view', displayName: 'Visualizar Tickets', description: 'Pode visualizar tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'create', displayName: 'Criar Tickets', description: 'Pode criar tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'update', displayName: 'Editar Tickets', description: 'Pode editar tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'delete', displayName: 'Deletar Tickets', description: 'Pode deletar tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'assign', displayName: 'Atribuir Tickets', description: 'Pode atribuir tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'close', displayName: 'Fechar Tickets', description: 'Pode fechar tickets', scope: 'organization', category: 'Tickets' },
      
      // Projetos
      { resource: 'projects', action: 'view', displayName: 'Visualizar Projetos', description: 'Pode visualizar projetos', scope: 'organization', category: 'Projetos' },
      { resource: 'projects', action: 'create', displayName: 'Criar Projetos', description: 'Pode criar projetos', scope: 'organization', category: 'Projetos' },
      { resource: 'projects', action: 'update', displayName: 'Editar Projetos', description: 'Pode editar projetos', scope: 'organization', category: 'Projetos' },
      { resource: 'projects', action: 'delete', displayName: 'Deletar Projetos', description: 'Pode deletar projetos', scope: 'organization', category: 'Projetos' },
      { resource: 'projects', action: 'manage_tasks', displayName: 'Gerenciar Tarefas', description: 'Pode gerenciar tarefas de projetos', scope: 'organization', category: 'Projetos' },
      
      // Catálogo
      { resource: 'catalog', action: 'view', displayName: 'Visualizar Catálogo', description: 'Pode visualizar o catálogo', scope: 'organization', category: 'Catálogo' },
      { resource: 'catalog', action: 'create', displayName: 'Criar Itens', description: 'Pode criar itens no catálogo', scope: 'organization', category: 'Catálogo' },
      { resource: 'catalog', action: 'update', displayName: 'Editar Itens', description: 'Pode editar itens do catálogo', scope: 'organization', category: 'Catálogo' },
      { resource: 'catalog', action: 'delete', displayName: 'Deletar Itens', description: 'Pode deletar itens do catálogo', scope: 'organization', category: 'Catálogo' },
      { resource: 'catalog', action: 'approve', displayName: 'Aprovar Solicitações', description: 'Pode aprovar solicitações de serviço', scope: 'organization', category: 'Catálogo' },
      
      // Inventário
      { resource: 'inventory', action: 'view', displayName: 'Visualizar Inventário', description: 'Pode visualizar inventário', scope: 'organization', category: 'Inventário' },
      { resource: 'inventory', action: 'create', displayName: 'Criar Inventário', description: 'Pode criar itens de inventário', scope: 'organization', category: 'Inventário' },
      { resource: 'inventory', action: 'update', displayName: 'Editar Inventário', description: 'Pode editar itens de inventário', scope: 'organization', category: 'Inventário' },
      { resource: 'inventory', action: 'delete', displayName: 'Deletar Inventário', description: 'Pode deletar itens de inventário', scope: 'organization', category: 'Inventário' },
      
      // Licenças
      { resource: 'licenses', action: 'view', displayName: 'Visualizar Licenças', description: 'Pode visualizar licenças', scope: 'organization', category: 'Inventário' },
      { resource: 'licenses', action: 'create', displayName: 'Criar Licenças', description: 'Pode criar licenças', scope: 'organization', category: 'Inventário' },
      { resource: 'licenses', action: 'update', displayName: 'Editar Licenças', description: 'Pode editar licenças', scope: 'organization', category: 'Inventário' },
      { resource: 'licenses', action: 'delete', displayName: 'Deletar Licenças', description: 'Pode deletar licenças', scope: 'organization', category: 'Inventário' },
      
      // Clientes
      { resource: 'clients', action: 'view', displayName: 'Visualizar Clientes', description: 'Pode visualizar clientes', scope: 'organization', category: 'Clientes' },
      { resource: 'clients', action: 'create', displayName: 'Criar Clientes', description: 'Pode criar clientes', scope: 'organization', category: 'Clientes' },
      { resource: 'clients', action: 'update', displayName: 'Editar Clientes', description: 'Pode editar clientes', scope: 'organization', category: 'Clientes' },
      { resource: 'clients', action: 'delete', displayName: 'Deletar Clientes', description: 'Pode deletar clientes', scope: 'organization', category: 'Clientes' },
      
      // Usuários
      { resource: 'users', action: 'view', displayName: 'Visualizar Usuários', description: 'Pode visualizar usuários', scope: 'organization', category: 'Usuários' },
      { resource: 'users', action: 'create', displayName: 'Criar Usuários', description: 'Pode criar usuários', scope: 'organization', category: 'Usuários' },
      { resource: 'users', action: 'update', displayName: 'Editar Usuários', description: 'Pode editar usuários', scope: 'organization', category: 'Usuários' },
      { resource: 'users', action: 'delete', displayName: 'Deletar Usuários', description: 'Pode deletar usuários', scope: 'organization', category: 'Usuários' },
      
      // Direções
      { resource: 'directions', action: 'view', displayName: 'Visualizar Direções', description: 'Pode visualizar direções', scope: 'organization', category: 'Estrutura' },
      { resource: 'directions', action: 'create', displayName: 'Criar Direções', description: 'Pode criar direções', scope: 'organization', category: 'Estrutura' },
      { resource: 'directions', action: 'update', displayName: 'Editar Direções', description: 'Pode editar direções', scope: 'organization', category: 'Estrutura' },
      { resource: 'directions', action: 'delete', displayName: 'Deletar Direções', description: 'Pode deletar direções', scope: 'organization', category: 'Estrutura' },
      
      // Departamentos
      { resource: 'departments', action: 'view', displayName: 'Visualizar Departamentos', description: 'Pode visualizar departamentos', scope: 'organization', category: 'Estrutura' },
      { resource: 'departments', action: 'create', displayName: 'Criar Departamentos', description: 'Pode criar departamentos', scope: 'organization', category: 'Estrutura' },
      { resource: 'departments', action: 'update', displayName: 'Editar Departamentos', description: 'Pode editar departamentos', scope: 'organization', category: 'Estrutura' },
      { resource: 'departments', action: 'delete', displayName: 'Deletar Departamentos', description: 'Pode deletar departamentos', scope: 'organization', category: 'Estrutura' },
      
      // Secções
      { resource: 'sections', action: 'view', displayName: 'Visualizar Secções', description: 'Pode visualizar secções', scope: 'organization', category: 'Estrutura' },
      { resource: 'sections', action: 'create', displayName: 'Criar Secções', description: 'Pode criar secções', scope: 'organization', category: 'Estrutura' },
      { resource: 'sections', action: 'update', displayName: 'Editar Secções', description: 'Pode editar secções', scope: 'organization', category: 'Estrutura' },
      { resource: 'sections', action: 'delete', displayName: 'Deletar Secções', description: 'Pode deletar secções', scope: 'organization', category: 'Estrutura' },
      
      // SLAs
      { resource: 'slas', action: 'view', displayName: 'Visualizar SLAs', description: 'Pode visualizar SLAs', scope: 'organization', category: 'Sistema' },
      { resource: 'slas', action: 'create', displayName: 'Criar SLAs', description: 'Pode criar SLAs', scope: 'organization', category: 'Sistema' },
      { resource: 'slas', action: 'update', displayName: 'Editar SLAs', description: 'Pode editar SLAs', scope: 'organization', category: 'Sistema' },
      { resource: 'slas', action: 'delete', displayName: 'Deletar SLAs', description: 'Pode deletar SLAs', scope: 'organization', category: 'Sistema' },
      
      // Prioridades
      { resource: 'priorities', action: 'view', displayName: 'Visualizar Prioridades', description: 'Pode visualizar prioridades', scope: 'organization', category: 'Sistema' },
      { resource: 'priorities', action: 'create', displayName: 'Criar Prioridades', description: 'Pode criar prioridades', scope: 'organization', category: 'Sistema' },
      { resource: 'priorities', action: 'update', displayName: 'Editar Prioridades', description: 'Pode editar prioridades', scope: 'organization', category: 'Sistema' },
      { resource: 'priorities', action: 'delete', displayName: 'Deletar Prioridades', description: 'Pode deletar prioridades', scope: 'organization', category: 'Sistema' },
      
      // Tipos
      { resource: 'types', action: 'view', displayName: 'Visualizar Tipos', description: 'Pode visualizar tipos', scope: 'organization', category: 'Sistema' },
      { resource: 'types', action: 'create', displayName: 'Criar Tipos', description: 'Pode criar tipos', scope: 'organization', category: 'Sistema' },
      { resource: 'types', action: 'update', displayName: 'Editar Tipos', description: 'Pode editar tipos', scope: 'organization', category: 'Sistema' },
      { resource: 'types', action: 'delete', displayName: 'Deletar Tipos', description: 'Pode deletar tipos', scope: 'organization', category: 'Sistema' },
      
      // Roles/Permissões (RBAC)
      { resource: 'roles', action: 'view', displayName: 'Visualizar Roles', description: 'Pode visualizar roles e permissões', scope: 'organization', category: 'Sistema' },
      { resource: 'roles', action: 'create', displayName: 'Criar Roles', description: 'Pode criar roles', scope: 'organization', category: 'Sistema' },
      { resource: 'roles', action: 'update', displayName: 'Editar Roles', description: 'Pode editar roles', scope: 'organization', category: 'Sistema' },
      { resource: 'roles', action: 'delete', displayName: 'Deletar Roles', description: 'Pode deletar roles', scope: 'organization', category: 'Sistema' },
      
      // Tarefas (Todos)
      { resource: 'todos', action: 'read', displayName: 'Visualizar Tarefas', description: 'Pode visualizar tarefas', scope: 'organization', category: 'Tarefas' },
      { resource: 'todos', action: 'create', displayName: 'Criar Tarefas', description: 'Pode criar tarefas', scope: 'organization', category: 'Tarefas' },
      { resource: 'todos', action: 'update', displayName: 'Editar Tarefas', description: 'Pode editar tarefas', scope: 'organization', category: 'Tarefas' },
      { resource: 'todos', action: 'delete', displayName: 'Deletar Tarefas', description: 'Pode deletar tarefas', scope: 'organization', category: 'Tarefas' },
      
      // Bolsa de Horas
      { resource: 'hours_bank', action: 'view', displayName: 'Visualizar Bolsa de Horas', description: 'Pode visualizar bolsa de horas', scope: 'organization', category: 'Outros' },
      { resource: 'hours_bank', action: 'create', displayName: 'Criar Registros', description: 'Pode criar registros de horas', scope: 'organization', category: 'Outros' },
      { resource: 'hours_bank', action: 'update', displayName: 'Editar Registros', description: 'Pode editar registros de horas', scope: 'organization', category: 'Outros' },
      { resource: 'hours_bank', action: 'delete', displayName: 'Deletar Registros', description: 'Pode deletar registros de horas', scope: 'organization', category: 'Outros' },
      
      // Relatórios
      { resource: 'reports', action: 'view', displayName: 'Visualizar Relatórios', description: 'Pode visualizar relatórios', scope: 'organization', category: 'Relatórios' },
      { resource: 'reports', action: 'export', displayName: 'Exportar Relatórios', description: 'Pode exportar relatórios', scope: 'organization', category: 'Relatórios' },
      
      // Base de Conhecimento
      { resource: 'knowledge', action: 'view', displayName: 'Visualizar Base de Conhecimento', description: 'Pode visualizar base de conhecimento', scope: 'organization', category: 'Outros' },
      { resource: 'knowledge', action: 'create', displayName: 'Criar Artigos', description: 'Pode criar artigos', scope: 'organization', category: 'Outros' },
      { resource: 'knowledge', action: 'update', displayName: 'Editar Artigos', description: 'Pode editar artigos', scope: 'organization', category: 'Outros' },
      { resource: 'knowledge', action: 'delete', displayName: 'Deletar Artigos', description: 'Pode deletar artigos', scope: 'organization', category: 'Outros' },
      
      // Tags
      { resource: 'tags', action: 'view', displayName: 'Visualizar Tags', description: 'Pode visualizar tags', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'create', displayName: 'Criar Tags', description: 'Pode criar tags', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'update', displayName: 'Editar Tags', description: 'Pode editar tags', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'delete', displayName: 'Deletar Tags', description: 'Pode deletar tags', scope: 'organization', category: 'Outros' },
      
      // Templates
      { resource: 'templates', action: 'view', displayName: 'Visualizar Templates', description: 'Pode visualizar templates', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'create', displayName: 'Criar Templates', description: 'Pode criar templates', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'update', displayName: 'Editar Templates', description: 'Pode editar templates', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'delete', displayName: 'Deletar Templates', description: 'Pode deletar templates', scope: 'organization', category: 'Outros' },
      
      // Desktop Agent
      { resource: 'desktop_agent', action: 'view', displayName: 'Visualizar Desktop Agent', description: 'Pode visualizar desktop agent', scope: 'organization', category: 'Outros' },
      
      // Configurações
      { resource: 'settings', action: 'read', displayName: 'Visualizar Configurações', description: 'Pode visualizar configurações', scope: 'organization', category: 'Sistema' },
      { resource: 'settings', action: 'update', displayName: 'Editar Configurações', description: 'Pode editar configurações', scope: 'organization', category: 'Sistema' },
    ];

    console.log(`📋 Total de permissões a processar: ${allPermissions.length}\n`);

    const createdPermissions = [];
    let newCount = 0;
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
        console.log(`⏭️  ${permData.resource}.${permData.action}`);
        createdPermissions.push(existing);
        existingCount++;
      } else {
        const permission = await Permission.create({
          ...permData,
          isSystem: true
        });
        console.log(`✅ ${permData.resource}.${permData.action}`);
        createdPermissions.push(permission);
        newCount++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Novas: ${newCount}`);
    console.log(`   ⏭️  Existentes: ${existingCount}`);
    console.log(`   📋 Total: ${createdPermissions.length}\n`);

    // Buscar todos os roles org-admin
    const orgAdminRoles = await Role.findAll({
      where: { name: 'org-admin', isActive: true }
    });

    console.log(`🔐 Adicionando permissões aos roles org-admin...\n`);
    console.log(`✅ Encontrados ${orgAdminRoles.length} roles org-admin\n`);

    for (const role of orgAdminRoles) {
      console.log(`\n📋 ${role.displayName || role.name}`);
      console.log(`   Org: ${role.organizationId || 'Sistema'}`);

      let addedCount = 0;
      let skippedCount = 0;

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
          skippedCount++;
        }
      }

      console.log(`   ✅ Adicionadas: ${addedCount}`);
      console.log(`   ⏭️  Já existiam: ${skippedCount}`);
    }

    console.log('\n✅ Processo concluído!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

addAllOrgAdminPermissions();
