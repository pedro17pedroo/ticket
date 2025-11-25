import { sequelize } from '../src/config/database.js';

const fixTransactionFK = async () => {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida.');

        console.log('🛠️ Removendo constraint hours_transactions_performed_by_id_fkey...');
        await sequelize.query('ALTER TABLE hours_transactions DROP CONSTRAINT IF EXISTS hours_transactions_performed_by_id_fkey;');
        console.log('✅ Constraint removida com sucesso!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
};

fixTransactionFK();
