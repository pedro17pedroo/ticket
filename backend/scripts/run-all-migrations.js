import { sequelize } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAllMigrations() {
  try {
    console.log('🔧 Executando todas as migrations...\n');

    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados!');

    const migrationsDir = path.join(__dirname, '../migrations');
    
    // Get all SQL migration files and sort them
    const allFiles = fs.readdirSync(migrationsDir);
    const sqlMigrations = allFiles
      .filter(file => file.endsWith('.sql'))
      .sort(); // This will sort them chronologically by filename

    console.log(`📁 Encontradas ${sqlMigrations.length} migrations SQL:\n`);

    for (const migration of sqlMigrations) {
      const filePath = path.join(migrationsDir, migration);
      
      console.log(`📄 Executando: ${migration}`);
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await sequelize.query(sql);
        console.log(`   ✅ Sucesso!\n`);
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')) {
          console.log(`   ⏭️  Já existe ou não aplicável, pulando...\n`);
        } else {
          console.error(`   ❌ Erro: ${error.message}\n`);
          // Don't exit on error, continue with other migrations
        }
      }
    }

    console.log('🎉 Migrations SQL concluídas!');
    
    // Verificar algumas tabelas importantes
    console.log('\n📊 Verificando tabelas importantes...');
    try {
      const [tables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'organizations', 'clients', 'client_users', 'users', 'departments', 
            'directions', 'catalog_categories', 'slas', 'priorities', 'types',
            'projects', 'project_reports'
          )
        ORDER BY table_name;
      `);
      
      tables.forEach(t => console.log(`   ✅ ${t.table_name}`));
      console.log(`\n📈 Total: ${tables.length} tabelas verificadas`);
    } catch (error) {
      console.log('⚠️  Erro ao verificar tabelas:', error.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

runAllMigrations();