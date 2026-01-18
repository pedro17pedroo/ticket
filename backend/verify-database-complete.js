import { sequelize } from './src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifyDatabase() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     VERIFICAÇÃO COMPLETA DO BANCO DE DADOS TATUTICKET      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Total de tabelas
    const [totalResult] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_tables,
        SUM((SELECT COUNT(*) FROM information_schema.columns 
             WHERE table_name = t.table_name AND table_schema = 'public')) as total_columns
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);

    console.log('📊 ESTATÍSTICAS GERAIS:');
    console.log(`   Total de Tabelas: ${totalResult[0].total_tables}`);
    console.log(`   Total de Colunas: ${totalResult[0].total_columns}\n`);

    // Tabelas críticas
    const criticalTables = [
      'organizations', 'clients', 'client_users', 'users', 'organization_users',
      'departments', 'sections', 'directions',
      'tickets', 'catalog_categories', 'catalog_items',
      'slas', 'priorities', 'types',
      'projects', 'project_tasks', 'project_reports',
      'comments', 'attachments', 'knowledge_base',
      'client_catalog_access', 'client_user_catalog_access'
    ];

    const [criticalResult] = await sequelize.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN (${criticalTables.map(t => `'${t}'`).join(',')})
      ORDER BY table_name;
    `);

    console.log('🔍 TABELAS CRÍTICAS DO SISTEMA:');
    console.log('╔════════════════════════════════════════════════════════════╗');
    criticalResult.forEach((table, index) => {
      const num = String(index + 1).padStart(2, '0');
      const name = table.table_name.padEnd(35, ' ');
      const cols = String(table.column_count).padStart(3, ' ');
      console.log(`║ ${num}. ${name} (${cols} cols) ║`);
    });
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✅ ${criticalResult.length}/${criticalTables.length} tabelas críticas encontradas\n`);

    // Verificar tabelas faltantes
    const foundTables = criticalResult.map(t => t.table_name);
    const missingTables = criticalTables.filter(t => !foundTables.includes(t));

    if (missingTables.length > 0) {
      console.log('⚠️  TABELAS CRÍTICAS FALTANDO:');
      missingTables.forEach(t => console.log(`   ❌ ${t}`));
      console.log('');
    }

    // Verificar índices
    const [indexResult] = await sequelize.query(`
      SELECT COUNT(*) as total_indexes
      FROM pg_indexes
      WHERE schemaname = 'public';
    `);

    console.log('📑 ÍNDICES:');
    console.log(`   Total de Índices: ${indexResult[0].total_indexes}\n`);

    // Verificar constraints
    const [constraintResult] = await sequelize.query(`
      SELECT 
        constraint_type,
        COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      GROUP BY constraint_type
      ORDER BY constraint_type;
    `);

    console.log('🔒 CONSTRAINTS:');
    constraintResult.forEach(c => {
      console.log(`   ${c.constraint_type.padEnd(20, ' ')}: ${c.count}`);
    });
    console.log('');

    // Verificar foreign keys importantes
    const [fkResult] = await sequelize.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('tickets', 'catalog_items', 'client_users', 'projects')
      ORDER BY tc.table_name, kcu.column_name;
    `);

    console.log('🔗 FOREIGN KEYS PRINCIPAIS:');
    let currentTable = '';
    fkResult.forEach(fk => {
      if (fk.table_name !== currentTable) {
        if (currentTable !== '') console.log('');
        console.log(`   ${fk.table_name}:`);
        currentTable = fk.table_name;
      }
      console.log(`      ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
    });
    console.log('');

    // Verificar dados de exemplo
    const [orgCount] = await sequelize.query('SELECT COUNT(*) as count FROM organizations');
    const [clientCount] = await sequelize.query('SELECT COUNT(*) as count FROM clients');
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM organization_users');
    const [ticketCount] = await sequelize.query('SELECT COUNT(*) as count FROM tickets');
    const [catalogCatCount] = await sequelize.query('SELECT COUNT(*) as count FROM catalog_categories');
    const [catalogItemCount] = await sequelize.query('SELECT COUNT(*) as count FROM catalog_items');

    console.log('📈 DADOS EXISTENTES:');
    console.log(`   Organizações:         ${orgCount[0].count}`);
    console.log(`   Clientes:             ${clientCount[0].count}`);
    console.log(`   Usuários:             ${userCount[0].count}`);
    console.log(`   Tickets:              ${ticketCount[0].count}`);
    console.log(`   Categorias Catálogo:  ${catalogCatCount[0].count}`);
    console.log(`   Itens Catálogo:       ${catalogItemCount[0].count}`);
    console.log('');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ VERIFICAÇÃO COMPLETA                 ║');
    console.log('║                                                            ║');
    if (missingTables.length === 0) {
      console.log('║  Todas as tabelas críticas foram criadas com sucesso!     ║');
      console.log('║  O banco de dados está pronto para uso.                   ║');
    } else {
      console.log('║  ⚠️  Algumas tabelas críticas estão faltando.             ║');
      console.log('║  Execute as migrações novamente.                          ║');
    }
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyDatabase();
