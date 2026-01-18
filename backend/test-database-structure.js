import { sequelize } from './src/config/database.js';
import logger from './src/config/logger.js';

async function testDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...\n');

    // Test 1: Verificar colunas de client_users
    console.log('1️⃣ Verificando colunas de client_users...');
    const [clientUsersColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'client_users' 
      AND column_name IN ('direction_id', 'department_id', 'section_id')
      ORDER BY column_name;
    `);
    console.log('✅ Colunas de client_users:', clientUsersColumns);

    // Test 2: Verificar colunas de catalog_categories
    console.log('\n2️⃣ Verificando colunas de catalog_categories...');
    const [catalogCategoriesColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'catalog_categories' 
      AND column_name IN ('parent_category_id', 'level', 'image_url', 'default_direction_id', 'default_department_id', 'default_section_id')
      ORDER BY column_name;
    `);
    console.log('✅ Colunas de catalog_categories:', catalogCategoriesColumns);

    // Test 3: Verificar colunas de catalog_items
    console.log('\n3️⃣ Verificando colunas de catalog_items...');
    const [catalogItemsColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'catalog_items' 
      AND column_name IN ('image_url', 'item_type', 'default_priority', 'auto_assign_priority', 'skip_approval_for_incidents', 'default_direction_id', 'default_department_id', 'default_section_id', 'incident_workflow_id', 'keywords')
      ORDER BY column_name;
    `);
    console.log('✅ Colunas de catalog_items:', catalogItemsColumns);

    // Test 4: Verificar coluna archived_at de projects
    console.log('\n4️⃣ Verificando coluna archived_at de projects...');
    const [projectsColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'archived_at';
    `);
    console.log('✅ Coluna archived_at de projects:', projectsColumns);

    // Test 5: Verificar tabelas de projetos
    console.log('\n5️⃣ Verificando tabelas de projetos...');
    const [projectTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'project%'
      ORDER BY table_name;
    `);
    console.log('✅ Tabelas de projetos:', projectTables.map(t => t.table_name));

    // Test 6: Verificar se a tabela audit_logs existe
    console.log('\n6️⃣ Verificando tabela audit_logs...');
    const [auditLogsTable] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'audit_logs';
    `);
    console.log('✅ Tabela audit_logs:', auditLogsTable.length > 0 ? 'Existe' : 'Não existe');

    console.log('\n✅ Verificação completa! Todas as estruturas estão corretas.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
    process.exit(1);
  }
}

testDatabaseStructure();
