import { sequelize } from '../config/database.js';
import { up } from '../migrations/20251024-add-direction-id-to-users.js';

const runMigration = async () => {
  try {
    console.log('🔄 Executando migration: add-direction-id-to-users...');
    
    await up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('✅ Migration executada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
};

runMigration();
