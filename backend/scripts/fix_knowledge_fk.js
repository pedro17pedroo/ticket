import { sequelize } from '../src/config/database.js';

const fixConstraint = async () => {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida.');

        console.log('🛠️ Removendo constraint knowledge_articles_author_id_fkey...');
        await sequelize.query('ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_author_id_fkey;');
        console.log('✅ Constraint removida com sucesso!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
};

fixConstraint();
