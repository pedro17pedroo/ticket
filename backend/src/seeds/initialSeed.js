import dotenv from 'dotenv';
dotenv.config();

import { connectPostgreSQL, connectMongoDB, syncDatabase } from '../config/database.js';
import { 
  Organization, 
  User, 
  Department, 
  Category, 
  SLA,
  setupAssociations 
} from '../modules/models/index.js';
import logger from '../config/logger.js';

const runSeed = async () => {
  try {
    logger.info('🌱 Iniciando seed do banco de dados...');

    // Conectar bancos
    await connectPostgreSQL();
    await connectMongoDB();
    setupAssociations();
    await syncDatabase();

    // 1. Criar Organização Demo
    const [organization] = await Organization.findOrCreate({
      where: { slug: 'empresa-demo' },
      defaults: {
        name: 'Empresa Demo',
        slug: 'empresa-demo',
        email: 'contato@empresademo.com',
        phone: '+351 210 000 000',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        settings: {
          language: 'pt',
          timezone: 'Europe/Lisbon',
          dateFormat: 'DD/MM/YYYY',
          allowSelfRegistration: true
        }
      }
    });
    logger.info(`✅ Organização criada: ${organization.name}`);

    // 2. Criar Departamentos
    const departments = await Department.bulkCreate([
      {
        organizationId: organization.id,
        name: 'Suporte Técnico',
        description: 'Atendimento e resolução de problemas técnicos',
        email: 'suporte@empresademo.com'
      },
      {
        organizationId: organization.id,
        name: 'Desenvolvimento',
        description: 'Implementações e customizações',
        email: 'dev@empresademo.com'
      },
      {
        organizationId: organization.id,
        name: 'Comercial',
        description: 'Vendas e relacionamento com cliente',
        email: 'comercial@empresademo.com'
      }
    ]);
    logger.info(`✅ ${departments.length} departamentos criados`);

    // 3. Criar Categorias
    const categories = await Category.bulkCreate([
      {
        organizationId: organization.id,
        name: 'Bug / Erro',
        description: 'Problemas e erros no sistema',
        icon: 'bug',
        color: '#EF4444'
      },
      {
        organizationId: organization.id,
        name: 'Nova Funcionalidade',
        description: 'Solicitações de novas features',
        icon: 'sparkles',
        color: '#8B5CF6'
      },
      {
        organizationId: organization.id,
        name: 'Dúvida',
        description: 'Questões sobre uso do sistema',
        icon: 'help-circle',
        color: '#3B82F6'
      },
      {
        organizationId: organization.id,
        name: 'Implementação',
        description: 'Customizações e implementações',
        icon: 'code',
        color: '#10B981'
      }
    ]);
    logger.info(`✅ ${categories.length} categorias criadas`);

    // 4. Criar SLAs
    const slas = await SLA.bulkCreate([
      {
        organizationId: organization.id,
        name: 'SLA Urgente',
        priority: 'urgente',
        responseTimeMinutes: 60, // 1 hora
        resolutionTimeMinutes: 240 // 4 horas
      },
      {
        organizationId: organization.id,
        name: 'SLA Alta',
        priority: 'alta',
        responseTimeMinutes: 240, // 4 horas
        resolutionTimeMinutes: 480 // 8 horas
      },
      {
        organizationId: organization.id,
        name: 'SLA Média',
        priority: 'media',
        responseTimeMinutes: 480, // 8 horas
        resolutionTimeMinutes: 1440 // 24 horas
      },
      {
        organizationId: organization.id,
        name: 'SLA Baixa',
        priority: 'baixa',
        responseTimeMinutes: 1440, // 24 horas
        resolutionTimeMinutes: 2880 // 48 horas
      }
    ]);
    logger.info(`✅ ${slas.length} SLAs criados`);

    // 5. Criar Usuários Demo
    const users = await User.bulkCreate([
      {
        organizationId: organization.id,
        departmentId: departments[0].id, // Suporte
        name: 'Admin Sistema',
        email: 'admin@empresademo.com',
        password: 'Admin@123',
        role: 'admin-org',
        phone: '+351 910 000 001'
      },
      {
        organizationId: organization.id,
        departmentId: departments[0].id, // Suporte
        name: 'Agente Suporte',
        email: 'agente@empresademo.com',
        password: 'Agente@123',
        role: 'agente',
        phone: '+351 910 000 002'
      },
      {
        organizationId: organization.id,
        name: 'Cliente Demo',
        email: 'cliente@empresademo.com',
        password: 'Cliente@123',
        role: 'cliente-org',
        phone: '+351 910 000 003'
      }
    ], { individualHooks: true }); // Para trigger de hash de senha
    logger.info(`✅ ${users.length} usuários criados`);

    logger.info('\n📋 Credenciais de Acesso:');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('Admin:   admin@empresademo.com / Admin@123');
    logger.info('Agente:  agente@empresademo.com / Agente@123');
    logger.info('Cliente: cliente@empresademo.com / Cliente@123');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    logger.info('✨ Seed concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
};

runSeed();
