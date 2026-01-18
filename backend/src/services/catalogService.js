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

import { CatalogCategory, CatalogItem } from '../modules/catalog/catalogModel.js';
import Ticket from '../modules/tickets/ticketModel.js';
import { User, SLA, Department, ClientUser, OrganizationUser } from '../modules/models/index.js';
import Attachment from '../modules/attachments/attachmentModel.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { notifyTicketWatchers } from './watcherNotificationService.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
   * Criar Ticket a partir de Solicitação de Serviço (Service Request)
   * Método unificado - cria apenas ticket (service_requests foi descontinuado)
   */
  async createServiceRequest(catalogItemId, userId, formData, organizationId, options = {}) {
    const {
      userProvidedPriority = null,
      additionalDetails = '',
      userPriority = '',
      expectedResolutionTime = null,
      attachments = [],
      clientWatchers = [],
      isClientUser = false
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

    // Preparar dados do formulário
    const requestFormData = {
      ...formData,
      additionalDetails,
      userPriority,
      expectedResolutionTime,
      attachments: (attachments || []).map(a => ({
        name: a.name,
        size: a.size,
        type: a.type
      }))
    };

    // Incrementar contador de popularidade
    await item.increment('requestCount');

    logger.info(`Criando ticket de serviço: ${item.name} (Tipo: ${item.itemType}, Prioridade: ${finalPriority})`);

    // Criar ticket diretamente (sem service_request intermediário)
    const ticket = await this.createTicketFromCatalogItem(
      item,
      userId,
      isClientUser,
      requestFormData,
      routing,
      workflowId,
      finalPriority,
      requiresApproval,
      clientWatchers
    );

    logger.info(`Ticket criado: ${ticket.ticketNumber} - Status: ${ticket.status}`);

    // Notificar watchers
    try {
      const fullTicket = await Ticket.findByPk(ticket.id, {
        include: [
          { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
          { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
          { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
          { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
        ]
      });

      await notifyTicketWatchers(fullTicket, 'created');
      logger.info(`✅ Watchers notificados para ticket ${fullTicket.ticketNumber}`);
    } catch (error) {
      logger.error(`❌ Erro ao notificar watchers:`, error);
    }

    return { ticket, requiresApproval };
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
   * Criar ticket diretamente do catalog item (sem service_request intermediário)
   */
  async createTicketFromCatalogItem(item, userId, isClientUser, formData, routing, workflowId, priority, requiresApproval, clientWatchers = []) {
    // Buscar requester
    let requester;
    let requesterType;
    let requesterUserId = null;
    let requesterOrgUserId = null;
    let requesterClientUserId = null;

    if (isClientUser) {
      requester = await ClientUser.findByPk(userId);
      requesterType = 'client';
      requesterClientUserId = userId;
    } else {
      requester = await User.findByPk(userId);
      requesterType = 'provider';
      requesterUserId = userId;
    }

    // Descrição
    const description = formData.additionalDetails || 'Solicitação de serviço do catálogo';

    // Preparar customFields
    const customFields = {};
    if (formData && Object.keys(formData).length > 0) {
      for (const [key, value] of Object.entries(formData)) {
        if (['additionalDetails', 'userPriority', 'expectedResolutionTime', 'attachments'].includes(key)) continue;
        
        const field = item.customFields?.find(f => f.name === key);
        const label = field ? field.label : key;
        customFields[key] = {
          label,
          value,
          type: field?.type || 'text'
        };
      }
    }

    // Metadata
    const metadata = {
      catalogItem: {
        id: item.id,
        name: item.name,
        type: item.itemType,
        typeLabel: this.getTypeLabel(item.itemType)
      },
      clientRequest: {
        userPriority: formData.userPriority || null,
        expectedResolutionTime: formData.expectedResolutionTime || null
      }
    };

    // Gerar número do ticket
    const ticketNumber = await this.generateTicketNumber();

    // Status do ticket
    const ticketStatus = requiresApproval ? 'aguardando_aprovacao' : 'novo';
    const requestStatus = requiresApproval ? 'pending' : 'approved';
    const approvalStatus = requiresApproval ? 'pending' : null;

    // Criar ticket
    const ticket = await Ticket.create({
      ticketNumber,
      organizationId: item.organizationId,
      clientId: requester?.clientId || null,
      // Campos polimórficos
      requesterType,
      requesterUserId,
      requesterOrgUserId,
      requesterClientUserId,
      // Legado
      requesterId: userId,
      subject: `[${this.getTypeLabel(item.itemType)}] ${item.name}`,
      description,
      // Catálogo
      catalogCategoryId: item.categoryId,
      catalogItemId: item.id,
      // Prioridade e Tipo
      priority: priority || item.defaultPriority || 'media',
      priorityId: item.priorityId,
      typeId: item.typeId,
      status: ticketStatus,
      // Roteamento
      directionId: routing.directionId || item.defaultDirectionId,
      departmentId: routing.departmentId || item.defaultDepartmentId,
      sectionId: routing.sectionId || item.defaultSectionId,
      // SLA e Workflow
      slaId: item.slaId,
      workflowId,
      // Metadados
      customFields,
      metadata,
      source: 'portal',
      tags: item.keywords || [],
      // Watchers
      clientWatchers: clientWatchers || [],
      // 🆕 Campos de aprovação (unificação)
      requiresApproval: requiresApproval,
      approvalStatus: approvalStatus,
      formData: formData,
      // Legado
      requestFormData: formData,
      requestStatus: requestStatus
    });

    logger.info(`Ticket criado do catálogo: ${ticket.ticketNumber} (${item.itemType})`);

    // Salvar anexos se existirem
    if (formData.attachments && formData.attachments.length > 0) {
      await this.saveAttachmentsFromBase64(ticket.id, formData.attachments, userId, isClientUser);
    }

    return ticket;
  }

  /**
   * Criar ticket a partir de service request (MÉTODO LEGADO - MANTER POR COMPATIBILIDADE)
   */
  async createTicketFromRequest(serviceRequest, catalogItem, routing, workflowId, priority, clientData = {}) {
    const { additionalDetails = '', userPriority = '', expectedResolutionTime = null, attachments = [], clientWatchers = [] } = clientData;

    let requester;
    if (serviceRequest.clientUserId) {
      requester = await ClientUser.findByPk(serviceRequest.clientUserId);
    } else {
      requester = await User.findByPk(serviceRequest.userId);
    }

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
      clientId: serviceRequest.clientId, // ID da empresa cliente
      requesterId: serviceRequest.userId, // Mantido para compatibilidade (pode ser null para clientes)
      // Campos polimórficos
      requesterType: serviceRequest.clientUserId ? 'client' : 'provider',
      requesterClientUserId: serviceRequest.clientUserId,
      requesterUserId: serviceRequest.userId,
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
      status: 'novo',
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

    // Guardar anexos se existirem (base64 -> ficheiro)
    if (attachments && attachments.length > 0) {
      const isClientUser = !!serviceRequest.clientUserId;
      await this.saveAttachmentsFromBase64(ticket.id, attachments, requester?.id, isClientUser);
    }

    return ticket;
  }

  /**
   * Guardar anexos a partir de dados base64
   */
  async saveAttachmentsFromBase64(ticketId, attachments, uploadedById = null, isClientUser = false) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'tickets');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const savedAttachments = [];

    for (const attachment of attachments) {
      try {
        // Verificar se tem dados base64
        if (!attachment.data) {
          logger.warn(`Anexo ${attachment.name} sem dados base64, ignorando`);
          continue;
        }

        // Extrair dados base64 (remover prefixo data:mime/type;base64,)
        const base64Data = attachment.data.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Gerar nome único para o ficheiro
        const ext = path.extname(attachment.name) || '';
        const uniqueFilename = `${uuidv4()}${ext}`;
        const filePath = path.join(uploadsDir, uniqueFilename);

        // Guardar ficheiro
        fs.writeFileSync(filePath, buffer);
        logger.info(`Ficheiro guardado em: ${filePath}`);

        // Criar registo na base de dados (campos mínimos obrigatórios)
        const attachmentData = {
          ticketId,
          filename: uniqueFilename,
          originalName: attachment.name,
          mimetype: attachment.type || 'application/octet-stream',
          size: attachment.size || buffer.length,
          path: filePath
        };

        logger.info(`Criando registo de anexo: ${JSON.stringify(attachmentData)}`);

        const savedAttachment = await Attachment.create(attachmentData);

        savedAttachments.push(savedAttachment);
        logger.info(`✅ Anexo guardado com sucesso: ${attachment.name} -> ${uniqueFilename} (ID: ${savedAttachment.id})`);
      } catch (error) {
        logger.error(`❌ Erro ao guardar anexo ${attachment.name}:`, error.message);
        logger.error('Stack:', error.stack);
      }
    }

    logger.info(`Total de anexos guardados: ${savedAttachments.length}/${attachments.length}`);
    return savedAttachments;
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
      includeInactive = false,
      recursive = true
    } = filters;

    const where = { organizationId };

    if (categoryId) {
      if (recursive) {
        // Buscar também em subcategorias (recursivo)
        const category = await CatalogCategory.findByPk(categoryId);
        if (category) {
          const subcategoryIds = await this.getSubcategoryIds(categoryId);
          where.categoryId = { [Op.in]: [categoryId, ...subcategoryIds] };
        } else {
          where.categoryId = categoryId;
        }
      } else {
        // Buscar apenas nesta categoria (não recursivo)
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
