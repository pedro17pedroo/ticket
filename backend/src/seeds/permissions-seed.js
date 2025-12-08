import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database.js';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import RolePermission from '../models/RolePermission.js';
import logger from '../config/logger.js';

// Definir todas as permissões do sistema
const PERMISSIONS = [
  // ==================== TICKETS ====================
  { resource: 'tickets', action: 'create', displayName: 'Criar Tickets', description: 'Criar novos tickets', category: 'Tickets', scope: 'own' },
  { resource: 'tickets', action: 'read', displayName: 'Ver Tickets', description: 'Visualizar tickets', category: 'Tickets', scope: 'own' },
  { resource: 'tickets', action: 'read_all', displayName: 'Ver Todos os Tickets', description: 'Visualizar todos os tickets da organização', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'update', displayName: 'Editar Tickets', description: 'Editar tickets próprios', category: 'Tickets', scope: 'own' },
  { resource: 'tickets', action: 'update_all', displayName: 'Editar Todos os Tickets', description: 'Editar qualquer ticket', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'delete', displayName: 'Eliminar Tickets', description: 'Eliminar tickets', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'assign', displayName: 'Atribuir Tickets', description: 'Atribuir tickets a agentes', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'close', displayName: 'Fechar Tickets', description: 'Fechar tickets resolvidos', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'reopen', displayName: 'Reabrir Tickets', description: 'Reabrir tickets fechados', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'merge', displayName: 'Fundir Tickets', description: 'Fundir tickets duplicados', category: 'Tickets', scope: 'organization' },
  { resource: 'tickets', action: 'export', displayName: 'Exportar Tickets', description: 'Exportar relatórios de tickets', category: 'Tickets', scope: 'organization' },
  
  // ==================== COMMENTS ====================
  { resource: 'comments', action: 'create', displayName: 'Comentar', description: 'Adicionar comentários aos tickets', category: 'Tickets', scope: 'own' },
  { resource: 'comments', action: 'create_internal', displayName: 'Notas Internas', description: 'Criar notas internas (não visíveis ao cliente)', category: 'Tickets', scope: 'organization' },
  { resource: 'comments', action: 'read', displayName: 'Ver Comentários', description: 'Ver comentários dos tickets', category: 'Tickets', scope: 'own' },
  { resource: 'comments', action: 'update', displayName: 'Editar Comentários', description: 'Editar comentários próprios', category: 'Tickets', scope: 'own' },
  { resource: 'comments', action: 'delete', displayName: 'Eliminar Comentários', description: 'Eliminar comentários', category: 'Tickets', scope: 'organization' },
  
  // ==================== USERS ====================
  { resource: 'users', action: 'create', displayName: 'Criar Utilizadores', description: 'Criar novos utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'read', displayName: 'Ver Utilizadores', description: 'Ver lista de utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'update', displayName: 'Editar Utilizadores', description: 'Editar utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'delete', displayName: 'Eliminar Utilizadores', description: 'Eliminar utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'manage_roles', displayName: 'Gerir Roles', description: 'Atribuir e alterar roles de utilizadores', category: 'Utilizadores', scope: 'organization' },
  { resource: 'users', action: 'reset_password', displayName: 'Redefinir Senha', description: 'Redefinir senhas de utilizadores', category: 'Utilizadores', scope: 'organization' },
  
  // ==================== CLIENT USERS ====================
  { resource: 'client_users', action: 'create', displayName: 'Criar Utilizadores do Cliente', description: 'Criar utilizadores da empresa cliente', category: 'Clientes', scope: 'client' },
  { resource: 'client_users', action: 'read', displayName: 'Ver Utilizadores do Cliente', description: 'Ver utilizadores da empresa cliente', category: 'Clientes', scope: 'client' },
  { resource: 'client_users', action: 'update', displayName: 'Editar Utilizadores do Cliente', description: 'Editar utilizadores da empresa cliente', category: 'Clientes', scope: 'client' },
  { resource: 'client_users', action: 'delete', displayName: 'Eliminar Utilizadores do Cliente', description: 'Eliminar utilizadores da empresa cliente', category: 'Clientes', scope: 'client' },

  // ==================== CLIENTES B2B ====================
  { resource: 'clients', action: 'read', displayName: 'Ver Clientes B2B', description: 'Visualizar empresas clientes da organização', category: 'Clientes', scope: 'organization' },
  { resource: 'clients', action: 'create', displayName: 'Criar Clientes B2B', description: 'Registar novas empresas clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'clients', action: 'update', displayName: 'Editar Clientes B2B', description: 'Atualizar dados das empresas clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'clients', action: 'delete', displayName: 'Desativar Clientes B2B', description: 'Desativar ou remover empresas clientes', category: 'Clientes', scope: 'organization' },
  { resource: 'clients', action: 'activate', displayName: 'Reativar Clientes B2B', description: 'Reativar empresas clientes suspensas', category: 'Clientes', scope: 'organization' },
  
  // ==================== ORGANIZATION STRUCTURE ====================
  { resource: 'directions', action: 'create', displayName: 'Criar Direções', description: 'Criar direções organizacionais', category: 'Estrutura', scope: 'client' },
  { resource: 'directions', action: 'read', displayName: 'Ver Direções', description: 'Ver direções organizacionais', category: 'Estrutura', scope: 'client' },
  { resource: 'directions', action: 'update', displayName: 'Editar Direções', description: 'Editar direções organizacionais', category: 'Estrutura', scope: 'client' },
  { resource: 'directions', action: 'delete', displayName: 'Eliminar Direções', description: 'Eliminar direções organizacionais', category: 'Estrutura', scope: 'client' },
  
  { resource: 'departments', action: 'create', displayName: 'Criar Departamentos', description: 'Criar departamentos', category: 'Estrutura', scope: 'client' },
  { resource: 'departments', action: 'read', displayName: 'Ver Departamentos', description: 'Ver departamentos', category: 'Estrutura', scope: 'client' },
  { resource: 'departments', action: 'update', displayName: 'Editar Departamentos', description: 'Editar departamentos', category: 'Estrutura', scope: 'client' },
  { resource: 'departments', action: 'delete', displayName: 'Eliminar Departamentos', description: 'Eliminar departamentos', category: 'Estrutura', scope: 'client' },
  
  { resource: 'sections', action: 'create', displayName: 'Criar Secções', description: 'Criar secções', category: 'Estrutura', scope: 'client' },
  { resource: 'sections', action: 'read', displayName: 'Ver Secções', description: 'Ver secções', category: 'Estrutura', scope: 'client' },
  { resource: 'sections', action: 'update', displayName: 'Editar Secções', description: 'Editar secções', category: 'Estrutura', scope: 'client' },
  { resource: 'sections', action: 'delete', displayName: 'Eliminar Secções', description: 'Eliminar secções', category: 'Estrutura', scope: 'client' },
  
  // ==================== REPORTS ====================
  { resource: 'reports', action: 'view', displayName: 'Ver Relatórios', description: 'Visualizar dashboards e relatórios', category: 'Relatórios', scope: 'organization' },
  { resource: 'reports', action: 'export', displayName: 'Exportar Relatórios', description: 'Exportar relatórios e dados', category: 'Relatórios', scope: 'organization' },
  { resource: 'reports', action: 'create', displayName: 'Criar Relatórios', description: 'Criar relatórios personalizados', category: 'Relatórios', scope: 'organization' },
  
  // ==================== KNOWLEDGE BASE ====================
  { resource: 'knowledge', action: 'read', displayName: 'Ver Base de Conhecimento', description: 'Visualizar artigos da base de conhecimento', category: 'Conhecimento', scope: 'global' },
  { resource: 'knowledge', action: 'create', displayName: 'Criar Artigos', description: 'Criar novos artigos', category: 'Conhecimento', scope: 'organization' },
  { resource: 'knowledge', action: 'update', displayName: 'Editar Artigos', description: 'Editar artigos existentes', category: 'Conhecimento', scope: 'organization' },
  { resource: 'knowledge', action: 'delete', displayName: 'Eliminar Artigos', description: 'Eliminar artigos', category: 'Conhecimento', scope: 'organization' },
  { resource: 'knowledge', action: 'publish', displayName: 'Publicar Artigos', description: 'Publicar/despublicar artigos', category: 'Conhecimento', scope: 'organization' },
  
  // ==================== CATALOG ====================
  { resource: 'catalog', action: 'read', displayName: 'Ver Catálogo', description: 'Visualizar catálogo de serviços', category: 'Catálogo', scope: 'global' },
  { resource: 'catalog', action: 'request', displayName: 'Solicitar Serviços', description: 'Solicitar serviços do catálogo', category: 'Catálogo', scope: 'own' },
  { resource: 'catalog', action: 'manage', displayName: 'Gerir Catálogo', description: 'Criar/editar serviços no catálogo', category: 'Catálogo', scope: 'organization' },
  
  // ==================== ASSETS ====================
  { resource: 'assets', action: 'read', displayName: 'Ver Equipamentos', description: 'Ver equipamentos próprios', category: 'Equipamentos', scope: 'own' },
  { resource: 'assets', action: 'read_all', displayName: 'Ver Todos os Equipamentos', description: 'Ver todos os equipamentos', category: 'Equipamentos', scope: 'organization' },
  { resource: 'assets', action: 'create', displayName: 'Criar Equipamentos', description: 'Registar novos equipamentos', category: 'Equipamentos', scope: 'organization' },
  { resource: 'assets', action: 'update', displayName: 'Editar Equipamentos', description: 'Editar equipamentos', category: 'Equipamentos', scope: 'organization' },
  { resource: 'assets', action: 'delete', displayName: 'Eliminar Equipamentos', description: 'Eliminar equipamentos', category: 'Equipamentos', scope: 'organization' },
  
  // ==================== HOURS BANK ====================
  { resource: 'hours_bank', action: 'view', displayName: 'Ver Bolsa de Horas', description: 'Ver saldo de horas', category: 'Horas', scope: 'client' },
  { resource: 'hours_bank', action: 'manage', displayName: 'Gerir Bolsa de Horas', description: 'Adicionar/remover horas', category: 'Horas', scope: 'organization' },
  { resource: 'hours_bank', action: 'consume', displayName: 'Consumir Horas', description: 'Consumir horas em tickets', category: 'Horas', scope: 'organization' },
  
  // ==================== SETTINGS ====================
  { resource: 'settings', action: 'view', displayName: 'Ver Configurações', description: 'Ver configurações do sistema', category: 'Configurações', scope: 'organization' },
  { resource: 'settings', action: 'update', displayName: 'Alterar Configurações', description: 'Alterar configurações do sistema', category: 'Configurações', scope: 'organization' },
  { resource: 'settings', action: 'manage_roles', displayName: 'Gerir Roles e Permissões', description: 'Criar e editar roles e permissões', category: 'Configurações', scope: 'organization' },
  { resource: 'settings', action: 'manage_sla', displayName: 'Gerir SLAs', description: 'Configurar SLAs e prioridades', category: 'Configurações', scope: 'organization' },
];

// Definir roles padrão do sistema
const SYSTEM_ROLES = [
  // ==================== NÍVEL 1: ORGANIZAÇÃO ====================
  {
    name: 'org-admin',
    displayName: 'Administrador da Organização',
    description: 'Acesso total ao sistema. Pode gerir tudo.',
    level: 'organization',
    isSystem: true,
    priority: 1000,
    permissions: '*' // Todas as permissões
  },
  {
    name: 'gerente',
    displayName: 'Gerente',
    description: 'Supervisiona agentes e pode gerir tickets, utilizadores e relatórios.',
    level: 'organization',
    isSystem: true,
    priority: 800,
    permissions: [
      'tickets.*', 'comments.*', 'users.read', 'users.update', 'users.reset_password',
      'reports.*', 'knowledge.*', 'catalog.manage', 'assets.*', 'hours_bank.*',
      'settings.view'
    ]
  },
  {
    name: 'supervisor',
    displayName: 'Supervisor',
    description: 'Supervisiona agentes e pode gerir tickets.',
    level: 'organization',
    isSystem: true,
    priority: 700,
    permissions: [
      'tickets.*', 'comments.*', 'users.read', 'reports.view', 'reports.export',
      'knowledge.read', 'knowledge.create', 'knowledge.update',
      'assets.read_all', 'assets.update'
    ]
  },
  {
    name: 'agente',
    displayName: 'Agente de Suporte',
    description: 'Responde e gere tickets atribuídos.',
    level: 'organization',
    isSystem: true,
    priority: 600,
    permissions: [
      'tickets.read_all', 'tickets.update_all', 'tickets.assign', 'tickets.close',
      'comments.create', 'comments.create_internal', 'comments.read',
      'users.read', 'knowledge.read', 'assets.read_all', 'hours_bank.consume'
    ]
  },
  
  // ==================== NÍVEL 2: CLIENTE ====================
  {
    name: 'client-admin',
    displayName: 'Administrador do Cliente',
    description: 'Administrador da empresa cliente. Gere utilizadores, estrutura organizacional e tickets da empresa.',
    level: 'client',
    isSystem: true,
    priority: 500,
    permissions: [
      'tickets.create', 'tickets.read', 'tickets.read_all', 'tickets.update',
      'comments.create', 'comments.read',
      'client_users.*', 'directions.*', 'departments.*', 'sections.*',
      'knowledge.read', 'catalog.read', 'catalog.request',
      'assets.read', 'hours_bank.view', 'reports.view'
    ]
  },
  {
    name: 'client-manager',
    displayName: 'Gerente do Cliente',
    description: 'Gerente da empresa cliente. Pode ver todos os tickets da empresa e gerir utilizadores.',
    level: 'client',
    isSystem: true,
    priority: 400,
    permissions: [
      'tickets.create', 'tickets.read', 'tickets.read_all',
      'comments.create', 'comments.read',
      'client_users.read', 'client_users.create', 'client_users.update',
      'directions.read', 'departments.read', 'sections.read',
      'knowledge.read', 'catalog.read', 'catalog.request',
      'assets.read', 'hours_bank.view', 'reports.view'
    ]
  },
  
  // ==================== NÍVEL 3: UTILIZADOR ====================
  {
    name: 'client-user',
    displayName: 'Utilizador',
    description: 'Utilizador padrão. Pode criar tickets e visualizar seus próprios tickets.',
    level: 'user',
    isSystem: true,
    priority: 100,
    permissions: [
      'tickets.create', 'tickets.read', 'tickets.update',
      'comments.create', 'comments.read',
      'knowledge.read', 'catalog.read', 'catalog.request',
      'assets.read', 'hours_bank.view'
    ]
  },
  {
    name: 'client-viewer',
    displayName: 'Visualizador',
    description: 'Apenas visualização. Pode ver tickets mas não pode criar ou editar.',
    level: 'user',
    isSystem: true,
    priority: 50,
    permissions: [
      'tickets.read', 'comments.read', 'knowledge.read', 'catalog.read', 'assets.read'
    ]
  }
];

const seedPermissions = async () => {
  try {
    logger.info('🌱 Iniciando seed de permissões e roles...');

    // 1. Criar todas as permissões
    logger.info('📝 Criando permissões...');
    const createdPermissions = {};
    
    for (const perm of PERMISSIONS) {
      const [permission] = await Permission.findOrCreate({
        where: { resource: perm.resource, action: perm.action },
        defaults: perm
      });
      createdPermissions[`${perm.resource}.${perm.action}`] = permission;
    }
    
    logger.info(`✅ ${Object.keys(createdPermissions).length} permissões criadas/verificadas`);

    // 2. Criar roles padrão
    logger.info('👥 Criando roles padrão...');
    
    for (const roleData of SYSTEM_ROLES) {
      const [role] = await Role.findOrCreate({
        where: { name: roleData.name, organizationId: null },
        defaults: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          level: roleData.level,
          isSystem: roleData.isSystem,
          priority: roleData.priority,
          organizationId: null
        }
      });

      // 3. Associar permissões ao role
      if (roleData.permissions === '*') {
        // Admin-org tem todas as permissões
        const allPermissions = Object.values(createdPermissions);
        for (const permission of allPermissions) {
          await RolePermission.findOrCreate({
            where: { roleId: role.id, permissionId: permission.id },
            defaults: { roleId: role.id, permissionId: permission.id, granted: true }
          });
        }
        logger.info(`  ✅ ${role.displayName}: TODAS as permissões (${allPermissions.length})`);
      } else {
        // Outros roles: mapear permissões
        let permCount = 0;
        for (const permPattern of roleData.permissions) {
          if (permPattern.endsWith('.*')) {
            // Padrão wildcard: tickets.*
            const resource = permPattern.replace('.*', '');
            const matchingPerms = Object.entries(createdPermissions).filter(([key]) => 
              key.startsWith(`${resource}.`)
            );
            
            for (const [, permission] of matchingPerms) {
              await RolePermission.findOrCreate({
                where: { roleId: role.id, permissionId: permission.id },
                defaults: { roleId: role.id, permissionId: permission.id, granted: true }
              });
              permCount++;
            }
          } else {
            // Permissão específica
            const permission = createdPermissions[permPattern];
            if (permission) {
              await RolePermission.findOrCreate({
                where: { roleId: role.id, permissionId: permission.id },
                defaults: { roleId: role.id, permissionId: permission.id, granted: true }
              });
              permCount++;
            }
          }
        }
        logger.info(`  ✅ ${role.displayName}: ${permCount} permissões`);
      }
    }

    logger.info('\n✅ Seed de permissões concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao criar seed de permissões:', error);
    process.exit(1);
  }
};

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPermissions();
}

export default seedPermissions;
