import { sequelize } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeMigrations() {
  try {
    console.log('🔧 Executando migrations multi-tenant...\n');

    const migrationsDir = path.join(__dirname, '../migrations');
    
    const migrations = [
      '20251104000002-create-clients-table.sql',
      '20251104000003-create-client-users-table.sql',
      '20251104000004-update-users-remove-client-role.sql',
      '20251104000005-update-tickets-add-client-fields.sql'
    ];

    for (const migration of migrations) {
      const filePath = path.join(migrationsDir, migration);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Pulando ${migration} (arquivo não encontrado)`);
        continue;
      }

      console.log(`📄 Executando: ${migration}`);
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await sequelize.query(sql);
        console.log(`   ✅ Sucesso!\n`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ⏭️  Já existe, pulando...\n`);
        } else {
          console.error(`   ❌ Erro: ${error.message}\n`);
        }
      }
    }

    console.log('🎉 Migrations concluídas!');
    
    // Verificar resultado
    console.log('\n📊 Verificando tabelas...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('organizations', 'clients', 'client_users')
      ORDER BY table_name;
    `);
    
    tables.forEach(t => console.log(`   ✅ ${t.table_name}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

executeMigrations();
