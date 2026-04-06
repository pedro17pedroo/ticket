import { sequelize } from '../config/database.js';
import { up } from '../migrations/20251024-improve-hours-bank.js';

const runMigration = async () => {
  try {
    console.log('🔄 Executando migration: improve-hours-bank...');
    
    await up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('✅ Migration executada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
};

runMigration();
