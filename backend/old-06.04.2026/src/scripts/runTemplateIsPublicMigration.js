import { sequelize } from '../config/database.js';

async function runMigration() {
    try {
        console.log('🔄 Executando migration: add-is-public-to-templates...');

        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Adicionar coluna is_public na tabela templates
        await sequelize.query(`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL;
    `);

        console.log('✅ Migration executada com sucesso!');
        console.log('   - Coluna is_public adicionada à tabela templates');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao executar migration:', error);
        process.exit(1);
    }
}

runMigration();
