import { sequelize } from '../config/database.js';

async function runMigration() {
    try {
        console.log('🔄 Executando migration: add-usage-count-to-templates...');

        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Adicionar coluna usage_count na tabela templates
        await sequelize.query(`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0 NOT NULL;
    `);

        console.log('✅ Migration executada com sucesso!');
        console.log('   - Coluna usage_count adicionada à tabela templates');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao executar migration:', error);
        process.exit(1);
    }
}

runMigration();
