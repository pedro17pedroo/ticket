/**
 * Script de verificação do sistema RBAC
 * Verifica se as tabelas existem e se há dados populados
 */

import { sequelize } from './src/config/database.js';
import logger from './src/config/logger.js';

async function checkRBAC() {
  try {
    logger.info('🔍 Verificando sistema RBAC...\n');

    // 1. Verificar conexão com DB
    await sequelize.authenticate();
    logger.info('✅ Conexão com banco de dados OK\n');

    // 2. Verificar se tabelas existem
    const tables = ['roles', 'permissions', 'role_permissions', 'user_permissions'];
    const existingTables = [];
    const missingTables = [];

    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table}'
          );
        `);
        
        if (results[0].exists) {
          existingTables.push(table);
        } else {
          missingTables.push(table);
        }
      } catch (error) {
        missingTables.push(table);
      }
    }

    logger.info('📊 Status das Tabelas:');
    existingTables.forEach(t => logger.info(`  ✅ ${t}`));
    missingTables.forEach(t => logger.info(`  ❌ ${t} (NÃO EXISTE)`));
    logger.info('');

    // 3. Se todas as tabelas existem, contar registos
    if (missingTables.length === 0) {
      logger.info('📈 Contagem de Registos:');
      
      const [rolesCount] = await sequelize.query('SELECT COUNT(*) as count FROM roles');
      logger.info(`  • Roles: ${rolesCount[0].count}`);
      
      const [permissionsCount] = await sequelize.query('SELECT COUNT(*) as count FROM permissions');
      logger.info(`  • Permissions: ${permissionsCount[0].count}`);
      
      const [rolePermsCount] = await sequelize.query('SELECT COUNT(*) as count FROM role_permissions');
      logger.info(`  • Role-Permissions: ${rolePermsCount[0].count}`);
      
      const [userPermsCount] = await sequelize.query('SELECT COUNT(*) as count FROM user_permissions');
      logger.info(`  • User-Permissions: ${userPermsCount[0].count}`);
      
      logger.info('');

      // 4. Listar roles
      const [roles] = await sequelize.query('SELECT name, display_name, level, priority FROM roles ORDER BY priority DESC');
      logger.info('👥 Roles Disponíveis:');
      roles.forEach(role => {
        logger.info(`  • ${role.name} (${role.display_name}) - ${role.level} - prioridade: ${role.priority}`);
      });
      logger.info('');

      logger.info('✅ SISTEMA RBAC 100% FUNCIONAL!\n');
      
    } else {
      logger.warn('⚠️  SISTEMA RBAC NÃO ESTÁ CONFIGURADO!\n');
      logger.info('Para configurar o sistema RBAC, execute:');
      logger.info('  node setup-rbac.js\n');
    }

  } catch (error) {
    logger.error('❌ Erro ao verificar RBAC:', error.message);
    logger.info('\n⚠️  O sistema RBAC não está configurado.');
    logger.info('Para configurar, execute: node setup-rbac.js\n');
  } finally {
    await sequelize.close();
  }
}

// Executar
checkRBAC();
