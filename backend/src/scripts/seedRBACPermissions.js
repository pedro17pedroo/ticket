import { sequelize } from '../config/database.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import logger from '../config/logger.js';

/**
 * Script para popular permissões e roles do sistema RBAC
 * Executar: node src/scripts/seedRBACPermissions.js
 */

// Definir todas as permissões do sistema
const PERMISSIONS = [
  // Dashboard
  { resource: 'dashboard', action: 'view', displayName: 'Ver Dashboard', category: 'Dashboard', scope: 'organization' },
  
  // Tickets
  { resource: 'tickets', action: 'view', displayName: 'Ver Tickets', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'create', displayName: 'Criar Tickets', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'update', displayName: 'Atualizar Tickets', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'delete', displayName: 'Deletar Tickets', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'assign', displayName: 'Atribuir Tickets', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'close', displayName: 'Fechar Tickets', category: 'Tickets', scope: 'organization' },
  
  // Comments
  { resource: 'comments', action: 'view', displayName: 'Ver Comentários', category: 'Tickets', scope: 'organization' },
  { resource: 'comments', action: 'create', displayName: 'Criar Comentários', category: 'Tickets', scope: 'organization' },
  { resource: 'comments', action: 'create_internal', displayName: 'Criar Comentários Internos', category: 'Tickets', scope: 'organization' },
  
  // Users
  { resource: 'users', action: 'view', displayName: 'Ver Utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'create', displayName: 'Criar Utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'update', displayName: 'Atualizar Utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'delete', displayName: 'Deletar Utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'reset_password', displayName: 'Resetar Senha', category: 'Utilizadores', scope: 'organization' },
  
  // Clients
  { resource: 'clients', action: 'view', displayName: 'Ver Clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'clients', action: 'create', displayName: 'Criar Clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'clients', action: 'update', displayName: 'Atualizar Clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'clients', action: 'delete', displayName: 'Deletar Clientes', category: 'Clientes', scope: 'organization' },
  
  // Client Users
  { resource: 'client_users', action: 'view', displayName: 'Ver Utilizadores de Clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'client_users', action: 'create', displayName: 'Criar Utilizadores de Clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'client_users', action: 'update', displayName: 'Atualizar Utilizadores de Clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'client_users', action: 'delete', displayName: 'Deletar Utilizadores de Clientes', category: 'Clientes', scope: 'organization' },
  
  // Directions
  { resource: 'directions', action: 'view', displayName: 'Ver Direções', category: 'Estrutura', scope: 'organization' },
  { resource: 'directions', action: 'create', displayName: 'Criar Direções', category: 'Estrutura', scope: 'organization' },
  { resource: 'directions', action: 'update', displayName: 'Atualizar Direções', category: 'Estrutura', scope: 'organization' },
  { resource: 'directions', action: 'delete', displayName: 'Deletar Direções', category: 'Estrutura', scope: 'organization' },
  
  // Departments
  { resource: 'departments', action: 'view', displayName: 'Ver Departamentos', category: 'Estrutura', scope: 'organization' },
  { resource: 'departments', action: 'create', displayName: 'Criar Departamentos', category: 'Estrutura', scope: 'organization' },
  { resource: 'departments', action: 'update', displayName: 'Atualizar Departamentos', category: 'Estrutura', scope: 'organization' },
  { resource: 'departments', action: 'delete', displayName: 'Deletar Departamentos', category: 'Estrutura', scope: 'organization' },
  
  // Sections
  { resource: 'sections', action: 'view', displayName: 'Ver Secções', category: 'Estrutura', scope: 'organization' },
  { resource: 'sections', action: 'create', displayName: 'Criar Secções', category: 'Estrutura', scope: 'organization' },
  { resource: 'sections', action: 'update', displayName: 'Atualizar Secções', category: 'Estrutura', scope: 'organization' },
  { resource: 'sections', action: 'delete', displayName: 'Deletar Secções', category: 'Estrutura', scope: 'organization' },
  
  // Catalog
  { resource: 'catalog', action: 'view', displayName: 'Ver Catálogo', category: 'Catálogo', scope: 'organization' },
  { resource: 'catalog', action: 'manage', displayName: 'Gerir Catálogo', category: 'Catálogo', scope: 'organization' },
  { resource: 'catalog', action: 'approve', displayName: 'Aprovar Solicitações', category: 'Catálogo', scope: 'organization' },
  
  // Assets/Inventory
  { resource: 'assets', action: 'view', displayName: 'Ver Inventário', category: 'Inventário', scope: 'organization' },
  { resource: 'assets', action: 'create', displayName: 'Criar Ativos', category: 'Inventário', scope: 'organization' },
  { resource: 'assets', action: 'update', displayName: 'Atualizar Ativos', category: 'Inventário', scope: 'organization' },
  { resource: 'assets', action: 'delete', displayName: 'Deletar Ativos', category: 'Inventário', scope: 'organization' },
  
  // Knowledge
  { resource: 'knowledge', action: 'view', displayName: 'Ver Base de Conhecimento', category: 'Conhecimento', scope: 'organization' },
  { resource: 'knowledge', action: 'create', displayName: 'Criar Artigos', category: 'Conhecimento', scope: 'organization' },
  { resource: 'knowledge', action: 'update', displayName: 'Atualizar Artigos', category: 'Conhecimento', scope: 'organization' },
  { resource: 'knowledge', action: 'delete', displayName: 'Deletar Artigos', category: 'Conhecimento', scope: 'organization' },
  
  // Hours Bank
  { resource: 'hours_bank', action: 'view', displayName: 'Ver Bolsa de Horas', category: 'Horas', scope: 'organization' },
  { resource: 'hours_bank', action: 'manage', displayName: 'Gerir Bolsa de Horas', category: 'Horas', scope: 'organization' },
  { resource: 'hours_bank', action: 'consume', displayName: 'Consumir Horas', category: 'Horas', scope: 'organization' },
  
  // Time Tracking
  { resource: 'time_tracking', action: 'view', displayName: 'Ver Tempo de Trabalho', category: 'Horas', scope: 'organization' },
  { resource: 'time_tracking', action: 'create', displayName: 'Registrar Tempo de Trabalho', category: 'Horas', scope: 'organization' },
  { resource: 'time_tracking', action: 'update', displayName: 'Atualizar Tempo de Trabalho', category: 'Horas', scope: 'organization' },
  { resource: 'time_tracking', action: 'delete', displayName: 'Deletar Tempo de Trabalho', category: 'Horas', scope: 'organization' },
  
  // Reports
  { resource: 'reports', action: 'view', displayName: 'Ver Relatórios', category: 'Relatórios', scope: 'organization' },
  { resource: 'reports', action: 'export', displayName: 'Exportar Relatórios', category: 'Relatórios', scope: 'organization' },
  
  // Settings
  { resource: 'settings', action: 'view', displayName: 'Ver Configurações', category: 'Sistema', scope: 'organization' },
  { resource: 'settings', action: 'manage_sla', displayName: 'Gerir SLAs', category: 'Sistema', scope: 'organization' },
  { resource: 'settings', action: 'manage_roles', displayName: 'Gerir Roles', category: 'Sistema', scope: 'organization' },
  
  // Tags
  { resource: 'tags', action: 'view', displayName: 'Ver Tags', category: 'Sistema', scope: 'organization' },
  { resource: 'tags', action: 'create', displayName: 'Criar Tags', category: 'Sistema', scope: 'organization' },
  { resource: 'tags', action: 'update', displayName: 'Atualizar Tags', category: 'Sistema', scope: 'organization' },
  { resource: 'tags', action: 'delete', displayName: 'Deletar Tags', category: 'Sistema', scope: 'organization' },
  
  // Templates
  { resource: 'templates', action: 'view', displayName: 'Ver Templates', category: 'Sistema', scope: 'organization' },
  { resource: 'templates', action: 'create', displayName: 'Criar Templates', category: 'Sistema', scope: 'organization' },
  { resource: 'templates', action: 'update', displayName: 'Atualizar Templates', category: 'Sistema', scope: 'organization' },
  { resource: 'templates', action: 'delete', displayName: 'Deletar Templates', category: 'Sistema', scope: 'organization' },
  
  // Desktop Agent
  { resource: 'desktop_agent', action: 'view', displayName: 'Ver Desktop Agent', category: 'Sistema', scope: 'organization' },
  { resource: 'desktop_agent', action: 'manage', displayName: 'Gerir Desktop Agent', category: 'Sistema', scope: 'organization' },
  
  // Projects
  { resource: 'projects', action: 'view', displayName: 'Ver Projetos', category: 'Projetos', scope: 'organization' },
  { resource: 'projects', action: 'create', displayName: 'Criar Projetos', category: 'Projetos', scope: 'organization' },
  { resource: 'projects', action: 'update', displayName: 'Atualizar Projetos', category: 'Projetos', scope: 'organization' },
  { resource: 'projects', action: 'delete', displayName: 'Deletar Projetos', category: 'Projetos', scope: 'organization' },
  
  // Project Tasks
  { resource: 'project_tasks', action: 'view', displayName: 'Ver Tarefas', category: 'Projetos', scope: 'organization' },
  { resource: 'project_tasks', action: 'create', displayName: 'Criar Tarefas', category: 'Projetos', scope: 'organization' },
  { resource: 'project_tasks', action: 'update', displayName: 'Atualizar Tarefas', category: 'Projetos', scope: 'organization' },
  { resource: 'project_tasks', action: 'delete', displayName: 'Deletar Tarefas', category: 'Projetos', scope: 'organization' },
  
  // Project Stakeholders
  { resource: 'project_stakeholders', action: 'manage', displayName: 'Gerir Stakeholders', category: 'Projetos', scope: 'organization' },
];

// Definir roles do sistema
const ROLES = [
  {
    name: 'org-admin',
    displayName: 'Administrador da Organização',
    description: 'Acesso total à organização',
    level: 'organization',
    isSystem: true,
    priority: 1000,
    permissions: '*' // Todas as permissões
  },
  {
    name: 'org-manager',
    displayName: 'Gestor',
    description: 'Gestão de equipes e tickets',
    level: 'organization',
    isSystem: true,
    priority: 700,
    permissions: [
      'dashboard.view',
      'tickets.*',
      'comments.*',
      'clients.*',
      'users.view', 'users.create', 'users.update', 'users.reset_password',
      'client_users.*',
      'directions.*',
      'departments.*',
      'sections.*',
      'catalog.*',
      'assets.*',
      'knowledge.*',
      'hours_bank.*',
      'time_tracking.*',
      'reports.*',
      'settings.view',
      'tags.view',
      'templates.view',
      'desktop_agent.view',
      'projects.*',
      'project_tasks.*',
      'project_stakeholders.manage',
    ]
  },
  {
    name: 'agent',
    displayName: 'Agente',
    description: 'Atendimento de tickets',
    level: 'organization',
    isSystem: true,
    priority: 500,
    permissions: [
      'dashboard.view',
      'tickets.view', 'tickets.create', 'tickets.update', 'tickets.assign', 'tickets.close',
      'comments.create', 'comments.create_internal', 'comments.view',
      'clients.view',
      'users.view',
      'directions.view',
      'departments.view',
      'sections.view',
      'catalog.view',
      'assets.view',
      'knowledge.view', 'knowledge.create', 'knowledge.update',
      'hours_bank.view', 'hours_bank.consume',
      'time_tracking.*',
      'reports.view',
      'tags.view',
      'templates.view',
      'desktop_agent.view',
      'projects.view',
      'project_tasks.view', 'project_tasks.update',
    ]
  },
  {
    name: 'technician',
    displayName: 'Técnico',
    description: 'Suporte técnico e inventário',
    level: 'organization',
    isSystem: true,
    priority: 400,
    permissions: [
      'dashboard.view',
      'tickets.view', 'tickets.update',
      'comments.create', 'comments.view',
      'clients.view',
      'users.view',
      'directions.view',
      'departments.view',
      'sections.view',
      'catalog.view',
      'assets.*',
      'knowledge.view', 'knowledge.create',
      'hours_bank.view', 'hours_bank.consume',
      'time_tracking.*',
      'tags.view',
      'templates.view',
      'desktop_agent.view',
      'projects.view',
      'project_tasks.view', 'project_tasks.update',
    ]
  },
];

async function seedRBACPermissions() {
  try {
    logger.info('🌱 Iniciando seed de permissões RBAC...');
    
    // 1. Criar permissões
    logger.info('📝 Criando permissões...');
    const createdPermissions = {};
    
    for (const perm of PERMISSIONS) {
      const [permission, created] = await Permission.findOrCreate({
        where: { resource: perm.resource, action: perm.action },
        defaults: {
          ...perm,
          isSystem: true
        }
      });
      
      createdPermissions[`${perm.resource}.${perm.action}`] = permission;
      
      if (created) {
        logger.info(`  ✅ Criada: ${perm.resource}.${perm.action}`);
      } else {
        logger.info(`  ⏭️  Já existe: ${perm.resource}.${perm.action}`);
      }
    }
    
    logger.info(`✅ ${Object.keys(createdPermissions).length} permissões processadas`);
    
    // 2. Criar roles
    logger.info('👥 Criando roles...');
    
    for (const roleData of ROLES) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name, organizationId: null },
        defaults: {
          displayName: roleData.displayName,
          description: roleData.description,
          level: roleData.level,
          isSystem: roleData.isSystem,
          priority: roleData.priority,
          organizationId: null,
          clientId: null
        }
      });
      
      if (created) {
        logger.info(`  ✅ Criado role: ${roleData.name}`);
      } else {
        logger.info(`  ⏭️  Role já existe: ${roleData.name}`);
      }
      
      // 3. Associar permissões ao role
      if (roleData.permissions === '*') {
        // Admin tem todas as permissões
        logger.info(`  🔑 Associando TODAS as permissões ao role ${roleData.name}...`);
        
        for (const permKey of Object.keys(createdPermissions)) {
          const permission = createdPermissions[permKey];
          
          await RolePermission.findOrCreate({
            where: {
              roleId: role.id,
              permissionId: permission.id
            },
            defaults: {
              roleId: role.id,
              permissionId: permission.id,
              granted: true
            }
          });
        }
        
        logger.info(`  ✅ ${Object.keys(createdPermissions).length} permissões associadas`);
      } else {
        // Associar permissões específicas
        logger.info(`  🔑 Associando ${roleData.permissions.length} permissões ao role ${roleData.name}...`);
        
        for (const permString of roleData.permissions) {
          // Verificar se é wildcard (ex: 'tickets.*')
          if (permString.endsWith('.*')) {
            const resource = permString.replace('.*', '');
            
            // Buscar todas as permissões desse recurso
            const resourcePermissions = Object.entries(createdPermissions)
              .filter(([key]) => key.startsWith(`${resource}.`))
              .map(([, perm]) => perm);
            
            for (const permission of resourcePermissions) {
              await RolePermission.findOrCreate({
                where: {
                  roleId: role.id,
                  permissionId: permission.id
                },
                defaults: {
                  roleId: role.id,
                  permissionId: permission.id,
                  granted: true
                }
              });
            }
          } else {
            // Permissão específica
            const permission = createdPermissions[permString];
            
            if (permission) {
              await RolePermission.findOrCreate({
                where: {
                  roleId: role.id,
                  permissionId: permission.id
                },
                defaults: {
                  roleId: role.id,
                  permissionId: permission.id,
                  granted: true
                }
              });
            } else {
              logger.warn(`  ⚠️  Permissão não encontrada: ${permString}`);
            }
          }
        }
        
        logger.info(`  ✅ Permissões associadas ao role ${roleData.name}`);
      }
    }
    
    logger.info('✅ Seed de RBAC concluído com sucesso!');
    logger.info('');
    logger.info('📊 Resumo:');
    logger.info(`  - ${Object.keys(createdPermissions).length} permissões`);
    logger.info(`  - ${ROLES.length} roles`);
    logger.info('');
    logger.info('🎯 Próximos passos:');
    logger.info('  1. Reiniciar o backend');
    logger.info('  2. Fazer login novamente para carregar as permissões');
    logger.info('  3. Verificar o menu lateral (deve filtrar por permissões)');
    
  } catch (error) {
    logger.error('❌ Erro ao fazer seed de RBAC:', error);
    throw error;
  }
}

// Executar seed
seedRBACPermissions()
  .then(() => {
    logger.info('✅ Script concluído');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Erro fatal:', error);
    process.exit(1);
  });
