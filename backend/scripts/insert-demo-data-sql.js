import { sequelize } from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function insertData() {
  try {
    console.log('🎨 Criando dados via SQL...\n');

    // Buscar tenant
    const [tenants] = await sequelize.query(`SELECT id FROM organizations WHERE type = 'tenant' LIMIT 1;`);
    if (!tenants.length) {
      console.log('❌ Nenhum tenant encontrado');
      process.exit(1);
    }
    const tenantId = tenants[0].id;
    console.log(`✅ Tenant ID: ${tenantId}`);

    const hashedPassword = await bcrypt.hash('ClientAdmin@123', 10);

    // Inserir cliente ACME
    await sequelize.query(`
      INSERT INTO clients (id, organization_id, name, email, phone, address, is_active, created_at, updated_at)
      VALUES (
        '11111111-1111-1111-1111-111111111111',
        '${tenantId}',
        'ACME Technologies Lda',
        'contato@acme.pt',
        '+351 210 000 100',
        '{"city": "Lisboa", "country": "PT"}'::jsonb,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Cliente ACME criado');

    // Inserir admin ACME
    await sequelize.query(`
      INSERT INTO client_users (id, organization_id, client_id, name, email, password, role, is_active, created_at, updated_at)
      VALUES (
        '22222222-2222-2222-2222-222222222222',
        '${tenantId}',
        '11111111-1111-1111-1111-111111111111',
        'Admin ACME',
        'admin@acme.pt',
        '${hashedPassword}',
        'client-admin',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Admin ACME criado');

    // Inserir user ACME
    await sequelize.query(`
      INSERT INTO client_users (id, organization_id, client_id, name, email, password, role, is_active, created_at, updated_at)
      VALUES (
        '33333333-3333-3333-3333-333333333333',
        '${tenantId}',
        '11111111-1111-1111-1111-111111111111',
        'Maria Santos',
        'user@acme.pt',
        '${hashedPassword}',
        'client-user',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ User ACME criado');

    // Inserir cliente TechSolutions
    await sequelize.query(`
      INSERT INTO clients (id, organization_id, name, email, phone, address, is_active, created_at, updated_at)
      VALUES (
        '44444444-4444-4444-4444-444444444444',
        '${tenantId}',
        'Tech Solutions Portugal',
        'info@techsolutions.pt',
        '+351 220 000 200',
        '{"city": "Porto", "country": "PT"}'::jsonb,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Cliente TechSolutions criado');

    // Inserir admin TechSolutions
    await sequelize.query(`
      INSERT INTO client_users (id, organization_id, client_id, name, email, password, role, is_active, created_at, updated_at)
      VALUES (
        '55555555-5555-5555-5555-555555555555',
        '${tenantId}',
        '44444444-4444-4444-4444-444444444444',
        'Pedro Costa',
        'admin@techsolutions.pt',
        '${hashedPassword}',
        'client-admin',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Admin TechSolutions criado');

    console.log('\n🎉 Dados criados com sucesso!');
    console.log('\n📋 Credenciais:');
    console.log('   ACME:');
    console.log('     admin@acme.pt / ClientAdmin@123');
    console.log('     user@acme.pt / ClientAdmin@123');
    console.log('   TechSolutions:');
    console.log('     admin@techsolutions.pt / ClientAdmin@123');

    // Verificar
    const [clients] = await sequelize.query('SELECT COUNT(*) as count FROM clients;');
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM client_users;');
    console.log(`\n📊 Total: ${clients[0].count} clientes, ${users[0].count} client users`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

insertData();
