import { sequelize } from '../config/database.js';
import ClientUser from '../modules/clients/clientUserModel.js';

/**
 * Script para criar a tabela client_users
 * Executa a migration e sincroniza o modelo
 */

async function createClientUsersTable() {
  try {
    console.log('🚀 Iniciando criação da tabela client_users...\n');

    // Verificar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida\n');

    // Verificar se tabela já existe
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'client_users'
      );
    `);

    if (results[0].exists) {
      console.log('⚠️  Tabela client_users já existe!');
      console.log('   Use o script de migration para modificá-la.\n');
      return;
    }

    console.log('📋 Criando tabela client_users...\n');

    // Criar ENUM para roles
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_client_users_role AS ENUM ('client-admin', 'client-manager', 'client-user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ ENUM enum_client_users_role criado');

    // Criar tabela usando o modelo Sequelize
    await ClientUser.sync({ force: false });
    console.log('✅ Tabela client_users criada com sucesso!\n');

    // Verificar estrutura
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'client_users'
      ORDER BY ordinal_position;
    `);

    console.log('📊 Estrutura da tabela client_users:');
    console.log('─'.repeat(80));
    columns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log('─'.repeat(80));
    console.log();

    // Verificar índices
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'client_users'
      ORDER BY indexname;
    `);

    console.log('🔑 Índices criados:');
    console.log('─'.repeat(80));
    indexes.forEach(idx => {
      console.log(`  ${idx.indexname}`);
    });
    console.log('─'.repeat(80));
    console.log();

    console.log('✅ Tabela client_users criada e validada com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Validar autenticação para client_users');
    console.log('   2. Testar Portal Cliente Empresa');
    console.log('   3. Testar Desktop Agent para clientes');
    console.log('   4. Criar usuários de teste\n');

  } catch (error) {
    console.error('❌ Erro ao criar tabela client_users:', error);
    console.error('\n📋 Detalhes do erro:');
    console.error(error.message);
    if (error.original) {
      console.error('\n🔍 Erro original do PostgreSQL:');
      console.error(error.original.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Executar
createClientUsersTable();
