import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const runSimpleSeed = async () => {
  try {
    console.log('\n🌱 Executando seed simplificado...\n');

    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados\n');

    // Buscar provider
    const [providers] = await sequelize.query(`
      SELECT id, name FROM organizations WHERE type = 'provider' LIMIT 1;
    `);

    if (providers.length === 0) {
      console.log('❌ Provider não encontrado. Execute provider-seed.js primeiro.');
      process.exit(1);
    }

    const provider = providers[0];
    console.log(`✅ Provider: ${provider.name}\n`);

    // Buscar tenant
    const [tenants] = await sequelize.query(`
      SELECT id, name FROM organizations WHERE type = 'tenant' LIMIT 1;
    `);

    if (tenants.length === 0) {
      console.log('⚠️  Nenhum tenant encontrado. Criando tenant demo...\n');
      
      await sequelize.query(`
        INSERT INTO organizations (
          id, type, parent_id, name, trade_name, tax_id, slug,
          email, phone, primary_color, secondary_color,
          subscription, deployment, settings, is_active
        ) VALUES (
          gen_random_uuid(),
          'tenant',
          '${provider.id}',
          'Empresa Demo',
          'Empresa Demo Lda',
          '987654321',
          'empresa-demo',
          'contato@empresademo.com',
          '+351 220 000 000',
          '#3B82F6',
          '#10B981',
          '{"plan":"professional","status":"active","maxUsers":50,"maxClients":100,"maxStorageGB":100}',
          '{"type":"saas","region":"eu-west"}',
          '{"language":"pt","timezone":"Europe/Lisbon","dateFormat":"DD/MM/YYYY"}',
          true
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id, name;
      `);
    }

    // Buscar tenant novamente
    const [tenantsAfter] = await sequelize.query(`
      SELECT id, name FROM organizations WHERE type = 'tenant' LIMIT 1;
    `);
    const tenant = tenantsAfter[0];
    console.log(`✅ Tenant: ${tenant.name}\n`);

    // Criar Direções
    console.log('📁 Criando Direções...');
    await sequelize.query(`
      INSERT INTO directions (id, organization_id, name, description, code, is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), '${tenant.id}', 'Direção Geral', 'Direção executiva', 'DG', true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'Direção Técnica', 'Direção de TI', 'DT', true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'Direção Comercial', 'Direção de vendas', 'DC', true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Direções criadas\n');

    // Buscar direção técnica
    const [directions] = await sequelize.query(`
      SELECT id FROM directions WHERE organization_id = '${tenant.id}' AND code = 'DT' LIMIT 1;
    `);
    const directionId = directions[0].id;

    // Criar Departamentos
    console.log('🏷️  Criando Departamentos...');
    await sequelize.query(`
      INSERT INTO departments (id, organization_id, direction_id, name, description, email, is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), '${tenant.id}', '${directionId}', 'Suporte Técnico', 'Atendimento técnico', 'suporte@empresademo.com', true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', '${directionId}', 'Desenvolvimento', 'Desenvolvimento de software', 'dev@empresademo.com', true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Departamentos criados\n');

    // Buscar departamento
    const [departments] = await sequelize.query(`
      SELECT id FROM departments WHERE organization_id = '${tenant.id}' LIMIT 1;
    `);
    const departmentId = departments[0].id;

    // Criar Categorias do Catálogo
    console.log('🔖 Criando Categorias do Catálogo...');
    await sequelize.query(`
      INSERT INTO catalog_categories (id, organization_id, name, description, icon, color, "order", is_active)
      VALUES
        (gen_random_uuid(), '${tenant.id}', 'Tecnologia da Informação', 'Serviços de TI', 'Monitor', '#3B82F6', 1, true),
        (gen_random_uuid(), '${tenant.id}', 'Recursos Humanos', 'Serviços de RH', 'Users', '#10B981', 2, true),
        (gen_random_uuid(), '${tenant.id}', 'Facilities', 'Serviços de infraestrutura', 'Building', '#F59E0B', 3, true)
      ON CONFLICT (organization_id, name) DO NOTHING;
    `);
    console.log('✅ Categorias criadas\n');

    // Criar SLAs
    console.log('⏱️  Criando SLAs...');
    await sequelize.query(`
      INSERT INTO slas (id, organization_id, name, priority, response_time_minutes, resolution_time_minutes, created_at, updated_at)
      VALUES
        (gen_random_uuid(), '${tenant.id}', 'SLA Urgente', 'urgente', 60, 240, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'SLA Alta', 'alta', 240, 480, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'SLA Média', 'media', 480, 1440, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'SLA Baixa', 'baixa', 1440, 2880, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ SLAs criados\n');

    // Criar Prioridades
    console.log('🎯 Criando Prioridades...');
    await sequelize.query(`
      INSERT INTO priorities (id, organization_id, name, color, "order", is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), '${tenant.id}', 'Urgente', '#EF4444', 1, true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'Alta', '#F59E0B', 2, true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'Média', '#3B82F6', 3, true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'Baixa', '#10B981', 4, true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Prioridades criadas\n');

    // Criar Tipos
    console.log('📋 Criando Tipos...');
    await sequelize.query(`
      INSERT INTO types (id, organization_id, name, description, icon, color, "order", is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), '${tenant.id}', 'Suporte', 'Solicitações de suporte técnico', 'headphones', '#3B82F6', 1, true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'Incidente', 'Problemas e incidentes', 'alert-triangle', '#EF4444', 2, true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'Requisição', 'Requisições de serviço', 'package', '#8B5CF6', 3, true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', 'Mudança', 'Solicitações de mudança', 'git-branch', '#F59E0B', 4, true, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Tipos criados\n');

    // Criar Usuários do Tenant (organization_users)
    console.log('👥 Criando Usuários do Tenant...');
    const hashedPassword1 = await bcrypt.hash('TenantAdmin@123', 10);
    const hashedPassword2 = await bcrypt.hash('TenantAgente@123', 10);
    const hashedPassword3 = await bcrypt.hash('TenantManager@123', 10);

    await sequelize.query(`
      INSERT INTO organization_users (
        id, organization_id, department_id, name, email, password, role, phone, is_active, created_at, updated_at
      ) VALUES
        (gen_random_uuid(), '${tenant.id}', '${departmentId}', 'Admin Tenant', 'tenant-admin@empresademo.com', '${hashedPassword1}', 'org-admin', '+351 910 100 001', true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', '${departmentId}', 'Agente Suporte', 'tenant-agente@empresademo.com', '${hashedPassword2}', 'agent', '+351 910 100 002', true, NOW(), NOW()),
        (gen_random_uuid(), '${tenant.id}', '${departmentId}', 'Manager Suporte', 'tenant-manager@empresademo.com', '${hashedPassword3}', 'org-manager', '+351 910 100 003', true, NOW(), NOW())
      ON CONFLICT (organization_id, email) DO NOTHING;
    `);
    console.log('✅ Usuários do Tenant criados\n');

    // Criar Clientes B2B
    console.log('🏪 Criando Clientes B2B...');
    await sequelize.query(`
      INSERT INTO clients (
        id, organization_id, name, trade_name, tax_id, industry_type,
        email, phone, website, address, contract, billing, is_active, created_at, updated_at
      ) VALUES
        (
          gen_random_uuid(),
          '${tenant.id}',
          'Cliente Demo SA',
          'Cliente Demo',
          '111222333',
          'technology',
          'contato@clientedemo.com',
          '+351 230 000 000',
          'https://clientedemo.com',
          '{"street":"Praça do Comércio","number":"100","city":"Lisboa","postalCode":"1100-148","country":"PT"}',
          '{"contractNumber":"CNT-2025-001","status":"active","slaLevel":"premium","maxUsers":50}',
          '{"billingEmail":"financeiro@clientedemo.com","paymentMethod":"bank-transfer","monthlyValue":299.99,"currency":"EUR"}',
          true,
          NOW(),
          NOW()
        ),
        (
          gen_random_uuid(),
          '${tenant.id}',
          'TechCorp Lda',
          'TechCorp',
          '444555666',
          'technology',
          'contato@techcorp.com',
          '+351 240 000 000',
          'https://techcorp.com',
          '{"street":"Avenida Boavista","number":"2000","city":"Porto","postalCode":"4100-120","country":"PT"}',
          '{"contractNumber":"CNT-2025-002","status":"active","slaLevel":"standard","maxUsers":20}',
          '{"billingEmail":"billing@techcorp.com","paymentMethod":"credit-card","monthlyValue":149.99,"currency":"EUR"}',
          true,
          NOW(),
          NOW()
        )
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Clientes B2B criados\n');

    // Buscar clientes
    const [clients] = await sequelize.query(`
      SELECT id, name FROM clients WHERE organization_id = '${tenant.id}' ORDER BY name LIMIT 2;
    `);

    if (clients.length >= 2) {
      // Criar Usuários dos Clientes
      console.log('👤 Criando Usuários dos Clientes...');
      const clientPass1 = await bcrypt.hash('ClientAdmin@123', 10);
      const clientPass2 = await bcrypt.hash('ClientUser@123', 10);
      const clientPass3 = await bcrypt.hash('TechAdmin@123', 10);
      const clientPass4 = await bcrypt.hash('TechUser@123', 10);

      await sequelize.query(`
        INSERT INTO client_users (
          id, organization_id, client_id, name, email, password, role, phone, position, is_active, created_at, updated_at
        ) VALUES
          (gen_random_uuid(), '${tenant.id}', '${clients[0].id}', 'Admin Cliente Demo', 'admin@clientedemo.com', '${clientPass1}', 'client-admin', '+351 960 100 001', 'Administrador TI', true, NOW(), NOW()),
          (gen_random_uuid(), '${tenant.id}', '${clients[0].id}', 'User Cliente Demo', 'user@clientedemo.com', '${clientPass2}', 'client-user', '+351 960 100 002', 'Analista', true, NOW(), NOW()),
          (gen_random_uuid(), '${tenant.id}', '${clients[1].id}', 'Admin TechCorp', 'admin@techcorp.com', '${clientPass3}', 'client-admin', '+351 960 200 001', 'IT Manager', true, NOW(), NOW()),
          (gen_random_uuid(), '${tenant.id}', '${clients[1].id}', 'User TechCorp', 'user@techcorp.com', '${clientPass4}', 'client-user', '+351 960 200 002', 'Developer', true, NOW(), NOW())
        ON CONFLICT (organization_id, client_id, email) DO NOTHING;
      `);
      console.log('✅ Usuários dos Clientes criados\n');
    }

    // Resumo
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ SEED COMPLETO COM SUCESSO!                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔐 CREDENCIAIS DE ACESSO:\n');
    console.log('━━━ PROVIDER (Backoffice SaaS) ━━━');
    console.log('Super Admin: superadmin@tatuticket.com / Super@123');
    console.log('Provider Admin: provideradmin@tatuticket.com / Provider@123\n');

    console.log('━━━ TENANT (Portal Organização) ━━━');
    console.log('Tenant Admin: tenant-admin@empresademo.com / TenantAdmin@123');
    console.log('Agente: tenant-agente@empresademo.com / TenantAgente@123');
    console.log('Manager: tenant-manager@empresademo.com / TenantManager@123\n');

    console.log('━━━ CLIENTES B2B (Portal Cliente) ━━━');
    console.log('Cliente Demo SA:');
    console.log('  Admin: admin@clientedemo.com / ClientAdmin@123');
    console.log('  User: user@clientedemo.com / ClientUser@123\n');
    console.log('TechCorp Lda:');
    console.log('  Admin: admin@techcorp.com / TechAdmin@123');
    console.log('  User: user@techcorp.com / TechUser@123\n');

    console.log('✨ Sistema pronto para uso!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
};

runSimpleSeed();
