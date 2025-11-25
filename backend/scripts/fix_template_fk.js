import { sequelize } from '../src/config/database.js';

const fixTemplateFK = async () => {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida.');

        console.log('🛠️ Removendo constraint templates_created_by_fkey...');
        await sequelize.query('ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_created_by_fkey;');
        console.log('✅ Constraint removida com sucesso!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
};

fixTemplateFK();
