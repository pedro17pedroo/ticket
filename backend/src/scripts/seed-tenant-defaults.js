import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database.js';
import { Organization, Priority, Type, Category } from '../modules/models/index.js';
import logger from '../config/logger.js';

const seedTenantDefaults = async (organizationId) => {
  try {
    // Criar Prioridades Padrão
    const priorities = [
      {
        name: 'Urgente',
        description: 'Problemas críticos que impedem o funcionamento',
        color: '#EF4444',
        responseTime: 30,
        resolutionTime: 240,
        order: 1
      },
      {
        name: 'Alta',
        description: 'Problemas graves que afetam múltiplos usuários',
        color: '#F59E0B',
        responseTime: 120,
        resolutionTime: 480,
        order: 2
      },
      {
        name: 'Média',
        description: 'Problemas que afetam poucos usuários',
        color: '#3B82F6',
        responseTime: 240,
        resolutionTime: 960,
        order: 3
      },
      {
        name: 'Baixa',
        description: 'Melhorias e solicitações não urgentes',
        color: '#10B981',
        responseTime: 480,
        resolutionTime: 1920,
        order: 4
      }
    ];

    for (const p of priorities) {
      await Priority.findOrCreate({
        where: { name: p.name, organizationId },
        defaults: { ...p, organizationId }
      });
    }

    logger.info(`✅ ${priorities.length} Prioridades criadas para org ${organizationId}`);

    // Criar Tipos Padrão
    const types = [
      {
        name: 'Incidente',
        description: 'Problema que afeta ou pode afetar o serviço',
        icon: 'AlertTriangle',
        color: '#EF4444',
        order: 1
      },
      {
        name: 'Solicitação',
        description: 'Pedido de serviço ou informação',
        icon: 'HelpCircle',
        color: '#3B82F6',
        order: 2
      },
      {
        name: 'Mudança',
        description: 'Alteração planejada no ambiente',
        icon: 'Settings',
        color: '#F59E0B',
        order: 3
      },
      {
        name: 'Problema',
        description: 'Causa raiz de um ou mais incidentes',
        icon: 'AlertCircle',
        color: '#8B5CF6',
        order: 4
      }
    ];

    for (const t of types) {
      await Type.findOrCreate({
        where: { name: t.name, organizationId },
        defaults: { ...t, organizationId }
      });
    }

    logger.info(`✅ ${types.length} Tipos criados para org ${organizationId}`);

    // Criar Categorias Padrão
    const categories = [
      {
        name: 'Acesso',
        description: 'Problemas de acesso e autenticação',
        icon: 'Lock',
        color: '#EF4444'
      },
      {
        name: 'Rede',
        description: 'Problemas de conectividade e rede',
        icon: 'Wifi',
        color: '#F59E0B'
      },
      {
        name: 'Hardware',
        description: 'Problemas com equipamentos físicos',
        icon: 'Laptop',
        color: '#3B82F6'
      },
      {
        name: 'Software',
        description: 'Problemas com aplicativos e sistemas',
        icon: 'Code',
        color: '#8B5CF6'
      },
      {
        name: 'Email',
        description: 'Problemas relacionados a email',
        icon: 'Mail',
        color: '#10B981'
      },
      {
        name: 'Infraestrutura',
        description: 'Problemas de infraestrutura e servidores',
        icon: 'Server',
        color: '#6366F1'
      },
      {
        name: 'Outro',
        description: 'Outros tipos de solicitações',
        icon: 'HelpCircle',
        color: '#6B7280'
      }
    ];

    for (const c of categories) {
      await Category.findOrCreate({
        where: { name: c.name, organizationId },
        defaults: { ...c, organizationId }
      });
    }

    logger.info(`✅ ${categories.length} Categorias criadas para org ${organizationId}`);

    return {
      priorities: priorities.length,
      types: types.length,
      categories: categories.length
    };
  } catch (error) {
    logger.error('❌ Erro ao criar dados padrão:', error);
    throw error;
  }
};

// Se executado diretamente, popula todas as organizações
const seedAll = async () => {
  try {
    logger.info('🌱 Populando dados padrão para todas as organizações...');

    const organizations = await Organization.findAll();
    
    for (const org of organizations) {
      logger.info(`\n📦 Processando organização: ${org.name} (${org.id})`);
      await seedTenantDefaults(org.id);
    }

    logger.info('\n✅ Seed de dados padrão concluído para todas as organizações!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro no seed:', error);
    process.exit(1);
  }
};

// Exportar para uso em outros lugares
export { seedTenantDefaults };

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAll();
}
