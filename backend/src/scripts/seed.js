import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database.js';
import { Organization, User, Department, Category, SLA } from '../modules/models/index.js';
import logger from '../config/logger.js';

const seed = async () => {
  try {
    logger.info('🌱 Iniciando seed da base de dados...');

    // Criar organização demo
    const org = await Organization.findOrCreate({
      where: { slug: 'empresa-demo' },
      defaults: {
        name: 'Empresa Demo',
        slug: 'empresa-demo',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        email: 'contato@empresademo.com',
        phone: '(11) 9999-9999',
        settings: {
          language: 'pt',
          timezone: 'Europe/Lisbon',
          dateFormat: 'DD/MM/YYYY',
          allowSelfRegistration: true
        }
      }
    });

    const organization = org[0];
    logger.info(`✅ Organização criada: ${organization.name}`);

    // Criar departamentos
    const departments = await Promise.all([
      Department.findOrCreate({
        where: { name: 'Suporte Técnico', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'Suporte Técnico',
          description: 'Departamento de suporte técnico e atendimento ao cliente',
          email: 'suporte@empresademo.com'
        }
      }),
      Department.findOrCreate({
        where: { name: 'Desenvolvimento', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'Desenvolvimento',
          description: 'Departamento de desenvolvimento de software',
          email: 'dev@empresademo.com'
        }
      }),
      Department.findOrCreate({
        where: { name: 'Comercial', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'Comercial',
          description: 'Departamento comercial e vendas',
          email: 'comercial@empresademo.com'
        }
      })
    ]);

    const [supportDept] = departments[0];
    logger.info(`✅ ${departments.length} Departamentos criados`);

    // Criar categorias
    const categories = await Promise.all([
      Category.findOrCreate({
        where: { name: 'Bug/Erro', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'Bug/Erro',
          description: 'Problemas técnicos e erros no sistema',
          icon: 'Bug',
          color: '#EF4444'
        }
      }),
      Category.findOrCreate({
        where: { name: 'Nova Funcionalidade', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'Nova Funcionalidade',
          description: 'Solicitação de novas funcionalidades',
          icon: 'Sparkles',
          color: '#3B82F6'
        }
      }),
      Category.findOrCreate({
        where: { name: 'Dúvida', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'Dúvida',
          description: 'Dúvidas sobre uso do sistema',
          icon: 'HelpCircle',
          color: '#8B5CF6'
        }
      }),
      Category.findOrCreate({
        where: { name: 'Melhoria', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'Melhoria',
          description: 'Sugestões de melhorias',
          icon: 'TrendingUp',
          color: '#10B981'
        }
      })
    ]);

    logger.info(`✅ ${categories.length} Categorias criadas`);

    // Criar SLAs
    const slas = await Promise.all([
      SLA.findOrCreate({
        where: { priority: 'urgente', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'SLA Urgente',
          description: 'Problemas críticos que impedem o funcionamento do sistema',
          priority: 'urgente',
          responseTimeMinutes: 30,
          resolutionTimeMinutes: 240
        }
      }),
      SLA.findOrCreate({
        where: { priority: 'alta', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'SLA Alta',
          description: 'Problemas graves que afetam múltiplos usuários',
          priority: 'alta',
          responseTimeMinutes: 120,
          resolutionTimeMinutes: 480
        }
      }),
      SLA.findOrCreate({
        where: { priority: 'media', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'SLA Média',
          description: 'Problemas que afetam poucos usuários',
          priority: 'media',
          responseTimeMinutes: 240,
          resolutionTimeMinutes: 960
        }
      }),
      SLA.findOrCreate({
        where: { priority: 'baixa', organizationId: organization.id },
        defaults: {
          organizationId: organization.id,
          name: 'SLA Baixa',
          description: 'Melhorias e solicitações não urgentes',
          priority: 'baixa',
          responseTimeMinutes: 480,
          resolutionTimeMinutes: 1920
        }
      })
    ]);

    logger.info(`✅ ${slas.length} SLAs criados`);

    // Criar usuários
    const users = await Promise.all([
      User.findOrCreate({
        where: { email: 'admin@empresademo.com' },
        defaults: {
          organizationId: organization.id,
          name: 'Administrador Sistema',
          email: 'admin@empresademo.com',
          password: 'Admin@123',
          role: 'org-admin',
          phone: '(11) 98888-8888',
          departmentId: supportDept.id
        }
      }),
      User.findOrCreate({
        where: { email: 'agente@empresademo.com' },
        defaults: {
          organizationId: organization.id,
          name: 'Agente Suporte',
          email: 'agente@empresademo.com',
          password: 'Agente@123',
          role: 'agente',
          phone: '(11) 97777-7777',
          departmentId: supportDept.id
        }
      }),
      User.findOrCreate({
        where: { email: 'cliente@empresademo.com' },
        defaults: {
          organizationId: organization.id,
          name: 'Cliente Demo',
          email: 'cliente@empresademo.com',
          password: 'Cliente@123',
          role: 'cliente-org',
          phone: '(11) 96666-6666'
        }
      })
    ]);

    logger.info(`✅ ${users.length} Usuários criados`);

    logger.info('\n📝 Credenciais de acesso:');
    logger.info('Admin: admin@empresademo.com / Admin@123');
    logger.info('Agente: agente@empresademo.com / Agente@123');
    logger.info('Cliente: cliente@empresademo.com / Cliente@123');

    logger.info('\n✅ Seed concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

// Executar seed
seed();
