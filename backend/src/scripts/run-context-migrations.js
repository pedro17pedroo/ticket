import { sequelize } from '../config/database.js';
import { QueryInterface } from 'sequelize';
import logger from '../config/logger.js';

const queryInterface = sequelize.getQueryInterface();

async function runMigrations() {
  try {
    logger.info('🔄 Executando migrations de contexto...');

    // Migration 1: Create context_sessions table
    logger.info('📝 Criando tabela context_sessions...');
    
    await queryInterface.createTable('context_sessions', {
      id: {
        type: 'UUID',
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      user_id: {
        type: 'UUID',
        allowNull: false
      },
      user_type: {
        type: 'VARCHAR(50)',
        allowNull: false
      },
      context_id: {
        type: 'UUID',
        allowNull: false
      },
      context_type: {
        type: 'VARCHAR(50)',
        allowNull: false
      },
      session_token: {
        type: 'VARCHAR(500)',
        allowNull: false,
        unique: true
      },
      ip_address: {
        type: 'VARCHAR(45)',
        allowNull: true
      },
      user_agent: {
        type: 'TEXT',
        allowNull: true
      },
      is_active: {
        type: 'BOOLEAN',
        defaultValue: true
      },
      last_activity_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false
      },
      created_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('context_sessions', ['session_token'], {
      name: 'context_sessions_session_token_idx'
    });
    await queryInterface.addIndex('context_sessions', ['user_id'], {
      name: 'context_sessions_user_id_idx'
    });
    await queryInterface.addIndex('context_sessions', ['is_active'], {
      name: 'context_sessions_is_active_idx'
    });
    await queryInterface.addIndex('context_sessions', ['expires_at'], {
      name: 'context_sessions_expires_at_idx'
    });

    logger.info('✅ Tabela context_sessions criada');

    // Migration 2: Create context_audit_logs table
    logger.info('📝 Criando tabela context_audit_logs...');
    
    await queryInterface.createTable('context_audit_logs', {
      id: {
        type: 'UUID',
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      user_id: {
        type: 'UUID',
        allowNull: false
      },
      user_email: {
        type: 'VARCHAR(255)',
        allowNull: false
      },
      user_type: {
        type: 'VARCHAR(50)',
        allowNull: false
      },
      action: {
        type: 'VARCHAR(50)',
        allowNull: false
      },
      from_context_id: {
        type: 'UUID',
        allowNull: true
      },
      from_context_type: {
        type: 'VARCHAR(50)',
        allowNull: true
      },
      to_context_id: {
        type: 'UUID',
        allowNull: false
      },
      to_context_type: {
        type: 'VARCHAR(50)',
        allowNull: false
      },
      ip_address: {
        type: 'VARCHAR(45)',
        allowNull: true
      },
      user_agent: {
        type: 'TEXT',
        allowNull: true
      },
      success: {
        type: 'BOOLEAN',
        defaultValue: true
      },
      error_message: {
        type: 'TEXT',
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('context_audit_logs', ['user_id'], {
      name: 'context_audit_logs_user_id_idx'
    });
    await queryInterface.addIndex('context_audit_logs', ['user_email'], {
      name: 'context_audit_logs_user_email_idx'
    });
    await queryInterface.addIndex('context_audit_logs', ['action'], {
      name: 'context_audit_logs_action_idx'
    });
    await queryInterface.addIndex('context_audit_logs', ['created_at'], {
      name: 'context_audit_logs_created_at_idx'
    });

    logger.info('✅ Tabela context_audit_logs criada');

    // Migration 3: Update client_users constraints
    logger.info('📝 Verificando tabela client_users...');
    
    // Verificar se a tabela client_users existe
    const tables = await queryInterface.showAllTables();
    
    if (!tables.includes('client_users')) {
      logger.error('❌ ERRO CRÍTICO: Tabela client_users não existe!');
      logger.error('Sistema SaaS multi-nível incompleto. Execute:');
      logger.error('PGPASSWORD=postgres psql -h localhost -U postgres -d tatuticket -f backend/migrations/20251104000003-create-client-users-table.sql');
      throw new Error('Tabela client_users não existe - arquitetura SaaS incompleta');
    }
    
    logger.info('📝 Atualizando constraints da tabela client_users...');
      
      // Remover constraint unique de email (se existir)
      try {
        await sequelize.query(`
          ALTER TABLE client_users 
          DROP CONSTRAINT IF EXISTS client_users_email_key;
        `);
        logger.info('✅ Constraint unique de email removida');
      } catch (error) {
        logger.warn('⚠️  Constraint unique de email não existe ou já foi removida');
      }

      // Adicionar constraint unique composta (email, client_id)
      try {
        await sequelize.query(`
          ALTER TABLE client_users 
          ADD CONSTRAINT client_users_email_client_unique 
          UNIQUE (email, client_id);
        `);
        logger.info('✅ Constraint unique composta (email, client_id) adicionada');
      } catch (error) {
        if (error.message.includes('already exists')) {
          logger.info('✅ Constraint unique composta já existe');
        } else {
          throw error;
        }
      }

    logger.info('✅ Todas as migrations de contexto foram executadas com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao executar migrations:', error);
    process.exit(1);
  }
}

runMigrations();
