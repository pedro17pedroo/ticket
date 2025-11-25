import { sequelize } from '../src/config/database.js';

const fixHoursBankFK = async () => {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida.');

        console.log('🛠️ Alterando constraint hours_banks_client_id_fkey...');

        // Remover constraint antiga
        await sequelize.query('ALTER TABLE hours_banks DROP CONSTRAINT IF EXISTS hours_banks_client_id_fkey;');

        // Adicionar nova constraint apontando para clients
        await sequelize.query('ALTER TABLE hours_banks ADD CONSTRAINT hours_banks_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);');

        console.log('✅ Constraint atualizada com sucesso!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
};

fixHoursBankFK();
