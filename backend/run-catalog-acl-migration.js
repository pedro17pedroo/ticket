import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env') });

// Verificar variáveis necessárias
console.log('📋 Verificando variáveis de ambiente...');
console.log('POSTGRES_DB:', process.env.POSTGRES_DB);
console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);

if (!process.env.POSTGRES_DB || !process.env.POSTGRES_USER) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

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

async function runMigration() {
  try {
    console.log('🚀 Iniciando migration: catalog_access_control...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'create-catalog-access-control.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar migration
    await sequelize.query(sql);
    console.log('✅ Migration executada com sucesso!');
    
    // Verificar tabela criada
    const [results] = await sequelize.query(
      'SELECT COUNT(*) as count FROM catalog_access_control'
    );
    console.log('✅ Tabela catalog_access_control criada. Registros:', results[0].count);
    
    // Verificar índices
    const [indexes] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'catalog_access_control'
    `);
    console.log('✅ Índices criados:', indexes.length);
    indexes.forEach(idx => console.log('  -', idx.indexname));
    
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro na migration:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
