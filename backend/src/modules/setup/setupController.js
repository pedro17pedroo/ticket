import { Priority, Type, Category } from '../models/index.js';
import logger from '../../config/logger.js';

// POST /api/setup/defaults - Popular dados padrão (prioridades, tipos, categorias)
export const setupDefaults = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    // Verificar se já existem dados
    const [existingPriorities, existingTypes, existingCategories] = await Promise.all([
      Priority.count({ where: { organizationId } }),
      Type.count({ where: { organizationId } }),
      Category.count({ where: { organizationId } })
    ]);

    const stats = {
      prioritiesCreated: 0,
      typesCreated: 0,
      categoriesCreated: 0
    };

    // Criar Prioridades se não existirem
    if (existingPriorities === 0) {
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
        await Priority.create({ ...p, organizationId });
        stats.prioritiesCreated++;
      }
    }

    // Criar Tipos se não existirem
    if (existingTypes === 0) {
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
        await Type.create({ ...t, organizationId });
        stats.typesCreated++;
      }
    }

    // Criar Categorias se não existirem
    if (existingCategories === 0) {
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
        await Category.create({ ...c, organizationId });
        stats.categoriesCreated++;
      }
    }

    const totalCreated = stats.prioritiesCreated + stats.typesCreated + stats.categoriesCreated;

    if (totalCreated === 0) {
      return res.json({
        success: true,
        message: 'Dados padrão já existem',
        stats: {
          priorities: existingPriorities,
          types: existingTypes,
          categories: existingCategories
        }
      });
    }

    logger.info(`Dados padrão criados para org ${organizationId}: ${JSON.stringify(stats)}`);

    res.json({
      success: true,
      message: 'Dados padrão criados com sucesso',
      stats
    });
  } catch (error) {
    logger.error('Erro ao criar dados padrão:', error);
    next(error);
  }
};
