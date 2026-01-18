import { sequelize } from './src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to execute SQL without transaction blocks
async function executeSQLSafe(sql, filename) {
  // Remove BEGIN and COMMIT statements
  let cleanSQL = sql
    .replace(/^\s*BEGIN\s*;/gim, '')
    .replace(/^\s*COMMIT\s*;/gim, '');
  
  // Split by semicolon but keep statements together
  const statements = cleanSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^--/));
  
  let executed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const statement of statements) {
    if (!statement || statement.length < 5) continue;
    
    try {
      await sequelize.query(statement + ';');
      executed++;
    } catch (error) {
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('does not exist')) {
        skipped++;
      } else {
        errors++;
        console.error(`      ⚠️  ${error.message.split('\n')[0]}`);
      }
    }
  }
  
  return { executed, skipped, errors };
}

async function runAllMigrations() {
  try {
    console.log('🔧 Executando migrações de forma segura...\n');

    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados PostgreSQL!');
    console.log(`   Database: ${process.env.POSTGRES_DB}`);
    console.log(`   Host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}\n`);

    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Get all SQL migration files and sort them
    const allFiles = fs.readdirSync(migrationsDir);
    const sqlMigrations = allFiles
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Encontradas ${sqlMigrations.length} migrations SQL:\n`);

    let totalExecuted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const migration of sqlMigrations) {
      const filePath = path.join(migrationsDir, migration);
      
      console.log(`📄 ${migration}`);
      
      const sql = fs.readFileSync(filePath, 'utf8');
      const result = await executeSQLSafe(sql, migration);
      
      totalExecuted += result.executed;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
      
      if (result.errors === 0) {
        console.log(`   ✅ ${result.executed} statements executados, ${result.skipped} pulados\n`);
      } else {
        console.log(`   ⚠️  ${result.executed} executados, ${result.skipped} pulados, ${result.errors} erros\n`);
      }
    }

    // Execute JS migrations
    const jsMigrations = allFiles
      .filter(file => file.endsWith('.js'))
      .sort();

    if (jsMigrations.length > 0) {
      console.log(`\n📁 Encontradas ${jsMigrations.length} migrations JS:\n`);

      for (const migration of jsMigrations) {
        const filePath = path.join(migrationsDir, migration);
        
        console.log(`📄 ${migration}`);
        
        try {
          const migrationModule = await import(filePath);
          if (migrationModule.up) {
            await migrationModule.up(sequelize.getQueryInterface(), sequelize.constructor);
            console.log(`   ✅ Executada com sucesso\n`);
            totalExecuted++;
          } else {
            console.log(`   ⏭️  Sem função 'up', pulando...\n`);
            totalSkipped++;
          }
        } catch (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate')) {
            console.log(`   ⏭️  Já existe, pulando...\n`);
            totalSkipped++;
          } else {
            console.error(`   ❌ Erro: ${error.message}\n`);
            totalErrors++;
          }
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA EXECUÇÃO:');
    console.log(`   ✅ Executados: ${totalExecuted}`);
    console.log(`   ⏭️  Pulados: ${totalSkipped}`);
    console.log(`   ❌ Erros: ${totalErrors}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Verificar todas as tabelas criadas
    console.log('📊 Verificando tabelas no banco de dados...\n');
    try {
      const [tables] = await sequelize.query(`
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║           TABELAS CRIADAS NO BANCO DE DADOS                ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      
      tables.forEach((t, index) => {
        const num = String(index + 1).padStart(2, '0');
        const name = t.table_name.padEnd(45, ' ');
        const cols = String(t.column_count).padStart(3, ' ');
        console.log(`║ ${num}. ${name} (${cols} cols) ║`);
      });
      
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log(`\n📈 Total: ${tables.length} tabelas no banco de dados\n`);

      // Verificar tabelas críticas
      const criticalTables = [
        'organizations', 'clients', 'client_users', 'users', 'organization_users',
        'departments', 'sections', 'directions',
        'tickets', 'catalog_categories', 'catalog_items',
        'slas', 'priorities', 'types',
        'projects', 'project_tasks', 'project_reports',
        'comments', 'attachments', 'knowledge_base',
        'client_catalog_access', 'client_user_catalog_access'
      ];

      console.log('🔍 Verificando tabelas críticas do sistema...\n');
      const existingTables = tables.map(t => t.table_name);
      const foundTables = criticalTables.filter(t => existingTables.includes(t));
      const missingTables = criticalTables.filter(t => !existingTables.includes(t));
      
      console.log(`✅ Encontradas: ${foundTables.length}/${criticalTables.length}`);
      foundTables.forEach(t => console.log(`   ✓ ${t}`));
      
      if (missingTables.length > 0) {
        console.log(`\n⚠️  Faltando: ${missingTables.length}`);
        missingTables.forEach(t => console.log(`   ✗ ${t}`));
      } else {
        console.log('\n🎉 Todas as tabelas críticas foram criadas!');
      }

    } catch (error) {
      console.log('⚠️  Erro ao verificar tabelas:', error.message);
    }

    console.log('\n✅ Processo de migração concluído!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runAllMigrations();
