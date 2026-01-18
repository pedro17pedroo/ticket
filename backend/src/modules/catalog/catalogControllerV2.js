/**
 * Catalog Controller V2 - Com Sistema de Hierarquia e Tipos
 * 
 * Endpoints:
 * - Gestão de categorias com hierarquia
 * - Gestão de itens por tipo
 * - Portal do cliente
 * - Service requests com regras de negócio
 */

import { CatalogCategory, CatalogItem } from './catalogModel.js';
import { ServiceRequest } from './catalogModelSimple.js';
import catalogService from '../../services/catalogService.js';
import catalogAccessService from '../../services/catalogAccessService.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import { User, ClientUser, OrganizationUser } from '../models/index.js';
import * as notificationService from '../notifications/notificationService.js';
import { sequelize } from '../../config/database.js';
import Ticket from '../tickets/ticketModel.js';

// ==================== CATEGORIAS DO CATÁLOGO ====================

/**
 * Listar categorias com hierarquia
 * GET /api/catalog/categories?hierarchy=true
 * 
 * For client users, this endpoint filters categories based on their
 * effective catalog access permissions (Requirements: 4.1)
 */
export const getCatalogCategories = async (req, res, next) => {
  try {
    const { hierarchy, includeInactive } = req.query;

    // Check if user is a client user
    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);
    
    logger.info(`[getCatalogCategories] User: ${req.user.id}, Role: ${req.user.role}, isClientUser: ${isClientUser}`);

    // For client users, use the catalog access service to filter categories
    // Requirements: 4.1
    if (isClientUser && req.user.id) {
      try {
        logger.info(`[getCatalogCategories] Calling getAccessibleCategories for user ${req.user.id}`);
        const accessibleCategories = await catalogAccessService.getAccessibleCategories(req.user.id);
        
        logger.info(`[getCatalogCategories] Got ${accessibleCategories.length} root categories`);
        
        // Log the full JSON structure being returned
        const logCategoryTree = (cats, level = 0) => {
          cats.forEach(cat => {
            const subcatNames = cat.subcategories?.map(s => s.name) || [];
            logger.info(`[getCatalogCategories] ${'  '.repeat(level)}${cat.name} (${cat.subcategories?.length || 0} subcats: [${subcatNames.join(', ')}])`);
            if (cat.subcategories?.length > 0) {
              logCategoryTree(cat.subcategories, level + 1);
            }
          });
        };
        logCategoryTree(accessibleCategories);
        
        return res.json({
          success: true,
          categories: accessibleCategories,
          viewType: 'hierarchy'
        });
      } catch (accessError) {
        // If there's an error with access control, log it and fall back to standard filtering
        logger.warn(`Catalog access filtering failed for user ${req.user.id}, falling back to standard filtering:`, accessError.message);
        logger.error(`[getCatalogCategories] Error stack:`, accessError.stack);
      }
    }

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
 * 
 * For client users, this endpoint filters items based on their effective
 * catalog access permissions (Requirements: 4.1, 4.2)
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

    // Check if user is a client user
    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);

    // For client users, use the catalog access service to filter items
    // Requirements: 4.1, 4.2
    if (isClientUser && req.user.id) {
      try {
        const filteredItems = await catalogAccessService.filterCatalog(req.user.id, {
          categoryId,
          itemType,
          search
        });

        return res.json({
          success: true,
          items: filteredItems,
          count: filteredItems.length
        });
      } catch (accessError) {
        // If there's an error with access control, log it and fall back to standard filtering
        logger.warn(`Catalog access filtering failed for user ${req.user.id}, falling back to standard filtering:`, accessError.message);
      }
    }

    // Standard filtering for organization users or fallback
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
 * 
 * For client users, this endpoint verifies access permissions before
 * returning the item (Requirements: 4.3)
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

    // Check if user is a client user
    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);
    
    if (isClientUser) {
      // Client users can only see public items
      if (!item.isPublic) {
        return res.status(403).json({ 
          success: false,
          error: 'CATALOG_ACCESS_DENIED',
          message: 'Não tem permissão para aceder a este item do catálogo'
        });
      }

      // Check catalog access permissions (Requirements: 4.3)
      try {
        const hasAccess = await catalogAccessService.hasAccessToItem(req.user.id, id);
        if (!hasAccess) {
          return res.status(403).json({ 
            success: false,
            error: 'CATALOG_ACCESS_DENIED',
            message: 'Não tem permissão para aceder a este item do catálogo'
          });
        }
      } catch (accessError) {
        // Log the error but don't block access if the access control system fails
        logger.warn(`Catalog access check failed for user ${req.user.id}, item ${id}:`, accessError.message);
        // Fall back to basic public check which already passed
      }
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
    const {
      catalogItemId,
      formData,
      userProvidedPriority,
      additionalDetails,
      userPriority,
      expectedResolutionTime,
      attachments,
      clientWatchers // Novos watchers do cliente
    } = req.body;

    console.log('📥 Request body recebido:', req.body);
    console.log('📋 catalogItemId:', catalogItemId);
    console.log('📝 formData:', formData);
    console.log('📝 typeof formData:', typeof formData);
    console.log('📋 additionalDetails:', additionalDetails);
    console.log('⚠️  userPriority:', userPriority);
    console.log('📅 expectedResolutionTime:', expectedResolutionTime);
    console.log('📎 attachments:', attachments?.length || 0);
    console.log('👥 clientWatchers:', clientWatchers);

    if (!catalogItemId) {
      console.log('❌ Validação falhou - catalogItemId ausente');
      return res.status(400).json({
        error: 'catalogItemId é obrigatório'
      });
    }

    // formData pode ser um objeto vazio {} se não houver custom fields
    if (formData === undefined || formData === null) {
      console.log('❌ Validação falhou - formData ausente');
      return res.status(400).json({
        error: 'formData é obrigatório'
      });
    }

    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);

    // Usar o service para aplicar regras de negócio
    const result = await catalogService.createServiceRequest(
      catalogItemId,
      req.user.id,
      formData,
      req.user.organizationId,
      {
        userProvidedPriority,
        additionalDetails,
        userPriority,
        expectedResolutionTime,
        attachments,
        clientWatchers, // Incluir watchers
        isClientUser // Flag para indicar se é usuário cliente
      }
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
 * Listar service requests (agora busca de tickets com catalogItemId)
 * GET /api/catalog/requests
 */
export const getServiceRequests = async (req, res, next) => {
  try {
    const { status, catalogItemId, requestType } = req.query;

    // Buscar tickets que são solicitações de serviço (têm catalogItemId)
    const where = { 
      organizationId: req.user.organizationId,
      catalogItemId: { [Op.ne]: null } // Apenas tickets de solicitações
    };

    const include = [
      {
        model: CatalogItem,
        as: 'catalogItem',
        attributes: ['id', 'name', 'icon', 'itemType', 'estimatedCost', 'estimatedDeliveryTime']
      },
      {
        model: ClientUser,
        as: 'requesterClientUser',
        attributes: ['id', 'name', 'email', 'avatar'],
        required: false
      },
      {
        model: OrganizationUser,
        as: 'requesterOrgUser',
        attributes: ['id', 'name', 'email', 'avatar'],
        required: false
      }
    ];

    logger.info(`[getServiceRequests] User: ${req.user.id}, Role: ${req.user.role}, ClientId: ${req.user.clientId}`);

    // Clientes só veem solicitações da sua própria empresa cliente
    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);
    if (isClientUser) {
      let clientId = req.user.clientId;
      if (!clientId) {
        const userWithClient = await ClientUser.findByPk(req.user.id, { attributes: ['clientId'] });
        clientId = userWithClient?.clientId;
        logger.warn(`[getServiceRequests] ClientId não estava no token, buscado do banco: ${clientId}`);
      }

      if (!clientId) {
        logger.error(`[getServiceRequests] Usuário cliente sem clientId! userId: ${req.user.id}`);
        return res.status(400).json({
          success: false,
          error: 'Usuário sem empresa cliente associada'
        });
      }

      // CLIENT-ADMIN vê todas as solicitações da empresa cliente
      if (req.user.role === 'client-admin') {
        const clientUsers = await ClientUser.findAll({
          where: { clientId: clientId, isActive: true },
          attributes: ['id']
        });
        
        const clientUserIds = clientUsers.map(u => u.id);
        where.requesterClientUserId = { [Op.in]: clientUserIds };
        
        logger.info(`[getServiceRequests] Client-admin vendo solicitações de ${clientUserIds.length} usuários do cliente ${clientId}`);
      } else {
        where.requesterClientUserId = req.user.id;
        logger.info(`[getServiceRequests] Client-user vendo apenas suas próprias solicitações`);
      }
    }

    // Filtros
    if (status) {
      // Mapear status antigo para novo
      if (status === 'pending_approval') {
        where.requestStatus = 'pending';
      } else if (status === 'approved') {
        where.requestStatus = 'approved';
      } else if (status === 'rejected') {
        where.requestStatus = 'rejected';
      } else {
        where.status = status; // Status do ticket
      }
    }

    if (catalogItemId) {
      where.catalogItemId = catalogItemId;
    }

    if (requestType) {
      // requestType agora está em metadata ou pode ser inferido do catalogItem
      // Por enquanto, ignorar este filtro ou buscar no metadata
    }

    // Buscar tickets (que são as solicitações)
    const tickets = await Ticket.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']]
    });

    logger.info(`[getServiceRequests] Total de solicitações encontradas: ${tickets.length}`);

    // Transformar tickets em formato de solicitações para compatibilidade
    const requests = tickets.map(ticket => {
      const requester = ticket.requesterClientUser || ticket.requesterOrgUser;
      
      return {
        id: ticket.id,
        organizationId: ticket.organizationId,
        catalogItemId: ticket.catalogItemId,
        catalogItem: ticket.catalogItem,
        userId: ticket.requesterClientUserId || ticket.requesterOrgUserId,
        clientUserId: ticket.requesterClientUserId,
        requester: requester,
        ticketId: ticket.id, // O próprio ticket
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        },
        formData: ticket.requestFormData || {},
        requestType: ticket.catalogItem?.itemType,
        status: ticket.requestStatus || 'approved',
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      };
    });

    logger.info(`[getServiceRequests] Solicitações transformadas: ${requests.length}`);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    logger.error('[getServiceRequests] Erro:', error);
    next(error);
  }
};

/**
 * Obter detalhes de uma solicitação específica
 * GET /api/catalog/requests/:id
 */
export const getServiceRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = {
      id,
      organizationId: req.user.organizationId
    };

    const include = [
      {
        model: CatalogItem,
        as: 'catalogItem',
        attributes: ['id', 'name', 'icon', 'itemType', 'shortDescription', 'fullDescription', 'estimatedCost', 'estimatedDeliveryTime', 'requiresApproval']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        required: false
      },
      {
        model: User,
        as: 'approvedBy',
        attributes: ['id', 'name', 'email'],
        required: false
      },
      {
        model: User,
        as: 'rejectedBy',
        attributes: ['id', 'name', 'email'],
        required: false
      }
    ];

    // Clientes só veem solicitações criadas por eles mesmos
    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);
    if (isClientUser) {
      // Filtrar por clientUserId diretamente no ServiceRequest
      where.clientUserId = req.user.id;
      logger.info(`[getServiceRequestById] Filtrando por clientUserId: ${req.user.id}`);
    }

    const request = await ServiceRequest.findOne({
      where,
      include
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Solicitação não encontrada'
      });
    }

    // Serializar corretamente os dados e mapear 'user' para 'requester'
    const plain = request.get({ plain: true });

    // Parsear formData se for string JSON
    let formData = plain.formData;
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch (e) {
        // Se não for JSON válido, manter como string
      }
    }

    const serializedRequest = {
      ...plain,
      requester: plain.user, // Mapear user para requester
      formData, // Usar formData parseado
      createdAt: plain.createdAt || plain.created_at,
      updatedAt: plain.updatedAt || plain.updated_at
    };

    res.json({
      success: true,
      data: serializedRequest
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

    // Aceitar tanto 'pending' quanto 'pending_approval'
    if (!['pending', 'pending_approval'].includes(serviceRequest.status)) {
      return res.status(400).json({ error: 'Solicitação já foi processada' });
    }

    const updateData = {
      approvedById: req.user.id,
      approvedAt: new Date()
    };

    if (approved) {
      updateData.status = 'approved';
      updateData.approvalComments = comments;

      // Atualizar status do ticket existente de 'aguardando_aprovacao' para 'novo'
      if (serviceRequest.ticketId) {
        const { Ticket } = await import('../models/index.js');
        await Ticket.update(
          { status: 'novo' },
          { where: { id: serviceRequest.ticketId } }
        );
        logger.info(`Service request aprovado: ${id} - Ticket ${serviceRequest.ticketId} mudou para novo`);
      } else {
        logger.warn(`Service request aprovado mas não tem ticketId: ${id}`);
      }
    } else {
      updateData.status = 'rejected';
      updateData.rejectionReason = comments;
      updateData.rejectedById = req.user.id;
      updateData.rejectedAt = new Date();

      // Cancelar/fechar o ticket associado
      if (serviceRequest.ticketId) {
        const { Ticket } = await import('../models/index.js');
        await Ticket.update(
          {
            status: 'fechado',
            resolution: `Solicitação rejeitada: ${comments || 'Sem motivo informado'}`
          },
          { where: { id: serviceRequest.ticketId } }
        );
        logger.info(`Service request rejeitado: ${id} - Ticket ${serviceRequest.ticketId} fechado`);
      }
    }

    await serviceRequest.update(updateData);

    // Enviar notificações (async - não bloqueia resposta)
    if (serviceRequest.ticketId) {
      const { Ticket } = await import('../models/index.js');
      const ticket = await Ticket.findByPk(serviceRequest.ticketId);

      if (ticket) {
        if (approved) {
          notificationService.notifyTicketApproved(ticket, req.user.id, req.user.name)
            .catch(err => logger.error('Erro ao notificar aprovação:', err));
        } else {
          // Notificar rejeição (usando tipo ticket_rejected)
          notificationService.createNotification({
            recipientId: ticket.requesterId,
            recipientType: ticket.requesterType === 'client' ? 'client' : 'organization',
            organizationId: ticket.organizationId,
            type: 'ticket_rejected',
            title: 'Solicitação Rejeitada',
            message: `Solicitação #${ticket.ticketNumber} foi rejeitada`,
            ticketId: ticket.id,
            link: `/tickets/${ticket.id}`,
            priority: 'high',
            data: {
              ticketNumber: ticket.ticketNumber,
              rejectionReason: comments || 'Sem motivo informado'
            },
            actorId: req.user.id,
            actorType: 'organization',
            actorName: req.user.name
          }).catch(err => logger.error('Erro ao notificar rejeição:', err));
        }
      }
    }

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
 * 
 * For client users, this endpoint filters categories based on their
 * effective catalog access permissions (Requirements: 4.1)
 */
export const getPortalCategories = async (req, res, next) => {
  try {
    // Check if user is a client user
    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);

    // For client users, use the catalog access service to filter categories
    if (isClientUser && req.user.id) {
      try {
        const accessibleCategories = await catalogAccessService.getAccessibleCategories(req.user.id);
        
        return res.json({
          success: true,
          categories: accessibleCategories
        });
      } catch (accessError) {
        // If there's an error with access control, log it and fall back to standard filtering
        logger.warn(`Catalog access filtering failed for user ${req.user.id}, falling back to standard filtering:`, accessError.message);
      }
    }

    // Standard filtering for organization users or fallback
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
 * 
 * For client users, this endpoint filters items based on their
 * effective catalog access permissions (Requirements: 4.1, 4.2)
 */
export const getPortalCategoryItems = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    // Check if user is a client user
    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);

    // For client users, use the catalog access service to filter items
    if (isClientUser && req.user.id) {
      try {
        const filteredItems = await catalogAccessService.filterCatalog(req.user.id, {
          categoryId
        });

        return res.json({
          success: true,
          items: filteredItems
        });
      } catch (accessError) {
        // If there's an error with access control, log it and fall back to standard filtering
        logger.warn(`Catalog access filtering failed for user ${req.user.id}, falling back to standard filtering:`, accessError.message);
      }
    }

    // Standard filtering for organization users or fallback
    const items = await catalogService.searchCatalogItems(
      req.user.organizationId,
      {
        categoryId,
        includeInactive: false,
        recursive: false
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
 * 
 * For client users, this endpoint filters items based on their
 * effective catalog access permissions (Requirements: 4.1, 4.2)
 */
export const getPortalPopularItems = async (req, res, next) => {
  try {
    const { limit = 10, itemType } = req.query;

    // Check if user is a client user
    const isClientUser = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);

    // For client users, filter popular items by access permissions
    if (isClientUser && req.user.id) {
      try {
        // Get all accessible items first
        const filteredItems = await catalogAccessService.filterCatalog(req.user.id, {
          itemType: itemType || null
        });

        // Sort by requestCount (popularity) and limit
        const popularItems = filteredItems
          .sort((a, b) => (b.requestCount || 0) - (a.requestCount || 0))
          .slice(0, parseInt(limit));

        return res.json({
          success: true,
          items: popularItems
        });
      } catch (accessError) {
        // If there's an error with access control, log it and fall back to standard filtering
        logger.warn(`Catalog access filtering failed for user ${req.user.id}, falling back to standard filtering:`, accessError.message);
      }
    }

    // Standard filtering for organization users or fallback
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

/**
 * Analytics do catálogo
 * GET /api/catalog/analytics
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { period = 30 } = req.query;
    const periodDays = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Total de solicitações no período
    const totalRequests = await ServiceRequest.count({
      where: {
        organization_id: req.user.organizationId,
        created_at: { [Op.gte]: startDate }
      }
    });

    // Solicitações por status
    const requestsByStatus = await ServiceRequest.findAll({
      where: {
        organization_id: req.user.organizationId,
        created_at: { [Op.gte]: startDate }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Itens mais solicitados
    const topItems = await ServiceRequest.findAll({
      where: {
        organization_id: req.user.organizationId,
        created_at: { [Op.gte]: startDate }
      },
      attributes: [
        'catalog_item_id',
        [sequelize.fn('COUNT', sequelize.col('ServiceRequest.id')), 'count']
      ],
      include: [
        {
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'icon']
        }
      ],
      group: ['catalog_item_id', 'catalogItem.id', 'catalogItem.name', 'catalogItem.icon'],
      order: [[sequelize.fn('COUNT', sequelize.col('ServiceRequest.id')), 'DESC']],
      limit: 10,
      raw: false
    });

    // Tempo médio de aprovação (em horas)
    const approvedRequests = await ServiceRequest.findAll({
      where: {
        organization_id: req.user.organizationId,
        status: 'approved',
        approved_at: { [Op.gte]: startDate }
      },
      attributes: ['created_at', 'approved_at'],
      raw: true
    });

    let avgApprovalTime = 0;
    if (approvedRequests.length > 0) {
      const totalTime = approvedRequests.reduce((sum, req) => {
        const created = new Date(req.created_at);
        const approved = new Date(req.approved_at);
        return sum + (approved - created);
      }, 0);
      avgApprovalTime = Math.round(totalTime / approvedRequests.length / (1000 * 60 * 60)); // horas
    }

    // Solicitações por dia (últimos 7 dias)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await ServiceRequest.count({
        where: {
          organization_id: req.user.organizationId,
          created_at: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          }
        }
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    // Taxa de aprovação
    const totalProcessed = requestsByStatus
      .filter(r => r.status === 'approved' || r.status === 'rejected')
      .reduce((sum, r) => sum + parseInt(r.count), 0);

    const totalApproved = requestsByStatus
      .find(r => r.status === 'approved')?.count || 0;

    const approvalRate = totalProcessed > 0
      ? Math.round((totalApproved / totalProcessed) * 100)
      : 0;

    // Tempo médio de resolução (considerando tickets associados que foram fechados)
    let avgResolutionTime = 0;
    try {
      const { Ticket } = await import('../models/index.js');
      const resolvedTickets = await Ticket.findAll({
        where: {
          organization_id: req.user.organizationId,
          status: 'fechado',
          updated_at: { [Op.gte]: startDate }
        },
        attributes: ['created_at', 'updated_at'],
        raw: true
      });

      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at);
          const resolved = new Date(ticket.updated_at);
          return sum + (resolved - created);
        }, 0);
        avgResolutionTime = Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // horas
      }
    } catch (error) {
      logger.warn('Erro ao calcular tempo médio de resolução:', error);
    }

    // Taxa de conclusão (solicitações aprovadas que geraram tickets resolvidos)
    let completionRate = 0;
    try {
      const { Ticket } = await import('../models/index.js');
      const approvedWithTickets = await ServiceRequest.count({
        where: {
          organization_id: req.user.organizationId,
          status: 'approved',
          ticket_id: { [Op.ne]: null },
          created_at: { [Op.gte]: startDate }
        }
      });

      if (approvedWithTickets > 0) {
        const completedTickets = await ServiceRequest.count({
          where: {
            organization_id: req.user.organizationId,
            status: 'approved',
            ticket_id: { [Op.ne]: null },
            created_at: { [Op.gte]: startDate }
          },
          include: [{
            model: Ticket,
            as: 'ticket',
            where: { status: 'fechado' },
            required: true
          }]
        });

        completionRate = Math.round((completedTickets / approvedWithTickets) * 100);
      }
    } catch (error) {
      logger.warn('Erro ao calcular taxa de conclusão:', error);
    }

    res.json({
      success: true,
      data: {
        period: periodDays,
        summary: {
          totalRequests,
          avgApprovalTime,
          avgResolutionTime,
          approvalRate,
          completionRate
        },
        requestsByStatus: requestsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        topItems: topItems.map(item => ({
          id: item.catalog_item_id,
          name: item.catalogItem?.name,
          icon: item.catalogItem?.icon,
          count: parseInt(item.get('count'))
        })),
        timeline: last7Days
      }
    });
  } catch (error) {
    logger.error('Erro ao obter analytics:', error);
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
  getServiceRequestById,
  approveServiceRequest,
  // Portal do Cliente
  getPortalCategories,
  getPortalCategoryItems,
  getPortalPopularItems,
  // Estatísticas
  getCatalogStatistics,
  getAnalytics
};
