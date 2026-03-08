import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Script para Verificar Sincronização entre Modelos Sequelize e Tabelas
 * 
 * Verifica se todos os campos definidos nos modelos Sequelize existem
 * nas tabelas correspondentes na base de dados.
 */

async function verifyModelsSync() {
  try {
    logger.info('🔍 Verificando sincronização entre modelos e tabelas...\n');

    const models = Object.keys(sequelize.models);
    let allSynced = true;
    const issues = [];

    for (const modelName of models) {
      const model = sequelize.models[modelName];
      const tableName = model.getTableName();
      
      logger.info(`\n📊 Verificando modelo: ${modelName} → tabela: ${tableName}`);
      logger.info('─'.repeat(60));

      // Obter colunas da tabela
      const [tableColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);

      const tableColumnNames = tableColumns.map(col => col.column_name);

      // Obter atributos do modelo
      const modelAttributes = Object.keys(model.rawAttributes);

      // Verificar campos do modelo que não existem na tabela
      const missingInTable = [];
      for (const attr of modelAttributes) {
        const field = model.rawAttributes[attr].field || attr;
        const fieldSnakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        
        if (!tableColumnNames.includes(fieldSnakeCase) && !tableColumnNames.includes(field)) {
          missingInTable.push({
            model: attr,
            field: fieldSnakeCase,
            type: model.rawAttributes[attr].type.toString()
          });
        }
      }

      // Verificar campos da tabela que não existem no modelo
      const missingInModel = [];
      for (const col of tableColumnNames) {
        const found = modelAttributes.some(attr => {
          const field = model.rawAttributes[attr].field || attr;
          const fieldSnakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
          return fieldSnakeCase === col || field === col;
        });

        if (!found && col !== 'created_at' && col !== 'updated_at') {
          missingInModel.push(col);
        }
      }

      // Reportar resultados
      if (missingInTable.length === 0 && missingInModel.length === 0) {
        logger.info(`✅ Modelo e tabela sincronizados (${tableColumnNames.length} campos)`);
      } else {
        allSynced = false;

        if (missingInTable.length > 0) {
          logger.error(`❌ Campos no MODELO que NÃO existem na TABELA:`);
          missingInTable.forEach(field => {
            logger.error(`   • ${field.model} (${field.field}) - ${field.type}`);
          });
          issues.push({
            model: modelName,
            table: tableName,
            type: 'missing_in_table',
            fields: missingInTable
          });
        }

        if (missingInModel.length > 0) {
          logger.warn(`⚠️  Campos na TABELA que NÃO existem no MODELO:`);
          missingInModel.forEach(field => {
            logger.warn(`   • ${field}`);
          });
          issues.push({
            model: modelName,
            table: tableName,
            type: 'missing_in_model',
            fields: missingInModel
          });
        }
      }
    }

    // Resumo final
    logger.info('\n\n' + '═'.repeat(60));
    if (allSynced) {
      logger.info('✅ TODOS OS MODELOS ESTÃO SINCRONIZADOS COM AS TABELAS');
      logger.info('═'.repeat(60));
    } else {
      logger.error('❌ MODELOS DESINCRONIZADOS ENCONTRADOS');
      logger.error('═'.repeat(60));
      logger.error(`\n📌 Total de problemas: ${issues.length}`);
      
      const missingInTableIssues = issues.filter(i => i.type === 'missing_in_table');
      const missingInModelIssues = issues.filter(i => i.type === 'missing_in_model');

      if (missingInTableIssues.length > 0) {
        logger.error(`\n❌ Modelos com campos faltando na tabela: ${missingInTableIssues.length}`);
        missingInTableIssues.forEach(issue => {
          logger.error(`   • ${issue.model} (${issue.table}): ${issue.fields.length} campos`);
        });
      }

      if (missingInModelIssues.length > 0) {
        logger.warn(`\n⚠️  Tabelas com campos faltando no modelo: ${missingInModelIssues.length}`);
        missingInModelIssues.forEach(issue => {
          logger.warn(`   • ${issue.model} (${issue.table}): ${issue.fields.length} campos`);
        });
      }

      logger.error('\n💡 Ações necessárias:');
      logger.error('   1. Para campos faltando na tabela: Criar migração SQL');
      logger.error('   2. Para campos faltando no modelo: Atualizar modelo Sequelize');
      logger.error('   3. Executar migrações e reiniciar servidor');
    }

    process.exit(allSynced ? 0 : 1);
  } catch (error) {
    logger.error('❌ Erro ao verificar sincronização:', error);
    process.exit(1);
  }
}

verifyModelsSync();
