/**
 * Catalog Service - Regras de Negócio do Sistema de Catálogo
 * 
 * Gerencia:
 * - Hierarquia de categorias
 * - Lógica por tipo de item (incident, service, support, request)
 * - Auto-atribuição de prioridade
 * - Roteamento inteligente
 * - Aprovações baseadas em tipo
 */

import { CatalogCategory, CatalogItem, ServiceRequest } from '../modules/catalog/catalogModel.js';
import Ticket from '../modules/tickets/ticketModel.js';
import { User, SLA, Department, Category } from '../modules/models/index.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { notifyTicketWatchers } from './watcherNotificationService.js';

class CatalogService {
  
  /**
   * Obter hierarquia completa de categorias
   * Retorna categorias em estrutura de árvore
   */
  async getCategoryHierarchy(organizationId, options = {}) {
    const { includeInactive = false, includeItemCount = true } = options;

    const where = { organizationId, parentCategoryId: null };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    // Buscar categorias raiz (level 1)
    const rootCategories = await CatalogCategory.findAll({
      where,
      order: [['order', 'ASC'], ['name', 'ASC']],
      attributes: includeItemCount 
        ? { include: [[sequelize.fn('COUNT', sequelize.col('items.id')), 'itemCount']] }
        : undefined,
      include: includeItemCount 
        ? [{
            model: CatalogItem,
            as: 'items',
            attributes: [],
            required: false
          }]
        : undefined,
      group: includeItemCount ? ['CatalogCategory.id'] : undefined
    });

    // Recursivamente buscar subcategorias
    const buildHierarchy = async (category) => {
      const subcategories = await CatalogCategory.findAll({
        where: {
          organizationId,
          parentCategoryId: category.id,
          ...(includeInactive ? {} : { isActive: true })
        },
        order: [['order', 'ASC'], ['name', 'ASC']]
      });

      if (subcategories.length > 0) {
        category.subcategories = await Promise.all(
          subcategories.map(sub => buildHierarchy(sub.get({ plain: true })))
        );
      }

      return category;
    };

    return Promise.all(
      rootCategories.map(cat => buildHierarchy(cat.get({ plain: true })))
    );
  }

  /**
   * Obter caminho completo de uma categoria
   * Ex: "TI > Infraestrutura > Redes"
   */
  async getCategoryPath(categoryId) {
    const path = [];
    let currentCategory = await CatalogCategory.findByPk(categoryId);

    while (currentCategory) {
      path.unshift(currentCategory.name);
      
      if (currentCategory.parentCategoryId) {
        currentCategory = await CatalogCategory.findByPk(currentCategory.parentCategoryId);
      } else {
        currentCategory = null;
      }
    }

    return path.join(' > ');
  }

  /**
   * Determinar prioridade baseada no tipo de item
   */
  determinePriorityByType(item, userProvidedPriority = null) {
    // Se auto-assign está desativado, usar prioridade fornecida ou padrão
    if (!item.autoAssignPriority) {
      return userProvidedPriority || item.defaultPriority;
    }

    // Lógica por tipo
    switch (item.itemType) {
      case 'incident':
        // Incidentes sempre alta ou crítica
        return userProvidedPriority === 'critica' ? 'critica' : 'alta';
      
      case 'service':
        // Serviços usam prioridade padrão
        return userProvidedPriority || item.defaultPriority;
      
      case 'support':
        // Suporte normalmente média, mas pode ser alta
        if (userProvidedPriority === 'alta' || userProvidedPriority === 'critica') {
          return userProvidedPriority;
        }
        return 'media';
      
      case 'request':
        // Requisições normalmente baixa/média
        if (userProvidedPriority === 'alta' || userProvidedPriority === 'critica') {
          return 'media'; // downgrade automático
        }
        return userProvidedPriority || 'baixa';
      
      default:
        return item.defaultPriority;
    }
  }

  /**
   * Verificar se requer aprovação baseado no tipo
   */
  requiresApprovalByType(item) {
    // Incidentes NUNCA requerem aprovação (urgente)
    if (item.itemType === 'incident' && item.skipApprovalForIncidents) {
      return false;
    }

    // Outros tipos seguem a configuração
    return item.requiresApproval;
  }

  /**
   * Obter workflow apropriado baseado no tipo
   */
  getWorkflowByType(item) {
    // Se é incidente e tem workflow específico
    if (item.itemType === 'incident' && item.incidentWorkflowId) {
      return item.incidentWorkflowId;
    }

    // Caso contrário, workflow padrão
    return item.defaultWorkflowId;
  }

  /**
   * Roteamento inteligente
   * Determina Direction > Department > Section
   */
  async determineRouting(item, category = null) {
    const routing = {
      directionId: null,
      departmentId: null,
      sectionId: null
    };

    // Prioridade 1: Item específico
    if (item.defaultDirectionId) {
      routing.directionId = item.defaultDirectionId;
    }
    if (item.defaultDepartmentId) {
      routing.departmentId = item.defaultDepartmentId;
    }
    if (item.defaultSectionId) {
      routing.sectionId = item.defaultSectionId;
    }

    // Prioridade 2: Categoria (se não definido no item)
    if (!routing.directionId || !routing.departmentId || !routing.sectionId) {
      if (!category) {
        category = await CatalogCategory.findByPk(item.categoryId);
      }

      if (category) {
        routing.directionId = routing.directionId || category.defaultDirectionId;
        routing.departmentId = routing.departmentId || category.defaultDepartmentId;
        routing.sectionId = routing.sectionId || category.defaultSectionId;

        // Se categoria é subcategoria, buscar na categoria pai
        if (category.parentCategoryId && (!routing.directionId || !routing.departmentId)) {
          const parentCategory = await CatalogCategory.findByPk(category.parentCategoryId);
          if (parentCategory) {
            routing.directionId = routing.directionId || parentCategory.defaultDirectionId;
            routing.departmentId = routing.departmentId || parentCategory.defaultDepartmentId;
            routing.sectionId = routing.sectionId || parentCategory.defaultSectionId;
          }
        }
      }
    }

    return routing;
  }

  /**
   * Obter SLA apropriado
   */
  async determineSLA(item, itemType) {
    // Buscar SLA por tipo (exemplo: SLA específico para incidentes)
    const sla = await SLA.findOne({
      where: {
        organizationId: item.organizationId,
        name: { [Op.iLike]: `%${itemType}%` },
        isActive: true
      }
    });

    return sla ? sla.id : null;
  }

  /**
   * Criar Service Request com regras de negócio aplicadas
   */
  async createServiceRequest(catalogItemId, userId, formData, organizationId, options = {}) {
    const { 
      userProvidedPriority = null,
      additionalDetails = '',
      userPriority = '',
      expectedResolutionTime = null,
      attachments = [],
      clientWatchers = [] // Novos watchers do cliente
    } = options;

    // Buscar item do catálogo
    const item = await CatalogItem.findOne({
      where: {
        id: catalogItemId,
        organizationId,
        isActive: true
      },
      include: [
        {
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'parentCategoryId', 'defaultDirectionId', 'defaultDepartmentId']
        }
      ]
    });

    if (!item) {
      throw new Error('Item do catálogo não encontrado ou inativo');
    }

    // Aplicar regras de negócio
    const finalPriority = this.determinePriorityByType(item, userProvidedPriority);
    const requiresApproval = this.requiresApprovalByType(item);
    const routing = await this.determineRouting(item, item.category);
    const workflowId = this.getWorkflowByType(item);

    // Criar service request com todas as informações do cliente
    const serviceRequest = await ServiceRequest.create({
      organizationId,
      catalogItemId,
      userId,
      formData: {
        ...formData,
        additionalDetails,
        userPriority,
        expectedResolutionTime,
        attachments: (attachments || []).map(a => ({
          name: a.name,
          size: a.size,
          type: a.type
        }))
      },
      requestType: item.itemType,
      finalPriority,
      status: requiresApproval ? 'pending' : 'approved',
      approvedById: requiresApproval ? null : null
    });

    // Incrementar contador de popularidade
    await item.increment('requestCount');

    logger.info(`Service request criado: ${item.name} (Tipo: ${item.itemType}, Prioridade: ${finalPriority})`);

    // SEMPRE criar ticket imediatamente
    const ticket = await this.createTicketFromRequest(
      serviceRequest,
      item,
      routing,
      workflowId,
      finalPriority,
      { additionalDetails, userPriority, expectedResolutionTime, attachments, clientWatchers }
    );

    // Se requer aprovação, ticket fica com status aguardando_aprovacao
    // Se não requer aprovação, ticket fica com status novo/aberto
    const ticketStatus = requiresApproval ? 'aguardando_aprovacao' : 'novo';
    const requestStatus = requiresApproval ? 'pending' : 'in_progress';

    await ticket.update({ status: ticketStatus });
    await serviceRequest.update({
      ticketId: ticket.id,
      status: requestStatus
    });

    logger.info(`Ticket criado: ${ticket.ticketNumber} - Status: ${ticketStatus}`);

    // 🔔 NOTIFICAR WATCHERS
    try {
      // Carregar ticket completo com relacionamentos para notificações
      const fullTicket = await Ticket.findByPk(ticket.id, {
        include: [
          { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
        ]
      });

      logger.info(`🔔 Iniciando notificação de watchers para ticket ${fullTicket.ticketNumber}`);
      logger.info(`📧 Client watchers: ${JSON.stringify(fullTicket.clientWatchers)}`);
      logger.info(`👥 Org watchers: ${JSON.stringify(fullTicket.orgWatchers)}`);
      logger.info(`👤 Requester: ${fullTicket.requester?.email || 'N/A'}`);
      logger.info(`🎯 Assignee: ${fullTicket.assignee?.email || 'N/A'}`);
      
      await notifyTicketWatchers(fullTicket, 'created');
      logger.info(`✅ Watchers notificados para ticket ${fullTicket.ticketNumber}`);
    } catch (error) {
      logger.error(`❌ Erro ao notificar watchers do ticket ${ticket.ticketNumber}:`, error);
      console.error('Stack trace completo:', error.stack);
      // Não falhar a criação do ticket por erro de notificação
    }

    return { serviceRequest, ticket, requiresApproval };
  }

  /**
   * Gerar número de ticket único
   */
  async generateTicketNumber() {
    const lastTicket = await Ticket.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['ticketNumber']
    });

    if (!lastTicket || !lastTicket.ticketNumber) {
      return 'TKT-000001';
    }

    // Extrair número do último ticket (formato: TKT-XXXXXX)
    const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[1] || '0');
    const nextNumber = (lastNumber + 1).toString().padStart(6, '0');
    
    return `TKT-${nextNumber}`;
  }

  /**
   * Criar ticket a partir de service request
   */
  async createTicketFromRequest(serviceRequest, catalogItem, routing, workflowId, priority, clientData = {}) {
    const { additionalDetails = '', userPriority = '', expectedResolutionTime = null, attachments = [], clientWatchers = [] } = clientData;
    const requester = await User.findByPk(serviceRequest.userId);

    // Descrição: APENAS detalhes adicionais do cliente
    let description = additionalDetails || 'Sem detalhes adicionais fornecidos.';

    // Preparar campos do formulário custom para customFields
    const customFields = {};
    if (serviceRequest.formData && Object.keys(serviceRequest.formData).length > 0) {
      for (const [key, value] of Object.entries(serviceRequest.formData)) {
        // Ignorar campos especiais que já são armazenados em metadata
        if (['additionalDetails', 'userPriority', 'expectedResolutionTime', 'attachments'].includes(key)) continue;
        
        const field = catalogItem.customFields?.find(f => f.name === key);
        const label = field ? field.label : key;
        customFields[key] = {
          label,
          value,
          type: field?.type || 'text'
        };
      }
    }

    // Metadata estruturado: todas as informações do catálogo e cliente
    const metadata = {
      // Informações do catálogo
      catalogItem: {
        id: catalogItem.id,
        name: catalogItem.name,
        type: catalogItem.itemType,
        typeLabel: this.getTypeLabel(catalogItem.itemType),
        description: catalogItem.fullDescription || catalogItem.description
      },
      // Informações do cliente
      clientRequest: {
        userPriority: userPriority || null,
        expectedResolutionTime: expectedResolutionTime || null,
        attachments: attachments.map(att => ({
          name: att.name,
          size: att.size,
          type: att.type,
          uploadedAt: new Date().toISOString()
        }))
      },
      // Metadados da solicitação
      requestMetadata: {
        serviceRequestId: serviceRequest.id,
        requestType: serviceRequest.requestType,
        createdAt: serviceRequest.createdAt
      }
    };

    // Determinar SLA (usar do item do catálogo)
    const slaId = catalogItem.slaId || await this.determineSLA(catalogItem, catalogItem.itemType);
    
    // Determinar prioridade (preferir do item do catálogo)
    const priorityId = catalogItem.priorityId;
    const finalPriority = priority || catalogItem.defaultPriority || 'media';
    
    // Determinar tipo (preferir do item do catálogo)
    const typeId = catalogItem.typeId;

    // Gerar número do ticket
    const ticketNumber = await this.generateTicketNumber();

    // Criar ticket
    const ticket = await Ticket.create({
      ticketNumber,
      organizationId: serviceRequest.organizationId,
      requesterId: serviceRequest.userId,
      subject: `[${this.getTypeLabel(catalogItem.itemType)}] ${catalogItem.name}`,
      description,
      // LEGADO: categoria funcional (manter compatibilidade)
      categoryId: catalogItem.defaultTicketCategoryId,
      // NOVO: vincula ao catálogo
      catalogCategoryId: catalogItem.categoryId,  // Categoria do catálogo
      catalogItemId: catalogItem.id,              // Item específico do catálogo
      // Prioridade e Tipo configuráveis
      priority: finalPriority,
      priorityId: priorityId,    // Prioridade configurável
      typeId: typeId,            // Tipo configurável
      status: 'aberto',
      // Roteamento: SEMPRE usar do catalogItem (obrigatório)
      directionId: catalogItem.defaultDirectionId,
      departmentId: catalogItem.defaultDepartmentId,
      sectionId: catalogItem.defaultSectionId,
      // SLA e Workflow
      slaId,
      workflowId,
      // Metadados estruturados
      customFields,   // Campos do formulário dinâmico
      metadata,       // Informações do catálogo e cliente estruturadas
      source: 'portal',
      tags: catalogItem.keywords || [],
      // Watchers
      clientWatchers: clientWatchers || [] // Emails de observadores do cliente
    });

    logger.info(`Ticket criado a partir de catálogo: ${ticket.ticketNumber} (Tipo: ${catalogItem.itemType})`);

    return ticket;
  }

  /**
   * Buscar itens do catálogo com filtros avançados
   */
  async searchCatalogItems(organizationId, filters = {}) {
    const {
      categoryId = null,
      itemType = null,
      search = null,
      keywords = null,
      minPriority = null,
      requiresApproval = null,
      includeInactive = false
    } = filters;

    const where = { organizationId };

    if (categoryId) {
      // Buscar também em subcategorias
      const category = await CatalogCategory.findByPk(categoryId);
      if (category) {
        const subcategoryIds = await this.getSubcategoryIds(categoryId);
        where.categoryId = { [Op.in]: [categoryId, ...subcategoryIds] };
      } else {
        where.categoryId = categoryId;
      }
    }

    if (itemType) {
      where.itemType = itemType;
    }

    if (!includeInactive) {
      where.isActive = true;
      where.isPublic = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { shortDescription: { [Op.iLike]: `%${search}%` } },
        { keywords: { [Op.contains]: [search] } }
      ];
    }

    if (keywords && Array.isArray(keywords)) {
      where.keywords = { [Op.overlap]: keywords };
    }

    if (requiresApproval !== null) {
      where.requiresApproval = requiresApproval;
    }

    const items = await CatalogItem.findAll({
      where,
      include: [
        {
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color', 'imageUrl']
        }
      ],
      order: [['requestCount', 'DESC'], ['name', 'ASC']]
    });

    return items;
  }

  /**
   * Obter todos os IDs de subcategorias recursivamente
   */
  async getSubcategoryIds(categoryId, accumulated = []) {
    const subcategories = await CatalogCategory.findAll({
      where: { parentCategoryId: categoryId },
      attributes: ['id']
    });

    for (const sub of subcategories) {
      accumulated.push(sub.id);
      await this.getSubcategoryIds(sub.id, accumulated);
    }

    return accumulated;
  }

  /**
   * Validar hierarquia de categoria (evitar loops)
   */
  async validateCategoryHierarchy(categoryId, parentCategoryId) {
    if (!parentCategoryId) return true;

    // Verificar se parentCategoryId não é descendente de categoryId
    let currentId = parentCategoryId;
    const visited = new Set();

    while (currentId) {
      if (currentId === categoryId) {
        throw new Error('Hierarquia circular detectada: categoria não pode ser pai de si mesma');
      }

      if (visited.has(currentId)) {
        throw new Error('Loop infinito na hierarquia de categorias');
      }

      visited.add(currentId);

      const parent = await CatalogCategory.findByPk(currentId);
      currentId = parent ? parent.parentCategoryId : null;
    }

    return true;
  }

  /**
   * Obter estatísticas por tipo
   */
  async getStatisticsByType(organizationId) {
    const stats = await CatalogItem.findAll({
      where: { organizationId, isActive: true },
      attributes: [
        'itemType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('requestCount')), 'totalRequests']
      ],
      group: ['itemType']
    });

    return stats.reduce((acc, stat) => {
      acc[stat.itemType] = {
        count: parseInt(stat.dataValues.count),
        totalRequests: parseInt(stat.dataValues.totalRequests || 0)
      };
      return acc;
    }, {});
  }

  /**
   * Label legível para tipo
   */
  getTypeLabel(itemType) {
    const labels = {
      incident: 'Incidente',
      service: 'Serviço',
      support: 'Suporte',
      request: 'Requisição'
    };
    return labels[itemType] || itemType;
  }

  /**
   * Obter itens mais populares
   */
  async getMostPopularItems(organizationId, limit = 10, itemType = null) {
    const where = { organizationId, isActive: true };
    
    if (itemType) {
      where.itemType = itemType;
    }

    return CatalogItem.findAll({
      where,
      order: [['requestCount', 'DESC']],
      limit,
      include: [
        {
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    });
  }
}

export default new CatalogService();
