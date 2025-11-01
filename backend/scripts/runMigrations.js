import { sequelize } from '../src/config/database.js';

async function runMigrations() {
  try {
    console.log('🔄 Conectando ao banco...');
    await sequelize.authenticate();
    console.log('✅ Conectado!');

    console.log('\n1️⃣ Removendo coluna attachments de comments...');
    await sequelize.query('ALTER TABLE comments DROP COLUMN IF EXISTS attachments;');
    console.log('✅ Coluna attachments removida!');

    console.log('\n2️⃣ Adicionando coluna comment_id em attachments...');
    await sequelize.query(`
      ALTER TABLE attachments 
      ADD COLUMN IF NOT EXISTS comment_id UUID NULL
      REFERENCES comments(id) ON UPDATE CASCADE ON DELETE SET NULL;
    `);
    console.log('✅ Coluna comment_id adicionada!');

    console.log('\n3️⃣ Criando índice...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS attachments_comment_id_idx 
      ON attachments(comment_id);
    `);
    console.log('✅ Índice criado!');

    console.log('\n✅ Migrations executadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

runMigrations();
