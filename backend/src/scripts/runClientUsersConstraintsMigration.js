import { sequelize } from '../config/database.js';
import { up } from '../migrations/20260122000003-update-client-users-constraints.js';

async function runMigration() {
  try {
    console.log('🚀 Iniciando migration: update-client-users-constraints...\n');

    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida\n');

    await up({ context: sequelize.getQueryInterface() });

    console.log('\n✅ Migration concluída com sucesso!');
    console.log('\n📝 Alterações realizadas:');
    console.log('   - Removido constraint unique do campo email');
    console.log('   - Adicionado constraint unique composto (email, client_id)');
    console.log('   - Mesmo email pode agora existir em múltiplos client_id\n');

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    console.error('\n📋 Detalhes do erro:');
    console.error(error.message);
    if (error.original) {
      console.error('\n🔍 Erro original do PostgreSQL:');
      console.error(error.original.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
