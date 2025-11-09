import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas multi-tenant...\n');

    // Verificar tabela organizations
    const [orgs] = await sequelize.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position;
    `);
    console.log('✅ Tabela ORGANIZATIONS:', orgs.length > 0 ? `${orgs.length} colunas` : '❌ NÃO EXISTE');

    // Verificar tabela clients
    const [clients] = await sequelize.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY ordinal_position;
    `);
    console.log('✅ Tabela CLIENTS:', clients.length > 0 ? `${clients.length} colunas` : '❌ NÃO EXISTE');

    // Verificar tabela client_users
    const [clientUsers] = await sequelize.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'client_users' 
      ORDER BY ordinal_position;
    `);
    console.log('✅ Tabela CLIENT_USERS:', clientUsers.length > 0 ? `${clientUsers.length} colunas` : '❌ NÃO EXISTE');

    // Verificar dados
    console.log('\n📊 Contagem de registros:');
    
    const [orgCount] = await sequelize.query(`SELECT COUNT(*) as count FROM organizations;`);
    console.log(`   Organizations: ${orgCount[0].count}`);
    
    if (clients.length > 0) {
      const [clientCount] = await sequelize.query(`SELECT COUNT(*) as count FROM clients;`);
      console.log(`   Clients: ${clientCount[0].count}`);
    } else {
      console.log(`   Clients: Tabela não existe`);
    }
    
    if (clientUsers.length > 0) {
      const [clientUserCount] = await sequelize.query(`SELECT COUNT(*) as count FROM client_users;`);
      console.log(`   Client Users: ${clientUserCount[0].count}`);
    } else {
      console.log(`   Client Users: Tabela não existe`);
    }

    // Verificar roles em users
    const [roles] = await sequelize.query(`
      SELECT DISTINCT role FROM users ORDER BY role;
    `);
    console.log('\n🔐 Roles existentes na tabela USERS:');
    roles.forEach(r => console.log(`   - ${r.role}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkTables();
