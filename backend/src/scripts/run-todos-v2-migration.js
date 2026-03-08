import { sequelize } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTodosV2Migration() {
  try {
    logger.info('=== Executando migração todos_v2 ===');

    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../../migrations/create-todos-v2-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    logger.info('Arquivo de migração carregado:', migrationPath);

    // Executar a migração
    await sequelize.query(migrationSQL);
    logger.info('✅ Migração executada com sucesso!');

    // Verificar se as tabelas foram criadas
    const [todosV2] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'todos_v2'
      );
    `);

    const [collaboratorsV2] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'todo_collaborators_v2'
      );
    `);

    logger.info('Verificação das tabelas:');
    logger.info('- todos_v2:', todosV2[0].exists ? '✅ Existe' : '❌ Não existe');
    logger.info('- todo_collaborators_v2:', collaboratorsV2[0].exists ? '✅ Existe' : '❌ Não existe');

    // Verificar estrutura da tabela todo_collaborators_v2
    if (collaboratorsV2[0].exists) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'todo_collaborators_v2'
        ORDER BY ordinal_position;
      `);

      logger.info('\nEstrutura da tabela todo_collaborators_v2:');
      columns.forEach(col => {
        logger.info(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    logger.info('\n✅ Migração concluída com sucesso!');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Erro ao executar migração:', error);
    console.error(error);
    process.exit(1);
  }
}

runTodosV2Migration();
