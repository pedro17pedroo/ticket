/**
 * Catalog Controller V2 - Com Sistema de Hierarquia e Tipos
 * 
 * Endpoints:
 * - Gestão de categorias com hierarquia
 * - Gestão de itens por tipo
 * - Portal do cliente
 * - Service requests com regras de negócio
 */

import { CatalogCategory, CatalogItem, ServiceRequest } from './catalogModel.js';
import catalogService from '../../services/catalogService.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

// ==================== CATEGORIAS DO CATÁLOGO ====================

/**
 * Listar categorias com hierarquia
 * GET /api/catalog/categories?hierarchy=true
 */
export const getCatalogCategories = async (req, res, next) => {
  try {
    const { hierarchy, includeInactive } = req.query;

    // Se hierarchy=true, retornar estrutura de árvore
    if (hierarchy === 'true') {
      const tree = await catalogService.getCategoryHierarchy(
        req.user.organizationId,
        { includeInactive: includeInactive === 'true' }
      );

      return res.json({
        success: true,
        categories: tree,
        viewType: 'hierarchy'
      });
    }

    // Listar plano
    const where = { organizationId: req.user.organizationId };
    
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const categories = await CatalogCategory.findAll({
      where,
      order: [['level', 'ASC'], ['order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      categories,
      viewType: 'flat'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter categoria específica com path completo
 * GET /api/catalog/categories/:id
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await CatalogCategory.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Obter path completo
    const path = await catalogService.getCategoryPath(id);

    // Contar itens
    const itemCount = await CatalogItem.count({
      where: { categoryId: id, isActive: true }
    });

    res.json({
      success: true,
      category: {
        ...category.get({ plain: true }),
        path,
        itemCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar categoria (com suporte a subcategorias)
 * POST /api/catalog/categories
 */
export const createCatalogCategory = async (req, res, next) => {
  try {
    const {
      name,
      description,
      icon,
      color,
      imageUrl,
      parentCategoryId,
      defaultDirectionId,
      defaultDepartmentId,
      defaultSectionId,
      order
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Validar hierarquia (evitar loops)
    if (parentCategoryId) {
      await catalogService.validateCategoryHierarchy(null, parentCategoryId);
    }

    // Converter strings vazias em null para campos UUID
    const cleanUUID = (value) => value === '' || value === undefined ? null : value;

    const cleanParentCategoryId = cleanUUID(parentCategoryId);
    const cleanDefaultDirectionId = cleanUUID(defaultDirectionId);
    const cleanDefaultDepartmentId = cleanUUID(defaultDepartmentId);
    const cleanDefaultSectionId = cleanUUID(defaultSectionId);

    // Determinar level
    let level = 1;
    if (cleanParentCategoryId) {
      const parent = await CatalogCategory.findByPk(cleanParentCategoryId);
      if (parent) {
        level = parent.level + 1;
      }
    }

    const category = await CatalogCategory.create({
      organizationId: req.user.organizationId,
      name,
      description,
      icon: icon || 'FolderOpen',
      color: color || '#6B7280',
      imageUrl: imageUrl || null,
      parentCategoryId: cleanParentCategoryId,
      level,
      defaultDirectionId: cleanDefaultDirectionId,
      defaultDepartmentId: cleanDefaultDepartmentId,
      defaultSectionId: cleanDefaultSectionId,
      order: order || 0
    });

    logger.info(`Categoria criada: ${name} (Level ${level})`);

    res.json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar categoria
 * PUT /api/catalog/categories/:id
 */
export const updateCatalogCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await CatalogCategory.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Converter strings vazias em null para campos UUID
    const cleanUUID = (value) => value === '' || value === undefined ? null : value;

    if ('parentCategoryId' in updates) {
      updates.parentCategoryId = cleanUUID(updates.parentCategoryId);
    }
    if ('defaultDirectionId' in updates) {
      updates.defaultDirectionId = cleanUUID(updates.defaultDirectionId);
    }
    if ('defaultDepartmentId' in updates) {
      updates.defaultDepartmentId = cleanUUID(updates.defaultDepartmentId);
    }
    if ('defaultSectionId' in updates) {
      updates.defaultSectionId = cleanUUID(updates.defaultSectionId);
    }
    if ('imageUrl' in updates) {
      updates.imageUrl = cleanUUID(updates.imageUrl);
    }

    // Se mudou parentCategoryId, validar hierarquia
    if (updates.parentCategoryId !== undefined) {
      await catalogService.validateCategoryHierarchy(id, updates.parentCategoryId);

      // Recalcular level
      if (updates.parentCategoryId) {
        const parent = await CatalogCategory.findByPk(updates.parentCategoryId);
        updates.level = parent ? parent.level + 1 : 1;
      } else {
        updates.level = 1;
      }
    }

    await category.update(updates);

    res.json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar categoria
 * DELETE /api/catalog/categories/:id
 */
export const deleteCatalogCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await CatalogCategory.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar subcategorias
    const subcategoryCount = await CatalogCategory.count({
      where: { parentCategoryId: id }
    });

    if (subcategoryCount > 0) {
      return res.status(400).json({
        error: `Não é possível deletar. Existem ${subcategoryCount} subcategoria(s) associada(s)`
      });
    }

    // Verificar itens associados
    const itemsCount = await CatalogItem.count({
      where: { categoryId: id }
    });

    if (itemsCount > 0) {
      return res.status(400).json({
        error: `Não é possível deletar. Existem ${itemsCount} item(ns) associado(s)`
      });
    }

    await category.destroy();

    logger.info(`Categoria deletada: ${category.name}`);

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ITENS DO CATÁLOGO ====================

/**
 * Buscar itens com filtros avançados
 * GET /api/catalog/items?itemType=incident&categoryId=xxx&search=vpn
 */
export const getCatalogItems = async (req, res, next) => {
  try {
    const {
      categoryId,
      itemType,
      search,
      keywords,
      requiresApproval,
      includeInactive
    } = req.query;

    const filters = {
      categoryId,
      itemType,
      search,
      keywords: keywords ? keywords.split(',') : null,
      requiresApproval: requiresApproval === 'true' ? true : requiresApproval === 'false' ? false : null,
      includeInactive: includeInactive === 'true'
    };

    const items = await catalogService.searchCatalogItems(
      req.user.organizationId,
      filters
    );

    res.json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obter item específico com detalhes completos
 * GET /api/catalog/items/:id
 */
export const getCatalogItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await CatalogItem.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color', 'imageUrl']
        }
      ]
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Cliente só pode ver itens públicos
    if (req.user.role === 'cliente-org' && !item.isPublic) {
      return res.status(403).json({ error: 'Item não disponível' });
    }

    // Obter category path
    const categoryPath = await catalogService.getCategoryPath(item.categoryId);

    res.json({
      success: true,
      item: {
        ...item.get({ plain: true }),
        categoryPath
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Criar item do catálogo
 * POST /api/catalog/items
 */
export const createCatalogItem = async (req, res, next) => {
  try {
    const {
      categoryId,
      name,
      shortDescription,
      fullDescription,
      icon,
      imageUrl,
      itemType,
      priorityId,
      typeId,
      slaId,
      defaultTicketCategoryId,
      defaultPriority,
      autoAssignPriority,
      skipApprovalForIncidents,
      requiresApproval,
      defaultApproverId,
      defaultDirectionId,
      defaultDepartmentId,
      defaultSectionId,
      defaultWorkflowId,
      incidentWorkflowId,
      assignmentType,
      defaultAgentId,
      estimatedCost,
      costCurrency,
      estimatedDeliveryTime,
      keywords,
      customFields,
      isPublic,
      order
    } = req.body;

    if (!categoryId || !name) {
      return res.status(400).json({ error: 'Categoria e nome são obrigatórios' });
    }

    // Validar customFields
    if (customFields && !Array.isArray(customFields)) {
      return res.status(400).json({ error: 'customFields deve ser um array' });
    }

    // Converter strings vazias em null para campos UUID
    const cleanUUID = (value) => value === '' || value === undefined ? null : value;
    
    // Converter strings vazias em null para campos numéricos
    const cleanNumeric = (value) => {
      if (value === '' || value === undefined || value === null) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const item = await CatalogItem.create({
      organizationId: req.user.organizationId,
      categoryId,
      name,
      shortDescription,
      fullDescription,
      icon: icon || 'Box',
      imageUrl: cleanUUID(imageUrl),
      itemType: itemType || 'service',
      priorityId: cleanUUID(priorityId),
      typeId: cleanUUID(typeId),
      slaId: cleanUUID(slaId),
      defaultTicketCategoryId: cleanUUID(defaultTicketCategoryId),
      defaultPriority: defaultPriority || 'media',
      autoAssignPriority: autoAssignPriority || false,
      skipApprovalForIncidents: skipApprovalForIncidents !== undefined ? skipApprovalForIncidents : true,
      requiresApproval: requiresApproval || false,
      defaultApproverId: cleanUUID(defaultApproverId),
      defaultDirectionId: cleanUUID(defaultDirectionId),
      defaultDepartmentId: cleanUUID(defaultDepartmentId),
      defaultSectionId: cleanUUID(defaultSectionId),
      defaultWorkflowId: cleanUUID(defaultWorkflowId),
      incidentWorkflowId: cleanUUID(incidentWorkflowId),
      assignmentType: assignmentType || 'department',
      defaultAgentId: cleanUUID(defaultAgentId),
      estimatedCost: cleanNumeric(estimatedCost),
      costCurrency: costCurrency || 'EUR',
      estimatedDeliveryTime: cleanNumeric(estimatedDeliveryTime),
      keywords: keywords || [],
      customFields: customFields || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      order: order || 0
    });

    logger.info(`Item de catálogo criado: ${name} (Tipo: ${itemType || 'service'})`);

    res.json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Atualizar item
 * PUT /api/catalog/items/:id
 */
export const updateCatalogItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await CatalogItem.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Validar customFields se fornecido
    if (updates.customFields && !Array.isArray(updates.customFields)) {
      return res.status(400).json({ error: 'customFields deve ser um array' });
    }

    // Converter strings vazias em null para campos UUID
    const cleanUUID = (value) => value === '' || value === undefined ? null : value;
    
    // Converter strings vazias em null para campos numéricos
    const cleanNumeric = (value) => {
      if (value === '' || value === undefined || value === null) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const uuidFields = [
      'priorityId', 'typeId', 'slaId', 'defaultTicketCategoryId', 'defaultApproverId',
      'defaultDirectionId', 'defaultDepartmentId', 'defaultSectionId',
      'defaultWorkflowId', 'incidentWorkflowId', 'defaultAgentId', 
      'imageUrl', 'assignedDepartmentId'
    ];

    uuidFields.forEach(field => {
      if (field in updates) {
        updates[field] = cleanUUID(updates[field]);
      }
    });
    
    // Sanitizar campos numéricos
    const numericFields = ['estimatedCost', 'estimatedDeliveryTime'];
    numericFields.forEach(field => {
      if (field in updates) {
        updates[field] = cleanNumeric(updates[field]);
      }
    });

    await item.update(updates);

    res.json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar item
 * DELETE /api/catalog/items/:id
 */
export const deleteCatalogItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await CatalogItem.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Verificar se tem solicitações associadas
    const requestsCount = await ServiceRequest.count({
      where: { catalogItemId: id }
    });

    if (requestsCount > 0) {
      // Apenas desativar, não deletar
      await item.update({ isActive: false });
      return res.json({
        success: true,
        message: 'Item desativado (existem solicitações associadas)'
      });
    }

    await item.destroy();

    logger.info(`Item de catálogo deletado: ${item.name}`);

    res.json({
      success: true,
      message: 'Item deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SERVICE REQUESTS ====================

/**
 * Criar solicitação de serviço (com regras de negócio)
 * POST /api/catalog/requests
 */
export const createServiceRequest = async (req, res, next) => {
  try {
    const { catalogItemId, formData, userProvidedPriority } = req.body;

    if (!catalogItemId || !formData) {
      return res.status(400).json({
        error: 'catalogItemId e formData são obrigatórios'
      });
    }

    // Usar o service para aplicar regras de negócio
    const result = await catalogService.createServiceRequest(
      catalogItemId,
      req.user.id,
      formData,
      req.user.organizationId,
      { userProvidedPriority }
    );

    res.json({
      success: true,
      serviceRequest: result.serviceRequest,
      ticket: result.ticket,
      autoCreated: result.autoCreated,
      message: result.autoCreated
        ? 'Ticket criado automaticamente'
        : 'Aguardando aprovação'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar service requests
 * GET /api/catalog/requests
 */
export const getServiceRequests = async (req, res, next) => {
  try {
    const { status, catalogItemId, requestType } = req.query;

    const where = { organizationId: req.user.organizationId };

    // Clientes só veem suas próprias solicitações
    if (req.user.role === 'cliente-org') {
      where.userId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (catalogItemId) {
      where.catalogItemId = catalogItemId;
    }

    if (requestType) {
      where.requestType = requestType;
    }

    const requests = await ServiceRequest.findAll({
      where,
      include: [
        {
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'icon', 'itemType', 'estimatedCost', 'estimatedDeliveryTime']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aprovar/Rejeitar service request
 * POST /api/catalog/requests/:id/approve
 */
export const approveServiceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, comments, approvedCost } = req.body;

    const serviceRequest = await ServiceRequest.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: CatalogItem,
          as: 'catalogItem'
        }
      ]
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    if (serviceRequest.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Solicitação já foi processada' });
    }

    const updateData = {
      approvedById: req.user.id,
      approvedAt: new Date(),
      notes: comments
    };

    if (approved) {
      updateData.status = 'approved';

      // Determinar roteamento e criar ticket
      const routing = await catalogService.determineRouting(
        serviceRequest.catalogItem
      );

      const workflowId = catalogService.getWorkflowByType(serviceRequest.catalogItem);

      const ticket = await catalogService.createTicketFromRequest(
        serviceRequest,
        serviceRequest.catalogItem,
        routing,
        workflowId,
        serviceRequest.finalPriority || serviceRequest.catalogItem.defaultPriority
      );

      updateData.ticketId = ticket.id;
      updateData.status = 'in_progress';

      logger.info(`Service request aprovado: ${id} - Ticket: ${ticket.ticketNumber}`);
    } else {
      updateData.status = 'rejected';
      updateData.rejectionReason = comments;
      updateData.rejectedById = req.user.id;
      updateData.rejectedAt = new Date();

      logger.info(`Service request rejeitado: ${id}`);
    }

    await serviceRequest.update(updateData);

    res.json({
      success: true,
      serviceRequest
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PORTAL DO CLIENTE ====================

/**
 * Portal do cliente - Hierarquia de categorias
 * GET /api/catalog/portal/categories
 */
export const getPortalCategories = async (req, res, next) => {
  try {
    const tree = await catalogService.getCategoryHierarchy(
      req.user.organizationId,
      { includeInactive: false }
    );

    res.json({
      success: true,
      categories: tree
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Portal do cliente - Itens de uma categoria
 * GET /api/catalog/portal/categories/:categoryId/items
 */
export const getPortalCategoryItems = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const items = await catalogService.searchCatalogItems(
      req.user.organizationId,
      {
        categoryId,
        includeInactive: false
      }
    );

    res.json({
      success: true,
      items
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Portal do cliente - Itens mais populares
 * GET /api/catalog/portal/popular?limit=10&itemType=incident
 */
export const getPortalPopularItems = async (req, res, next) => {
  try {
    const { limit = 10, itemType } = req.query;

    const items = await catalogService.getMostPopularItems(
      req.user.organizationId,
      parseInt(limit),
      itemType || null
    );

    res.json({
      success: true,
      items
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ESTATÍSTICAS ====================

/**
 * Estatísticas do catálogo
 * GET /api/catalog/statistics
 */
export const getCatalogStatistics = async (req, res, next) => {
  try {
    // Estatísticas básicas com fallback
    const totalCategories = await CatalogCategory.count({
      where: {
        organizationId: req.user.organizationId,
        isActive: true
      }
    }).catch(() => 0);

    const totalItems = await CatalogItem.count({
      where: {
        organizationId: req.user.organizationId,
        isActive: true
      }
    }).catch(() => 0);

    const totalRequests = await ServiceRequest.count({
      where: { organizationId: req.user.organizationId }
    }).catch(() => 0);

    const pendingApprovals = await ServiceRequest.count({
      where: {
        organizationId: req.user.organizationId,
        status: 'pending_approval'
      }
    }).catch(() => 0);

    // Estatísticas avançadas (opcional)
    let statsByType = {};
    let mostPopular = [];

    try {
      statsByType = await catalogService.getStatisticsByType(
        req.user.organizationId
      );
    } catch (error) {
      logger.error('Erro ao obter estatísticas por tipo:', error);
      statsByType = {};
    }

    try {
      mostPopular = await catalogService.getMostPopularItems(
        req.user.organizationId,
        5
      );
    } catch (error) {
      logger.error('Erro ao obter itens populares:', error);
      mostPopular = [];
    }

    res.json({
      success: true,
      statistics: {
        totalCategories,
        totalItems,
        totalRequests,
        pendingApprovals,
        byType: statsByType,
        mostPopular
      }
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas do catálogo:', error);
    next(error);
  }
};

export default {
  // Categorias
  getCatalogCategories,
  getCategoryById,
  createCatalogCategory,
  updateCatalogCategory,
  deleteCatalogCategory,
  // Itens
  getCatalogItems,
  getCatalogItemById,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  // Service Requests
  createServiceRequest,
  getServiceRequests,
  approveServiceRequest,
  // Portal do Cliente
  getPortalCategories,
  getPortalCategoryItems,
  getPortalPopularItems,
  // Estatísticas
  getCatalogStatistics
};
