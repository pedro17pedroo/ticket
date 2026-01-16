import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { connectPostgreSQL, connectMongoDB, syncDatabase } from '../config/database.js';
import {
  Organization,
  User,
  Client,
  ClientUser,
  Department,
  Direction,
  CatalogCategory,
  SLA,
  Priority,
  Type,
  setupAssociations
} from '../modules/models/index.js';
import logger from '../config/logger.js';

const runMultiTenantSeed = async () => {
  try {
    logger.info('🌱 Iniciando seed Multi-Tenant B2B2C...\n');

    // Conectar bancos
    await connectPostgreSQL();
    await connectMongoDB();
    setupAssociations();
    await syncDatabase();

    // ==========================================
    // 1. BUSCAR ORGANIZAÇÃO PROVIDER (TatuTicket)
    // ==========================================
    logger.info('📦 Buscando Organização Provider...');
    const provider = await Organization.findOne({
      where: { type: 'provider' }
    });

    if (!provider) {
      logger.error('❌ Provider não encontrado!');
      logger.error('➡️  Execute primeiro: node src/seeds/provider-seed.js');
      process.exit(1);
    }

    logger.info(`✅ Provider encontrado: ${provider.name} (ID: ${provider.id})\n`);

    // ==========================================
    // 3. CRIAR ORGANIZAÇÃO TENANT DEMO
    // ==========================================
    logger.info('🏢 Criando Organização Tenant Demo...');
    const [tenant] = await Organization.findOrCreate({
      where: { slug: 'empresa-demo' },
      defaults: {
        type: 'tenant',
        parentId: provider.id,
        name: 'Empresa Demo',
        tradeName: 'Empresa Demo Lda',
        taxId: '987654321',
        slug: 'empresa-demo',
        email: 'contato@empresademo.com',
        phone: '+351 220 000 000',
        address: 'Rua das Flores, 500, Porto, Portugal',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        subscription: {
          plan: 'professional',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
          maxUsers: 50,
          maxClients: 100,
          maxStorageGB: 100,
          features: ['sla', 'automation', 'reports', 'api']
        },
        deployment: {
          type: 'saas',
          region: 'eu-west',
          customDomain: null
        },
        settings: {
          language: 'pt',
          timezone: 'Europe/Lisbon',
          dateFormat: 'DD/MM/YYYY',
          allowSelfRegistration: true,
          requireApproval: false,
          sessionTimeout: 480,
          twoFactorAuth: false
        },
        isActive: true
      }
    });
    logger.info(`✅ Tenant criado: ${tenant.name}\n`);

    // ==========================================
    // 4. CRIAR DIREÇÕES DO TENANT
    // ==========================================
    logger.info('📁 Criando Direções do Tenant...');
    const directions = await Direction.bulkCreate([
      {
        organizationId: tenant.id,
        name: 'Direção Geral',
        description: 'Direção executiva e administrativa',
        code: 'DG'
      },
      {
        organizationId: tenant.id,
        name: 'Direção Técnica',
        description: 'Direção de tecnologia e desenvolvimento',
        code: 'DT'
      },
      {
        organizationId: tenant.id,
        name: 'Direção Comercial',
        description: 'Direção de vendas e marketing',
        code: 'DC'
      },
      {
        organizationId: tenant.id,
        name: 'Direção Operacional',
        description: 'Direção de operações e suporte',
        code: 'DO'
      }
    ], { ignoreDuplicates: true });
    logger.info(`✅ ${directions.length} direções criadas\n`);

    // ==========================================
    // 5. CRIAR DEPARTAMENTOS DO TENANT
    // ==========================================
    logger.info('🏷️  Criando Departamentos do Tenant...');
    const departments = await Department.bulkCreate([
      {
        organizationId: tenant.id,
        directionId: directions[1].id, // Direção Técnica
        name: 'Suporte Técnico',
        description: 'Atendimento e resolução de problemas técnicos',
        email: 'suporte@empresademo.com'
      },
      {
        organizationId: tenant.id,
        directionId: directions[1].id, // Direção Técnica
        name: 'Desenvolvimento',
        description: 'Implementações e customizações',
        email: 'dev@empresademo.com'
      },
      {
        organizationId: tenant.id,
        directionId: directions[2].id, // Direção Comercial
        name: 'Comercial',
        description: 'Vendas e relacionamento com cliente',
        email: 'comercial@empresademo.com'
      }
    ]);
    logger.info(`✅ ${departments.length} departamentos criados\n`);

    // ==========================================
    // 6. CRIAR CATEGORIAS, SLAs, PRIORIDADES, TIPOS
    // ==========================================
    logger.info('🔖 Criando Categorias, SLAs, Prioridades...');
    const categories = await CatalogCategory.bulkCreate([
      {
        organizationId: tenant.id,
        name: 'Bug / Erro',
        description: 'Problemas e erros no sistema',
        icon: 'bug',
        color: '#EF4444'
      },
      {
        organizationId: tenant.id,
        name: 'Nova Funcionalidade',
        description: 'Solicitações de novas features',
        icon: 'sparkles',
        color: '#8B5CF6'
      },
      {
        organizationId: tenant.id,
        name: 'Dúvida',
        description: 'Questões sobre uso do sistema',
        icon: 'help-circle',
        color: '#3B82F6'
      }
    ]);

    const slas = await SLA.bulkCreate([
      {
        organizationId: tenant.id,
        name: 'SLA Urgente',
        priority: 'urgente',
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 240
      },
      {
        organizationId: tenant.id,
        name: 'SLA Alta',
        priority: 'alta',
        responseTimeMinutes: 240,
        resolutionTimeMinutes: 480
      },
      {
        organizationId: tenant.id,
        name: 'SLA Média',
        priority: 'media',
        responseTimeMinutes: 480,
        resolutionTimeMinutes: 1440
      }
    ]);

    const priorities = await Priority.bulkCreate([
      {
        organizationId: tenant.id,
        name: 'Urgente',
        value: 'urgente',
        color: '#EF4444',
        order: 1
      },
      {
        organizationId: tenant.id,
        name: 'Alta',
        value: 'alta',
        color: '#F59E0B',
        order: 2
      },
      {
        organizationId: tenant.id,
        name: 'Média',
        value: 'media',
        color: '#3B82F6',
        order: 3
      },
      {
        organizationId: tenant.id,
        name: 'Baixa',
        value: 'baixa',
        color: '#10B981',
        order: 4
      }
    ]);

    const types = await Type.bulkCreate([
      {
        organizationId: tenant.id,
        name: 'Suporte',
        value: 'suporte',
        icon: 'headphones',
        color: '#3B82F6'
      },
      {
        organizationId: tenant.id,
        name: 'Incidente',
        value: 'incidente',
        icon: 'alert-triangle',
        color: '#EF4444'
      },
      {
        organizationId: tenant.id,
        name: 'Requisição',
        value: 'requisicao',
        icon: 'package',
        color: '#8B5CF6'
      }
    ]);
    logger.info(`✅ Categorias, SLAs, Prioridades e Tipos criados\n`);

    // ==========================================
    // 7. CRIAR USUÁRIOS DO TENANT (Staff Interno)
    // ==========================================
    logger.info('👥 Criando usuários do Tenant (Staff)...');
    const tenantUsers = await User.bulkCreate([
      {
        organizationId: tenant.id,
        departmentId: departments[0].id,
        name: 'Admin Tenant',
        email: 'tenant-admin@empresademo.com',
        password: 'TenantAdmin@123',
        role: 'tenant-admin',
        phone: '+351 910 100 001',
        permissions: {
          canManageUsers: true,
          canManageClients: true,
          canManageTickets: true,
          canViewReports: true,
          canManageSettings: true,
          canAccessAPI: true
        }
      },
      {
        organizationId: tenant.id,
        departmentId: departments[0].id,
        name: 'Agente Suporte',
        email: 'tenant-agente@empresademo.com',
        password: 'TenantAgente@123',
        role: 'agent',
        phone: '+351 910 100 002'
      },
      {
        organizationId: tenant.id,
        departmentId: departments[0].id,
        name: 'Manager Suporte',
        email: 'tenant-manager@empresademo.com',
        password: 'TenantManager@123',
        role: 'tenant-manager',
        phone: '+351 910 100 003'
      }
    ], { individualHooks: true });
    logger.info(`✅ ${tenantUsers.length} usuários Tenant criados\n`);

    // ==========================================
    // 8. CRIAR EMPRESAS CLIENTES B2B
    // ==========================================
    logger.info('🏪 Criando Empresas Clientes B2B...');
    const clients = await Client.bulkCreate([
      {
        organizationId: tenant.id,
        name: 'Cliente Demo SA',
        tradeName: 'Cliente Demo',
        taxId: '111222333',
        industryType: 'technology',
        email: 'contato@clientedemo.com',
        phone: '+351 230 000 000',
        website: 'https://clientedemo.com',
        address: {
          street: 'Praça do Comércio',
          number: '100',
          city: 'Lisboa',
          postalCode: '1100-148',
          country: 'PT'
        },
        contract: {
          contractNumber: 'CNT-2025-001',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'active',
          slaLevel: 'premium',
          supportHours: '24x7',
          responseTimeSLA: 30,
          resolutionTimeSLA: 240,
          maxUsers: 50,
          maxTicketsPerMonth: 200
        },
        billing: {
          billingEmail: 'financeiro@clientedemo.com',
          billingContact: 'João Silva',
          billingPhone: '+351 230 000 001',
          paymentMethod: 'bank-transfer',
          billingCycle: 'monthly',
          monthlyValue: 299.99,
          currency: 'EUR'
        },
        primaryContact: {
          name: 'Maria Santos',
          email: 'maria.santos@clientedemo.com',
          phone: '+351 960 000 001',
          position: 'CTO'
        },
        isActive: true
      },
      {
        organizationId: tenant.id,
        name: 'TechCorp Lda',
        tradeName: 'TechCorp',
        taxId: '444555666',
        industryType: 'technology',
        email: 'contato@techcorp.com',
        phone: '+351 240 000 000',
        website: 'https://techcorp.com',
        address: {
          street: 'Avenida Boavista',
          number: '2000',
          city: 'Porto',
          postalCode: '4100-120',
          country: 'PT'
        },
        contract: {
          contractNumber: 'CNT-2025-002',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'active',
          slaLevel: 'standard',
          supportHours: 'business-hours',
          responseTimeSLA: 120,
          resolutionTimeSLA: 480,
          maxUsers: 20,
          maxTicketsPerMonth: 100
        },
        billing: {
          billingEmail: 'billing@techcorp.com',
          paymentMethod: 'credit-card',
          billingCycle: 'monthly',
          monthlyValue: 149.99,
          currency: 'EUR'
        },
        isActive: true
      }
    ]);
    logger.info(`✅ ${clients.length} empresas clientes criadas\n`);

    // ==========================================
    // 9. CRIAR USUÁRIOS DAS EMPRESAS CLIENTES
    // ==========================================
    logger.info('👤 Criando Usuários das Empresas Clientes...');
    const clientUsers = await ClientUser.bulkCreate([
      // Usuários do Cliente Demo SA
      {
        organizationId: tenant.id,
        clientId: clients[0].id,
        name: 'Admin Cliente Demo',
        email: 'admin@clientedemo.com',
        password: 'ClientAdmin@123',
        role: 'client-admin',
        phone: '+351 960 100 001',
        position: 'Administrador TI',
        departmentName: 'TI',
        permissions: {
          canCreateTickets: true,
          canViewAllClientTickets: true,
          canApproveRequests: true,
          canAccessKnowledgeBase: true,
          canRequestServices: true
        },
        emailVerified: true,
        emailVerifiedAt: new Date()
      },
      {
        organizationId: tenant.id,
        clientId: clients[0].id,
        name: 'User Cliente Demo',
        email: 'user@clientedemo.com',
        password: 'ClientUser@123',
        role: 'client-user',
        phone: '+351 960 100 002',
        position: 'Analista',
        departmentName: 'Operações',
        emailVerified: true,
        emailVerifiedAt: new Date()
      },
      // Usuários da TechCorp
      {
        organizationId: tenant.id,
        clientId: clients[1].id,
        name: 'Admin TechCorp',
        email: 'admin@techcorp.com',
        password: 'TechAdmin@123',
        role: 'client-admin',
        phone: '+351 960 200 001',
        position: 'IT Manager',
        departmentName: 'Tecnologia',
        permissions: {
          canCreateTickets: true,
          canViewAllClientTickets: true,
          canApproveRequests: true,
          canAccessKnowledgeBase: true,
          canRequestServices: true
        },
        emailVerified: true,
        emailVerifiedAt: new Date()
      },
      {
        organizationId: tenant.id,
        clientId: clients[1].id,
        name: 'User TechCorp',
        email: 'user@techcorp.com',
        password: 'TechUser@123',
        role: 'client-user',
        phone: '+351 960 200 002',
        position: 'Developer',
        departmentName: 'Desenvolvimento',
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    ], { individualHooks: true });
    logger.info(`✅ ${clientUsers.length} usuários de clientes criados\n`);

    // ==========================================
    // RESUMO
    // ==========================================
    logger.info('\n📋 ========================================');
    logger.info('   SEED MULTI-TENANT B2B2C COMPLETO!');
    logger.info('========================================\n');

    logger.info('🔐 CREDENCIAIS DE ACESSO:\n');

    logger.info('━━━ PROVIDER (Super Admin) ━━━');
    logger.info('Super Admin: superadmin@tatuticket.com / Super@123');
    logger.info('Provider Admin: provideradmin@tatuticket.com / Provider@123\n');

    logger.info('━━━ TENANT (Empresa Demo - Staff) ━━━');
    logger.info('Tenant Admin: tenant-admin@empresademo.com / TenantAdmin@123');
    logger.info('Agente: tenant-agente@empresademo.com / TenantAgente@123');
    logger.info('Manager: tenant-manager@empresademo.com / TenantManager@123\n');

    logger.info('━━━ CLIENTES B2B ━━━');
    logger.info('Cliente Demo SA:');
    logger.info('  Admin: admin@clientedemo.com / ClientAdmin@123');
    logger.info('  User: user@clientedemo.com / ClientUser@123\n');
    logger.info('TechCorp Lda:');
    logger.info('  Admin: admin@techcorp.com / TechAdmin@123');
    logger.info('  User: user@techcorp.com / TechUser@123\n');

    logger.info('━━━ ESTATÍSTICAS ━━━');
    logger.info(`✅ Provider: ${provider.name}`);
    logger.info(`✅ 1 Tenant Demo`);
    logger.info(`✅ 2 Empresas Clientes B2B`);
    logger.info(`✅ ${tenantUsers.length} Usuários Tenant (Staff)`);
    logger.info(`✅ ${clientUsers.length} Usuários Clientes`);
    logger.info(`✅ ${departments.length} Departamentos`);
    logger.info(`✅ ${categories.length} Categorias`);
    logger.info(`✅ ${slas.length} SLAs`);
    logger.info(`✅ ${priorities.length} Prioridades`);
    logger.info(`✅ ${types.length} Tipos`);
    logger.info('\n✨ Sistema pronto para uso!\n');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
};

runMultiTenantSeed();
