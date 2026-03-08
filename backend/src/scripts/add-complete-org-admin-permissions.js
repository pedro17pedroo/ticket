/**
 * Script COMPLETO para adicionar TODAS as permissões ao org-admin
 * Baseado na análise COMPLETA do frontend Sidebar.jsx
 * Inclui TODAS as permissões necessárias para exibir todos os menus
 */

import { setupAssociations, Permission, Role, RolePermission } from '../modules/models/index.js';

setupAssociations();

async function addCompleteOrgAdminPermissions() {
  console.log('🔧 Adicionando TODAS as permissões completas ao org-admin\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Lista COMPLETA de TODAS as permissões necessárias baseadas no frontend
    const allPermissions = [
      // Dashboard
      { resource: 'dashboard', action: 'view', displayName: 'Visualizar Dashboard', description: 'Pode visualizar o dashboard', scope: 'organization', category: 'Dashboard' },
      
      // Tickets - TODAS as permissões
      { resource: 'tickets', action: 'view', displayName: 'Visualizar Tickets', description: 'Pode visualizar tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'create', displayName: 'Criar Tickets', description: 'Pode criar tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'update', displayName: 'Atualizar Tickets', description: 'Pode atualizar tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'delete', displayName: 'Excluir Tickets', description: 'Pode excluir tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'assign_all', displayName: 'Atribuir Qualquer Ticket', description: 'Pode atribuir qualquer ticket', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'assign_team', displayName: 'Atribuir Tickets da Equipe', description: 'Pode atribuir tickets da equipe', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'assign_self', displayName: 'Atribuir Tickets a Si Mesmo', description: 'Pode atribuir tickets a si mesmo', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'transfer', displayName: 'Transferir Tickets', description: 'Pode transferir tickets', scope: 'organization', category: 'Tickets' },
      { resource: 'tickets', action: 'merge', displayName: 'Mesclar Tickets', description: 'Pode mesclar tickets', scope: 'organization', category: 'Tickets' },
      
      // Projetos - TODAS as permissões
      { resource: 'projects', action: 'view', displayName: 'Visualizar Projetos', description: 'Pode visualizar projetos', scope: 'organization', category: 'Projetos' },
      { resource: 'projects', action: 'create', displayName: 'Criar Projetos', description: 'Pode criar projetos', scope: 'organization', category: 'Projetos' },
      { resource: 'projects', action: 'update', displayName: 'Atualizar Projetos', description: 'Pode atualizar projetos', scope: 'organization', category: 'Projetos' },
      { resource: 'projects', action: 'delete', displayName: 'Excluir Projetos', description: 'Pode excluir projetos', scope: 'organization', category: 'Projetos' },
      
      // Catálogo - TODAS as permissões
      { resource: 'catalog', action: 'view', displayName: 'Visualizar Catálogo', description: 'Pode visualizar o catálogo', scope: 'organization', category: 'Catálogo' },
      { resource: 'catalog', action: 'create', displayName: 'Criar Itens no Catálogo', description: 'Pode criar itens no catálogo', scope: 'organization', category: 'Catálogo' },
      { resource: 'catalog', action: 'update', displayName: 'Atualizar Catálogo', description: 'Pode atualizar o catálogo', scope: 'organization', category: 'Catálogo' },
      { resource: 'catalog', action: 'delete', displayName: 'Excluir Itens do Catálogo', description: 'Pode excluir itens do catálogo', scope: 'organization', category: 'Catálogo' },
      { resource: 'catalog', action: 'approve', displayName: 'Aprovar Catálogo', description: 'Pode aprovar itens do catálogo', scope: 'organization', category: 'Catálogo' },
      
      // Inventário - TODAS as permissões
      { resource: 'inventory', action: 'view', displayName: 'Visualizar Inventário', description: 'Pode visualizar inventário', scope: 'organization', category: 'Inventário' },
      { resource: 'inventory', action: 'create', displayName: 'Criar Inventário', description: 'Pode criar inventário', scope: 'organization', category: 'Inventário' },
      { resource: 'inventory', action: 'update', displayName: 'Atualizar Inventário', description: 'Pode atualizar inventário', scope: 'organization', category: 'Inventário' },
      { resource: 'inventory', action: 'delete', displayName: 'Excluir Inventário', description: 'Pode excluir inventário', scope: 'organization', category: 'Inventário' },
      { resource: 'licenses', action: 'view', displayName: 'Visualizar Licenças', description: 'Pode visualizar licenças', scope: 'organization', category: 'Inventário' },
      { resource: 'licenses', action: 'create', displayName: 'Criar Licenças', description: 'Pode criar licenças', scope: 'organization', category: 'Inventário' },
      { resource: 'licenses', action: 'update', displayName: 'Atualizar Licenças', description: 'Pode atualizar licenças', scope: 'organization', category: 'Inventário' },
      { resource: 'licenses', action: 'delete', displayName: 'Excluir Licenças', description: 'Pode excluir licenças', scope: 'organization', category: 'Inventário' },
      
      // Clientes - TODAS as permissões
      { resource: 'clients', action: 'view', displayName: 'Visualizar Clientes', description: 'Pode visualizar clientes', scope: 'organization', category: 'Clientes' },
      { resource: 'clients', action: 'create', displayName: 'Criar Clientes', description: 'Pode criar clientes', scope: 'organization', category: 'Clientes' },
      { resource: 'clients', action: 'update', displayName: 'Atualizar Clientes', description: 'Pode atualizar clientes', scope: 'organization', category: 'Clientes' },
      { resource: 'clients', action: 'delete', displayName: 'Excluir Clientes', description: 'Pode excluir clientes', scope: 'organization', category: 'Clientes' },
      
      // Estrutura Organizacional - TODAS as permissões
      { resource: 'users', action: 'view', displayName: 'Visualizar Utilizadores', description: 'Pode visualizar utilizadores', scope: 'organization', category: 'Estrutura' },
      { resource: 'users', action: 'create', displayName: 'Criar Utilizadores', description: 'Pode criar utilizadores', scope: 'organization', category: 'Estrutura' },
      { resource: 'users', action: 'update', displayName: 'Atualizar Utilizadores', description: 'Pode atualizar utilizadores', scope: 'organization', category: 'Estrutura' },
      { resource: 'users', action: 'delete', displayName: 'Excluir Utilizadores', description: 'Pode excluir utilizadores', scope: 'organization', category: 'Estrutura' },
      { resource: 'directions', action: 'view', displayName: 'Visualizar Direções', description: 'Pode visualizar direções', scope: 'organization', category: 'Estrutura' },
      { resource: 'directions', action: 'create', displayName: 'Criar Direções', description: 'Pode criar direções', scope: 'organization', category: 'Estrutura' },
      { resource: 'directions', action: 'update', displayName: 'Atualizar Direções', description: 'Pode atualizar direções', scope: 'organization', category: 'Estrutura' },
      { resource: 'directions', action: 'delete', displayName: 'Excluir Direções', description: 'Pode excluir direções', scope: 'organization', category: 'Estrutura' },
      { resource: 'departments', action: 'view', displayName: 'Visualizar Departamentos', description: 'Pode visualizar departamentos', scope: 'organization', category: 'Estrutura' },
      { resource: 'departments', action: 'create', displayName: 'Criar Departamentos', description: 'Pode criar departamentos', scope: 'organization', category: 'Estrutura' },
      { resource: 'departments', action: 'update', displayName: 'Atualizar Departamentos', description: 'Pode atualizar departamentos', scope: 'organization', category: 'Estrutura' },
      { resource: 'departments', action: 'delete', displayName: 'Excluir Departamentos', description: 'Pode excluir departamentos', scope: 'organization', category: 'Estrutura' },
      { resource: 'sections', action: 'view', displayName: 'Visualizar Secções', description: 'Pode visualizar secções', scope: 'organization', category: 'Estrutura' },
      { resource: 'sections', action: 'create', displayName: 'Criar Secções', description: 'Pode criar secções', scope: 'organization', category: 'Estrutura' },
      { resource: 'sections', action: 'update', displayName: 'Atualizar Secções', description: 'Pode atualizar secções', scope: 'organization', category: 'Estrutura' },
      { resource: 'sections', action: 'delete', displayName: 'Excluir Secções', description: 'Pode excluir secções', scope: 'organization', category: 'Estrutura' },
      
      // Sistema - TODAS as permissões
      { resource: 'slas', action: 'view', displayName: 'Visualizar SLAs', description: 'Pode visualizar SLAs', scope: 'organization', category: 'Sistema' },
      { resource: 'slas', action: 'create', displayName: 'Criar SLAs', description: 'Pode criar SLAs', scope: 'organization', category: 'Sistema' },
      { resource: 'slas', action: 'update', displayName: 'Atualizar SLAs', description: 'Pode atualizar SLAs', scope: 'organization', category: 'Sistema' },
      { resource: 'slas', action: 'delete', displayName: 'Excluir SLAs', description: 'Pode excluir SLAs', scope: 'organization', category: 'Sistema' },
      { resource: 'priorities', action: 'view', displayName: 'Visualizar Prioridades', description: 'Pode visualizar prioridades', scope: 'organization', category: 'Sistema' },
      { resource: 'priorities', action: 'create', displayName: 'Criar Prioridades', description: 'Pode criar prioridades', scope: 'organization', category: 'Sistema' },
      { resource: 'priorities', action: 'update', displayName: 'Atualizar Prioridades', description: 'Pode atualizar prioridades', scope: 'organization', category: 'Sistema' },
      { resource: 'priorities', action: 'delete', displayName: 'Excluir Prioridades', description: 'Pode excluir prioridades', scope: 'organization', category: 'Sistema' },
      { resource: 'types', action: 'view', displayName: 'Visualizar Tipos', description: 'Pode visualizar tipos', scope: 'organization', category: 'Sistema' },
      { resource: 'types', action: 'create', displayName: 'Criar Tipos', description: 'Pode criar tipos', scope: 'organization', category: 'Sistema' },
      { resource: 'types', action: 'update', displayName: 'Atualizar Tipos', description: 'Pode atualizar tipos', scope: 'organization', category: 'Sistema' },
      { resource: 'types', action: 'delete', displayName: 'Excluir Tipos', description: 'Pode excluir tipos', scope: 'organization', category: 'Sistema' },
      { resource: 'roles', action: 'view', displayName: 'Visualizar Permissões (RBAC)', description: 'Pode visualizar permissões e roles', scope: 'organization', category: 'Sistema' },
      { resource: 'roles', action: 'create', displayName: 'Criar Permissões', description: 'Pode criar permissões e roles', scope: 'organization', category: 'Sistema' },
      { resource: 'roles', action: 'update', displayName: 'Atualizar Permissões', description: 'Pode atualizar permissões e roles', scope: 'organization', category: 'Sistema' },
      { resource: 'roles', action: 'delete', displayName: 'Excluir Permissões', description: 'Pode excluir permissões e roles', scope: 'organization', category: 'Sistema' },
      
      // Todos (Tarefas) - TODAS as permissões
      { resource: 'todos', action: 'view', displayName: 'Visualizar Tarefas', description: 'Pode visualizar tarefas', scope: 'organization', category: 'Tarefas' },
      { resource: 'todos', action: 'create', displayName: 'Criar Tarefas', description: 'Pode criar tarefas', scope: 'organization', category: 'Tarefas' },
      { resource: 'todos', action: 'update', displayName: 'Atualizar Tarefas', description: 'Pode atualizar tarefas', scope: 'organization', category: 'Tarefas' },
      { resource: 'todos', action: 'delete', displayName: 'Excluir Tarefas', description: 'Pode excluir tarefas', scope: 'organization', category: 'Tarefas' },
      
      // Outros - TODAS as permissões
      { resource: 'hours_bank', action: 'view', displayName: 'Visualizar Bolsa de Horas', description: 'Pode visualizar bolsa de horas', scope: 'organization', category: 'Outros' },
      { resource: 'hours_bank', action: 'create', displayName: 'Criar Bolsa de Horas', description: 'Pode criar bolsa de horas', scope: 'organization', category: 'Outros' },
      { resource: 'hours_bank', action: 'update', displayName: 'Atualizar Bolsa de Horas', description: 'Pode atualizar bolsa de horas', scope: 'organization', category: 'Outros' },
      { resource: 'hours_bank', action: 'delete', displayName: 'Excluir Bolsa de Horas', description: 'Pode excluir bolsa de horas', scope: 'organization', category: 'Outros' },
      { resource: 'reports', action: 'view', displayName: 'Visualizar Relatórios', description: 'Pode visualizar relatórios avançados', scope: 'organization', category: 'Outros' },
      { resource: 'reports', action: 'create', displayName: 'Criar Relatórios', description: 'Pode criar relatórios', scope: 'organization', category: 'Outros' },
      { resource: 'knowledge', action: 'view', displayName: 'Visualizar Base de Conhecimento', description: 'Pode visualizar base de conhecimento', scope: 'organization', category: 'Outros' },
      { resource: 'knowledge', action: 'create', displayName: 'Criar Base de Conhecimento', description: 'Pode criar base de conhecimento', scope: 'organization', category: 'Outros' },
      { resource: 'knowledge', action: 'update', displayName: 'Atualizar Base de Conhecimento', description: 'Pode atualizar base de conhecimento', scope: 'organization', category: 'Outros' },
      { resource: 'knowledge', action: 'delete', displayName: 'Excluir Base de Conhecimento', description: 'Pode excluir base de conhecimento', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'view', displayName: 'Visualizar Tags', description: 'Pode visualizar tags', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'manage', displayName: 'Gerenciar Tags', description: 'Pode gerenciar tags', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'create', displayName: 'Criar Tags', description: 'Pode criar tags', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'update', displayName: 'Atualizar Tags', description: 'Pode atualizar tags', scope: 'organization', category: 'Outros' },
      { resource: 'tags', action: 'delete', displayName: 'Excluir Tags', description: 'Pode excluir tags', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'view', displayName: 'Visualizar Templates', description: 'Pode visualizar templates', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'use', displayName: 'Usar Templates', description: 'Pode usar templates', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'create', displayName: 'Criar Templates', description: 'Pode criar templates', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'update', displayName: 'Atualizar Templates', description: 'Pode atualizar templates', scope: 'organization', category: 'Outros' },
      { resource: 'templates', action: 'delete', displayName: 'Excluir Templates', description: 'Pode excluir templates', scope: 'organization', category: 'Outros' },
      { resource: 'desktop_agent', action: 'view', displayName: 'Visualizar Desktop Agent', description: 'Pode visualizar desktop agent', scope: 'organization', category: 'Outros' },
      { resource: 'desktop_agent', action: 'manage', displayName: 'Gerenciar Desktop Agent', description: 'Pode gerenciar desktop agent', scope: 'organization', category: 'Outros' },
      { resource: 'time_tracking', action: 'create', displayName: 'Registrar Tempo', description: 'Pode registrar tempo', scope: 'organization', category: 'Outros' },
      { resource: 'time_tracking', action: 'view', displayName: 'Visualizar Tempo', description: 'Pode visualizar tempo', scope: 'organization', category: 'Outros' },
      { resource: 'remote_access', action: 'request', displayName: 'Solicitar Acesso Remoto', description: 'Pode solicitar acesso remoto', scope: 'organization', category: 'Outros' },
      { resource: 'remote_access', action: 'manage', displayName: 'Gerenciar Acesso Remoto', description: 'Pode gerenciar acesso remoto', scope: 'organization', category: 'Outros' },
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
    console.log('🎉 O org-admin agora tem acesso COMPLETO a TODOS os recursos!\n');
    console.log('⚠️  IMPORTANTE: O utilizador deve fazer logout e login novamente para obter o novo token com as permissões atualizadas!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

addCompleteOrgAdminPermissions();
