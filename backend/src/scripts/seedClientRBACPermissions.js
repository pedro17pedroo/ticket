import { sequelize } from '../config/database.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import logger from '../config/logger.js';

/**
 * Script para popular permissões e roles de CLIENTES
 * Executar: node src/scripts/seedClientRBACPermissions.js
 */

// Definir roles de clientes
const CLIENT_ROLES = [
  {
    name: 'client-admin',
    displayName: 'Administrador do Cliente',
    description: 'Administrador da empresa cliente com acesso total aos recursos do cliente',
    level: 'client',
    isSystem: true,
    priority: 600,
    permissions: [
      // Dashboard
      'dashboard.view',
      
      // Tickets - clientes podem criar e ver seus tickets
      'tickets.view',
      'tickets.create',
      'tickets.update',
      'comments.view',
      'comments.create',
      
      // Estrutura organizacional - apenas visualização
      'directions.view',
      'departments.view',
      'sections.view',
      'users.view',
      'client_users.view',
      
      // Catálogo de serviços
      'catalog.view',
      
      // Inventário - ver seus próprios ativos
      'assets.view',
      
      // Base de conhecimento
      'knowledge.view',
      
      // Bolsa de horas
      'hours_bank.view',
      
      // Relatórios básicos
      'reports.view',
    ]
  },
  {
    name: 'client-user',
    displayName: 'Utilizador do Cliente',
    description: 'Utilizador padrão da empresa cliente',
    level: 'client',
    isSystem: true,
    priority: 300,
    permissions: [
      // Dashboard
      'dashboard.view',
      
      // Tickets - apenas seus próprios tickets
      'tickets.view',
      'tickets.create',
      'comments.view',
      'comments.create',
      
      // Catálogo de serviços
      'catalog.view',
      
      // Inventário - ver seus próprios ativos
      'assets.view',
      
      // Base de conhecimento
      'knowledge.view',
      
      // Bolsa de horas - apenas visualização
      'hours_bank.view',
    ]
  },
];

async function seedClientRBACPermissions() {
  try {
    logger.info('🌱 Iniciando seed de permissões RBAC para CLIENTES...');
    
    // 1. Buscar todas as permissões existentes
    const allPermissions = await Permission.findAll();
    const permissionsMap = {};
    
    allPermissions.forEach(perm => {
      permissionsMap[`${perm.resource}.${perm.action}`] = perm;
    });
    
    logger.info(`📝 ${allPermissions.length} permissões disponíveis no sistema`);
    
    // 2. Criar roles de clientes
    logger.info('👥 Criando roles de clientes...');
    
    for (const roleData of CLIENT_ROLES) {
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
        
        // Limpar permissões antigas para recriar
        await RolePermission.destroy({
          where: { roleId: role.id }
        });
        logger.info(`  🧹 Permissões antigas removidas para ${roleData.name}`);
      }
      
      // 3. Associar permissões ao role
      logger.info(`  🔑 Associando ${roleData.permissions.length} permissões ao role ${roleData.name}...`);
      
      let associatedCount = 0;
      for (const permString of roleData.permissions) {
        const permission = permissionsMap[permString];
        
        if (permission) {
          await RolePermission.create({
            roleId: role.id,
            permissionId: permission.id,
            granted: true
          });
          associatedCount++;
        } else {
          logger.warn(`  ⚠️  Permissão não encontrada: ${permString}`);
        }
      }
      
      logger.info(`  ✅ ${associatedCount} permissões associadas ao role ${roleData.name}`);
    }
    
    logger.info('✅ Seed de RBAC para clientes concluído com sucesso!');
    logger.info('');
    logger.info('📊 Resumo:');
    logger.info(`  - ${CLIENT_ROLES.length} roles de clientes criados`);
    logger.info('');
    logger.info('🎯 Próximos passos:');
    logger.info('  1. Reiniciar o backend');
    logger.info('  2. Fazer login novamente no Portal Cliente');
    logger.info('  3. Verificar que as permissões estão carregadas');
    
  } catch (error) {
    logger.error('❌ Erro ao fazer seed de RBAC para clientes:', error);
    throw error;
  }
}

// Executar seed
seedClientRBACPermissions()
  .then(() => {
    logger.info('✅ Script concluído');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Erro fatal:', error);
    process.exit(1);
  });
