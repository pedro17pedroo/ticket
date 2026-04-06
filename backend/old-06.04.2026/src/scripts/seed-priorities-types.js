import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database.js';
import { Organization, Priority, Type } from '../modules/models/index.js';
import logger from '../config/logger.js';

const seed = async () => {
  try {
    logger.info('🌱 Criando prioridades e tipos...');

    // Buscar organização demo
    const org = await Organization.findOne({ where: { slug: 'empresa-demo' } });
    
    if (!org) {
      logger.error('❌ Organização demo não encontrada. Execute o seed principal primeiro.');
      process.exit(1);
    }

    // Criar Prioridades
    const priorities = await Promise.all([
      Priority.findOrCreate({
        where: { name: 'Urgente', organizationId: org.id },
        defaults: {
          organizationId: org.id,
          name: 'Urgente',
          description: 'Problemas críticos que impedem o funcionamento',
          color: '#EF4444',
          responseTime: 30,
          resolutionTime: 240,
          order: 1
        }
      }),
      Priority.findOrCreate({
        where: { name: 'Alta', organizationId: org.id },
        defaults: {
          organizationId: org.id,
          name: 'Alta',
          description: 'Problemas graves que afetam múltiplos usuários',
          color: '#F59E0B',
          responseTime: 120,
          resolutionTime: 480,
          order: 2
        }
      }),
      Priority.findOrCreate({
        where: { name: 'Média', organizationId: org.id },
        defaults: {
          organizationId: org.id,
          name: 'Média',
          description: 'Problemas que afetam poucos usuários',
          color: '#3B82F6',
          responseTime: 240,
          resolutionTime: 960,
          order: 3
        }
      }),
      Priority.findOrCreate({
        where: { name: 'Baixa', organizationId: org.id },
        defaults: {
          organizationId: org.id,
          name: 'Baixa',
          description: 'Melhorias e solicitações não urgentes',
          color: '#10B981',
          responseTime: 480,
          resolutionTime: 1920,
          order: 4
        }
      })
    ]);

    logger.info(`✅ ${priorities.length} Prioridades criadas`);

    // Criar Tipos de Ticket
    const types = await Promise.all([
      Type.findOrCreate({
        where: { name: 'Incidente', organizationId: org.id },
        defaults: {
          organizationId: org.id,
          name: 'Incidente',
          description: 'Problema que afeta ou pode afetar o serviço',
          icon: 'AlertTriangle',
          color: '#EF4444'
        }
      }),
      Type.findOrCreate({
        where: { name: 'Solicitação', organizationId: org.id },
        defaults: {
          organizationId: org.id,
          name: 'Solicitação',
          description: 'Pedido de serviço ou informação',
          icon: 'HelpCircle',
          color: '#3B82F6'
        }
      }),
      Type.findOrCreate({
        where: { name: 'Mudança', organizationId: org.id },
        defaults: {
          organizationId: org.id,
          name: 'Mudança',
          description: 'Alteração planejada no ambiente',
          icon: 'Settings',
          color: '#F59E0B'
        }
      }),
      Type.findOrCreate({
        where: { name: 'Problema', organizationId: org.id },
        defaults: {
          organizationId: org.id,
          name: 'Problema',
          description: 'Causa raiz de um ou mais incidentes',
          icon: 'AlertCircle',
          color: '#8B5CF6'
        }
      })
    ]);

    logger.info(`✅ ${types.length} Tipos criados`);
    logger.info('\n✅ Seed de prioridades e tipos concluído!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

seed();
