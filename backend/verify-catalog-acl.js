import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  (process.env.POSTGRES_PASSWORD || '').replace(/['"]/g, ''),
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function verify() {
  try {
    console.log('🔍 Verificando tabela catalog_access_control...\n');
    
    // Verificar estrutura
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'catalog_access_control'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* obrigatório' : ''}`);
    });
    
    // Verificar índices
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'catalog_access_control'
    `);
    
    console.log(`\n🔑 Índices (${indexes.length}):`);
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
    // Verificar registros
    const [count] = await sequelize.query(
      'SELECT COUNT(*) as count FROM catalog_access_control'
    );
    
    console.log(`\n📊 Registros: ${count[0].count}`);
    console.log('\n✅ Tabela catalog_access_control está pronta para uso!');
    
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

verify();
