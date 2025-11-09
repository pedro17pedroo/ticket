#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from './src/config/database.js';
import logger from './src/config/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const setupRBAC = async () => {
  try {
    logger.info('🚀 Iniciando setup do sistema RBAC...\n');

    // 1. Verificar conexão com banco de dados
    logger.info('📡 Verificando conexão com banco de dados...');
    await sequelize.authenticate();
    logger.info('✅ Conexão estabelecida com sucesso!\n');

    // 2. Executar migração (criar tabelas via Sequelize)
    logger.info('📦 Executando migração RBAC...');
    try {
      // Dropar tabelas antigas se existirem
      logger.info('🗑️  Limpando tabelas antigas RBAC (se existirem)...');
      await sequelize.query('DROP TABLE IF EXISTS user_permissions CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS role_permissions CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS permissions CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS roles CASCADE');
      
      // Importar migração diretamente
      const migration = await import('./src/migrations/20251105000000-create-rbac-tables.js');
      const queryInterface = sequelize.getQueryInterface();
      
      await migration.up(queryInterface, sequelize.Sequelize);
      logger.info('✅ Migração executada com sucesso!\n');
    } catch (error) {
      logger.error('⚠️  Erro na migração:', error.message);
      throw error;
    }

    // 3. Popular permissões e roles
    logger.info('🌱 Populando permissões e roles padrão...');
    const seedPermissions = (await import('./src/seeds/permissions-seed.js')).default;
    await seedPermissions();

    logger.info('\n✅ Setup RBAC concluído com sucesso!');
    logger.info('\n📋 Roles criados:');
    logger.info('  • admin-org (Administrador da Organização)');
    logger.info('  • gerente (Gerente)');
    logger.info('  • supervisor (Supervisor)');
    logger.info('  • agente (Agente de Suporte)');
    logger.info('  • client-admin (Administrador do Cliente)');
    logger.info('  • client-manager (Gerente do Cliente)');
    logger.info('  • client-user (Utilizador)');
    logger.info('  • client-viewer (Visualizador)');
    
    logger.info('\n🔐 70+ permissões criadas e associadas aos roles!');
    logger.info('\n📖 Consulte RBAC-IMPLEMENTATION.md para documentação completa.');
    
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Erro durante setup RBAC:', error);
    process.exit(1);
  }
};

// Executar
setupRBAC();
