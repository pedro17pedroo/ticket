/**
 * Script para criar dados de teste do sistema multi-contexto
 * 
 * Cria:
 * 1. Duas organizações tenant
 * 2. Um usuário com mesmo email em ambas as organizações
 * 3. Uma empresa cliente
 * 4. Um usuário da empresa cliente (mesmo email)
 */

import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'tatuticket',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

const TEST_EMAIL = 'multicontext@test.com';
const TEST_PASSWORD = 'Test@123';

async function createTestData() {
  console.log('🚀 Criando dados de teste para multi-contexto...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados\n');

    // Fazer hash da senha para inserção direta no banco
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // 1. Criar ou buscar organizações
    console.log('📊 Criando organizações...');
    
    const [org1] = await sequelize.query(`
      INSERT INTO organizations (id, name, slug, type, is_active, created_at, updated_at)
      VALUES (
        '${uuidv4()}',
        'Organização Alpha',
        'org-alpha',
        'tenant',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, slug;
    `);

    const [org2] = await sequelize.query(`
      INSERT INTO organizations (id, name, slug, type, is_active, created_at, updated_at)
      VALUES (
        '${uuidv4()}',
        'Organização Beta',
        'org-beta',
        'tenant',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, slug;
    `);

    const org1Id = org1[0].id;
    const org2Id = org2[0].id;

    console.log(`✅ Organização Alpha: ${org1Id}`);
    console.log(`✅ Organização Beta: ${org2Id}\n`);

    // 2. Deletar usuários existentes primeiro
    console.log('🗑️  Limpando usuários existentes...');
    await sequelize.query(`DELETE FROM client_users WHERE email = '${TEST_EMAIL}';`);
    await sequelize.query(`DELETE FROM organization_users WHERE email = '${TEST_EMAIL}';`);
    console.log('✅ Usuários antigos removidos\n');

    // 3. Criar usuário na Organização Alpha
    console.log('👤 Criando usuários de organização...');
    
    const [user1] = await sequelize.query(`
      INSERT INTO organization_users (
        id, organization_id, name, email, password, role, is_active, created_at, updated_at
      )
      VALUES (
        '${uuidv4()}',
        '${org1Id}',
        'João Multi-Contexto',
        '${TEST_EMAIL}',
        '${hashedPassword}',
        'org-admin',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, name, email, role;
    `);

    console.log(`✅ Usuário em Alpha: ${user1[0].name} (${user1[0].role})`);

    // 4. Criar usuário na Organização Beta (mesmo email)
    const [user2] = await sequelize.query(`
      INSERT INTO organization_users (
        id, organization_id, name, email, password, role, is_active, created_at, updated_at
      )
      VALUES (
        '${uuidv4()}',
        '${org2Id}',
        'João Multi-Contexto',
        '${TEST_EMAIL}',
        '${hashedPassword}',
        'agent',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, name, email, role;
    `);

    console.log(`✅ Usuário em Beta: ${user2[0].name} (${user2[0].role})\n`);

    // 5. Criar empresa cliente na Organização Alpha
    console.log('🏢 Criando empresa cliente...');
    
    // Verificar se já existe
    const [existingClient] = await sequelize.query(`
      SELECT id, name, email FROM clients
      WHERE organization_id = '${org1Id}' AND name = 'Empresa Cliente Gamma'
      LIMIT 1;
    `);

    let clientId;
    if (existingClient.length > 0) {
      clientId = existingClient[0].id;
      console.log(`✅ Cliente já existe: ${existingClient[0].name} (${clientId})\n`);
    } else {
      const [client] = await sequelize.query(`
        INSERT INTO clients (
          id, organization_id, name, email, is_active, created_at, updated_at
        )
        VALUES (
          '${uuidv4()}',
          '${org1Id}',
          'Empresa Cliente Gamma',
          'contato@gamma.com',
          true,
          NOW(),
          NOW()
        )
        RETURNING id, name, email;
      `);
      clientId = client[0].id;
      console.log(`✅ Cliente criado: ${client[0].name} (${clientId})\n`);
    }

    // 6. Criar usuário da empresa cliente (mesmo email)
    console.log('👤 Criando usuário de empresa cliente...');
    
    const [clientUser] = await sequelize.query(`
      INSERT INTO client_users (
        id, organization_id, client_id, name, email, password, role, is_active, created_at, updated_at
      )
      VALUES (
        '${uuidv4()}',
        '${org1Id}',
        '${clientId}',
        'João Multi-Contexto',
        '${TEST_EMAIL}',
        '${hashedPassword}',
        'client-admin',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, name, email, role;
    `);

    console.log(`✅ Usuário Cliente: ${clientUser[0].name} (${clientUser[0].role})\n`);

    // 7. Resumo
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DADOS DE TESTE CRIADOS COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📧 Email de teste: ' + TEST_EMAIL);
    console.log('🔑 Senha de teste: ' + TEST_PASSWORD);
    console.log('\n📊 Contextos disponíveis para este email:\n');
    
    console.log('1️⃣  Organização Alpha (org-admin)');
    console.log(`   ID: ${org1Id}`);
    console.log(`   Type: organization\n`);

    console.log('2️⃣  Organização Beta (agent)');
    console.log(`   ID: ${org2Id}`);
    console.log(`   Type: organization\n`);

    console.log('3️⃣  Empresa Cliente Gamma (client-admin)');
    console.log(`   ID: ${clientId}`);
    console.log(`   Type: client\n`);

    console.log('🧪 Para testar:');
    console.log('1. Fazer login com o email acima');
    console.log('2. Sistema deve retornar 3 contextos disponíveis');
    console.log('3. Selecionar um contexto');
    console.log('4. Trocar entre contextos usando o ContextSwitcher\n');

    console.log('📝 Comando de teste:');
    console.log(`curl -X POST http://localhost:4003/api/auth/login \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email": "${TEST_EMAIL}", "password": "${TEST_PASSWORD}"}'`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error.message);
    if (error.original) {
      console.error('Detalhes:', error.original.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createTestData();
