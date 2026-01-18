import { sequelize } from './src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAllMigrations() {
  try {
    console.log('🔧 Executando TODAS as migrations (SQL + JS)...\n');

    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados PostgreSQL!');
    console.log(`   Database: ${process.env.POSTGRES_DB}`);
    console.log(`   Host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}\n`);

    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Get all migration files and sort them
    const allFiles = fs.readdirSync(migrationsDir);
    const migrations = allFiles
      .filter(file => file.endsWith('.sql') || file.endsWith('.js'))
      .sort(); // Sort chronologically by filename

    console.log(`📁 Encontradas ${migrations.length} migrations:\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const migration of migrations) {
      const filePath = path.join(migrationsDir, migration);
      
      console.log(`📄 Executando: ${migration}`);
      
      try {
        if (migration.endsWith('.sql')) {
          // Execute SQL migration
          const sql = fs.readFileSync(filePath, 'utf8');
          await sequelize.query(sql);
          console.log(`   ✅ Sucesso!\n`);
          successCount++;
        } else if (migration.endsWith('.js')) {
          // Execute JS migration
          const migrationModule = await import(filePath);
          if (migrationModule.up) {
            await migrationModule.up(sequelize.getQueryInterface(), sequelize.constructor);
            console.log(`   ✅ Sucesso!\n`);
            successCount++;
          } else {
            console.log(`   ⚠️  Sem função 'up', pulando...\n`);
            skipCount++;
          }
        }
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist') ||
            error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`   ⏭️  Já existe ou não aplicável, pulando...\n`);
          skipCount++;
        } else {
          console.error(`   ❌ Erro: ${error.message}\n`);
          errorCount++;
          // Continue with other migrations
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA EXECUÇÃO:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ⏭️  Puladas: ${skipCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Verificar todas as tabelas criadas
    console.log('📊 Verificando TODAS as tabelas criadas...\n');
    try {
      const [tables] = await sequelize.query(`
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      
      console.log('╔════════════════════════════════════════════════════╗');
      console.log('║              TABELAS NO BANCO DE DADOS             ║');
      console.log('╠════════════════════════════════════════════════════╣');
      
      tables.forEach((t, index) => {
        const num = String(index + 1).padStart(2, '0');
        const name = t.table_name.padEnd(40, ' ');
        const cols = String(t.column_count).padStart(3, ' ');
        console.log(`║ ${num}. ${name} (${cols} cols) ║`);
      });
      
      console.log('╚════════════════════════════════════════════════════╝');
      console.log(`\n📈 Total: ${tables.length} tabelas criadas no banco de dados\n`);

      // Verificar tabelas críticas
      const criticalTables = [
        'organizations', 'clients', 'client_users', 'users', 
        'departments', 'sections', 'directions',
        'tickets', 'catalog_categories', 'catalog_items',
        'slas', 'priorities', 'types',
        'projects', 'project_tasks', 'project_reports',
        'comments', 'attachments', 'knowledge_base'
      ];

      console.log('🔍 Verificando tabelas críticas...\n');
      const existingTables = tables.map(t => t.table_name);
      const missingTables = criticalTables.filter(t => !existingTables.includes(t));
      
      if (missingTables.length === 0) {
        console.log('✅ Todas as tabelas críticas foram criadas com sucesso!');
      } else {
        console.log('⚠️  Tabelas críticas faltando:');
        missingTables.forEach(t => console.log(`   ❌ ${t}`));
      }

    } catch (error) {
      console.log('⚠️  Erro ao verificar tabelas:', error.message);
    }

    console.log('\n🎉 Processo de migração concluído!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runAllMigrations();
