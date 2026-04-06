import { sequelize } from '../config/database.js';
import migration from '../migrations/20251023-create-attachments.js';

async function runMigration() {
  try {
    console.log('🔄 Iniciando migration de attachments...');
    
    // Conectar ao banco de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');

    // Executar migration
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✅ Migration executada com sucesso!');
    
    console.log('\n📦 Tabela attachments criada com sucesso!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

runMigration();
