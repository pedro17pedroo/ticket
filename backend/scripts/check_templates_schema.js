import { sequelize } from '../src/config/database.js';

const checkTableSchema = async () => {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida.');

        console.log('🔍 Verificando colunas da tabela templates...');
        const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'templates';
    `);

        console.log('📋 Colunas encontradas:');
        console.table(results);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
};

checkTableSchema();
