import { sequelize } from '../config/database.js';
import { up } from '../migrations/20260122000002-create-context-audit-logs.js';

const runMigration = async () => {
  try {
    console.log('🔄 Iniciando migration: create-context-audit-logs...');
    
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    await up({ context: sequelize.getQueryInterface() });
    
    console.log('✅ Migration concluída com sucesso!');
    console.log('📌 Tabela context_audit_logs criada com:');
    console.log('   - Campos: id, user_id, user_email, user_type, action');
    console.log('   - Campos: from_context_id, from_context_type, to_context_id, to_context_type');
    console.log('   - Campos: ip_address, user_agent, success, error_message, created_at');
    console.log('   - Índices: user_id, user_email, action, created_at');
    console.log('   - Índices compostos: (user_id, created_at), (user_email, action)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
};

runMigration();
