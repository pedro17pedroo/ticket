/**
 * Script para verificar e corrigir erros de banco de dados
 * - Verifica se tabelas existem
 * - Verifica se colunas existem
 * - Cria o que estiver faltando
 */

import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

async function fixDatabaseErrors() {
  console.log('🔧 Verificando e corrigindo erros de banco de dados\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Verificar tabela catalog_access_control
    console.log('1️⃣ Verificando tabela catalog_access_control...');
    const [catalogAccessControlExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'catalog_access_control'
      );
    `);
    
    if (catalogAccessControlExists[0].exists) {
      console.log('   ✅ Tabela catalog_access_control existe\n');
    } else {
      console.log('   ❌ Tabela catalog_access_control NÃO existe');
      console.log('   📝 Execute: psql -f migrations/20260302000001-create-catalog-access-control.sql\n');
    }

    // 2. Verificar coluna client_id na tabela projects
    console.log('2️⃣ Verificando coluna client_id na tabela projects...');
    const [clientIdExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'client_id'
      );
    `);
    
    if (clientIdExists[0].exists) {
      console.log('   ✅ Coluna client_id existe na tabela projects\n');
    } else {
      console.log('   ❌ Coluna client_id NÃO existe na tabela projects');
      console.log('   📝 Execute: psql -f migrations/20260302000002-add-client-id-to-projects.sql\n');
    }

    // 3. Verificar outras tabelas críticas
    console.log('3️⃣ Verificando outras tabelas críticas...');
    const criticalTables = [
      'organizations',
      'organization_users',
      'clients',
      'client_users',
      'projects',
      'project_tasks',
      'tickets',
      'catalog_categories',
      'catalog_items',
      'roles',
      'permissions',
      'role_permissions'
    ];

    for (const tableName of criticalTables) {
      const [tableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `);
      
      if (tableExists[0].exists) {
        console.log(`   ✅ ${tableName}`);
      } else {
        console.log(`   ❌ ${tableName} - FALTANDO!`);
      }
    }

    console.log('\n✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

fixDatabaseErrors();
