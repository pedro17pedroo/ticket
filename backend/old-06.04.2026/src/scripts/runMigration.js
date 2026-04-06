import { sequelize } from '../config/database.js';
import { up } from '../migrations/20251023-add-client-id-to-users.js';

const runMigration = async () => {
  try {
    console.log('🔄 Iniciando migration: add-client-id-to-users...');
    
    await up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('✅ Migration concluída com sucesso!');
    console.log('📌 Campo client_id adicionado à tabela users');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
};

runMigration();
