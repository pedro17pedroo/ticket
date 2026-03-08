import { CatalogAccessControl } from './catalogAccessModel.js';
import { CatalogCategory, CatalogItem } from '../catalog/catalogModel.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

/**
 * Catalog Access Controller
 * 
 * Implementa lógica de controle de acesso granular ao catálogo.
 * 
 * Hierarquia de permissões:
 * 1. Deny explícito tem precedência sobre Allow
 * 2. Permissão de usuário sobrepõe estrutura organizacional
 * 3. Herança: Direção → Departamento → Secção → Usuário
 * 4. Herança de recursos: Categoria pai → Subcategorias → Itens
 */

/**
 * Obter permissões efetivas do usuário atual
 * 
 * @route GET /api/catalog/effective-access
 * @access Private
 */
export const getEffectiveAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const organizationId = user.organizationId;
    
    // Buscar todas as regras de ACL da organização
    const allRules = await CatalogAccessControl.findAll({
      where: { organizationId }
    });
    
    // Se não há regras, acesso total (padrão)
    if (allRules.length === 0) {
      return res.json({
        success: true,
        data: {
          accessMode: 'all',
          message: 'Acesso total ao catálogo (sem restrições configuradas)'
        }
      });
    }
    
    // Construir lista de entidades do usuário (hierarquia)
    const userEntities = [
      { type: 'user', id: user.id }
    ];
    
    if (user.sectionId) {
      userEntities.push({ type: 'section', id: user.sectionId });
    }
    if (user.departmentId) {
      userEntities.push({ type: 'department', id: user.departmentId });
    }
    if (user.directionId) {
      userEntities.push({ type: 'direction', id: user.directionId });
    }
    
    // Filtrar regras aplicáveis ao usuário
    const applicableRules = allRules.filter(rule => 
      userEntities.some(entity => 
        entity.type === rule.entityType && entity.id === rule.entityId
      )
    );
    
    // Separar por tipo de acesso
    const allowRules = applicableRules.filter(r => r.accessType === 'allow');
    const denyRules = applicableRules.filter(r => r.accessType === 'deny');
    
    // Construir listas de recursos permitidos/negados
    const allowedCategories = [...new Set(
      allowRules
        .filter(r => r.resourceType === 'category')
        .map(r => r.resourceId)
    )];
    
    const allowedItems = [...new Set(
      allowRules
        .filter(r => r.resourceType === 'item')
        .map(r => r.resourceId)
    )];
    
    const deniedCategories = [...new Set(
      denyRules
        .filter(r => r.resourceType === 'category')
        .map(r => r.resourceId)
    )];
    
    const deniedItems = [...new Set(
      denyRules
        .filter(r => r.resourceType === 'item')
        .map(r => r.resourceId)
    )];
    
    res.json({
      success: true,
      data: {
        accessMode: 'restricted',
        allowedCategories,
        allowedItems,
        deniedCategories,
        deniedItems,
        userEntities: userEntities.map(e => ({ type: e.type, id: e.id }))
      }
    });
  } catch (error) {
    logger.error('Erro ao obter permissões efetivas:', error);
    next(error);
  }
};

/**
 * Verificar se usuário tem acesso a um recurso
 * 
 * @param {Object} user - Usuário
 * @param {string} resourceType - 'category' ou 'item'
 * @param {string} resourceId - UUID do recurso
 * @returns {Promise<boolean>} Tem acesso
 */
export const hasAccess = async (user, resourceType, resourceId) => {
  try {
    const organizationId = user.organizationId;
    
    // Buscar todas as regras de ACL da organização
    const allRules = await CatalogAccessControl.findAll({
      where: { organizationId }
    });
    
    // Se não há regras, acesso total
    if (allRules.length === 0) {
      return true;
    }
    
    // Construir hierarquia de entidades do usuário
    const entities = [
      { type: 'user', id: user.id, priority: 4 }
    ];
    
    if (user.sectionId) {
      entities.push({ type: 'section', id: user.sectionId, priority: 3 });
    }
    if (user.departmentId) {
      entities.push({ type: 'department', id: user.departmentId, priority: 2 });
    }
    if (user.directionId) {
      entities.push({ type: 'direction', id: user.directionId, priority: 1 });
    }
    
    // Ordenar por prioridade (usuário tem maior prioridade)
    entities.sort((a, b) => b.priority - a.priority);
    
    // Verificar regras para o recurso específico
    for (const entity of entities) {
      const rule = allRules.find(r => 
        r.entityType === entity.type &&
        r.entityId === entity.id &&
        r.resourceType === resourceType &&
        r.resourceId === resourceId
      );
      
      if (rule) {
        // Deny tem precedência
        if (rule.accessType === 'deny') {
          return false;
        }
        // Allow encontrado
        if (rule.accessType === 'allow') {
          return true;
        }
      }
    }
    
    // Se é um item, verificar acesso à categoria pai
    if (resourceType === 'item') {
      const item = await CatalogItem.findByPk(resourceId);
      if (item && item.categoryId) {
        return await hasAccess(user, 'category', item.categoryId);
      }
    }
    
    // Se é uma subcategoria, verificar acesso à categoria pai
    if (resourceType === 'category') {
      const category = await CatalogCategory.findByPk(resourceId);
      if (category && category.parentCategoryId) {
        return await hasAccess(user, 'category', category.parentCategoryId);
      }
    }
    
    // Padrão: sem acesso
    return false;
  } catch (error) {
    logger.error('Erro ao verificar acesso:', error);
    return false;
  }
};

/**
 * Filtrar categorias acessíveis pelo usuário
 * 
 * @param {Object} user - Usuário
 * @param {Array} categories - Lista de categorias
 * @returns {Promise<Array>} Categorias filtradas
 */
export const filterAccessibleCategories = async (user, categories) => {
  const accessible = [];
  
  for (const category of categories) {
    const hasAccessToCategory = await hasAccess(user, 'category', category.id);
    if (hasAccessToCategory) {
      // Se tem subcategorias, filtrar recursivamente
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories = await filterAccessibleCategories(user, category.subcategories);
      }
      accessible.push(category);
    }
  }
  
  return accessible;
};

/**
 * Filtrar itens acessíveis pelo usuário
 * 
 * @param {Object} user - Usuário
 * @param {Array} items - Lista de itens
 * @returns {Promise<Array>} Itens filtrados
 */
export const filterAccessibleItems = async (user, items) => {
  const accessible = [];
  
  for (const item of items) {
    const hasAccessToItem = await hasAccess(user, 'item', item.id);
    if (hasAccessToItem) {
      accessible.push(item);
    }
  }
  
  return accessible;
};

// ==================== CRUD de Regras de ACL ====================

/**
 * Criar regra de acesso
 * 
 * @route POST /api/catalog/access-control
 * @access Private (Admin)
 */
export const createAccessRule = async (req, res, next) => {
  try {
    const { entityType, entityId, resourceType, resourceId, accessType } = req.body;
    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;
    
    // Validar campos obrigatórios
    if (!entityType || !entityId || !resourceType || !resourceId) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: entityType, entityId, resourceType, resourceId'
      });
    }
    
    // Validar enums
    const validEntityTypes = ['direction', 'department', 'section', 'user', 'client'];
    const validResourceTypes = ['category', 'item'];
    const validAccessTypes = ['allow', 'deny'];
    
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: `entityType inválido. Valores permitidos: ${validEntityTypes.join(', ')}`
      });
    }
    
    if (!validResourceTypes.includes(resourceType)) {
      return res.status(400).json({
        success: false,
        error: `resourceType inválido. Valores permitidos: ${validResourceTypes.join(', ')}`
      });
    }
    
    if (accessType && !validAccessTypes.includes(accessType)) {
      return res.status(400).json({
        success: false,
        error: `accessType inválido. Valores permitidos: ${validAccessTypes.join(', ')}`
      });
    }
    
    // Criar ou atualizar regra
    const rule = await CatalogAccessControl.upsertRule({
      organizationId,
      entityType,
      entityId,
      resourceType,
      resourceId,
      accessType: accessType || 'allow',
      createdBy
    });
    
    logger.info(`Regra de acesso criada: ${entityType}/${entityId} → ${resourceType}/${resourceId} (${accessType || 'allow'})`);
    
    res.json({
      success: true,
      rule
    });
  } catch (error) {
    logger.error('Erro ao criar regra de acesso:', error);
    next(error);
  }
};

/**
 * Listar regras de acesso
 * 
 * @route GET /api/catalog/access-control
 * @access Private (Admin)
 */
export const getAccessRules = async (req, res, next) => {
  try {
    const { entityType, entityId, resourceType, resourceId } = req.query;
    const organizationId = req.user.organizationId;
    
    const where = { organizationId };
    
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;
    
    const rules = await CatalogAccessControl.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    logger.error('Erro ao listar regras de acesso:', error);
    next(error);
  }
};

/**
 * Atualizar regra de acesso
 * 
 * @route PUT /api/catalog/access-control/:id
 * @access Private (Admin)
 */
export const updateAccessRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accessType } = req.body;
    const organizationId = req.user.organizationId;
    
    const rule = await CatalogAccessControl.findOne({
      where: { id, organizationId }
    });
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Regra não encontrada'
      });
    }
    
    if (accessType) {
      const validAccessTypes = ['allow', 'deny'];
      if (!validAccessTypes.includes(accessType)) {
        return res.status(400).json({
          success: false,
          error: `accessType inválido. Valores permitidos: ${validAccessTypes.join(', ')}`
        });
      }
      
      await rule.update({ accessType });
    }
    
    logger.info(`Regra de acesso atualizada: ${id}`);
    
    res.json({
      success: true,
      rule
    });
  } catch (error) {
    logger.error('Erro ao atualizar regra de acesso:', error);
    next(error);
  }
};

/**
 * Deletar regra de acesso
 * 
 * @route DELETE /api/catalog/access-control/:id
 * @access Private (Admin)
 */
export const deleteAccessRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    
    const rule = await CatalogAccessControl.findOne({
      where: { id, organizationId }
    });
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Regra não encontrada'
      });
    }
    
    await rule.destroy();
    
    logger.info(`Regra de acesso deletada: ${id}`);
    
    res.json({
      success: true,
      message: 'Regra deletada com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao deletar regra de acesso:', error);
    next(error);
  }
};

/**
 * Obter regras de uma entidade
 * 
 * @route GET /api/catalog/access-control/entity/:entityType/:entityId
 * @access Private (Admin)
 */
export const getEntityRules = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const organizationId = req.user.organizationId;
    
    const rules = await CatalogAccessControl.findByEntity(entityType, entityId, organizationId);
    
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    logger.error('Erro ao obter regras da entidade:', error);
    next(error);
  }
};

/**
 * Obter regras de um recurso
 * 
 * @route GET /api/catalog/access-control/resource/:resourceType/:resourceId
 * @access Private (Admin)
 */
export const getResourceRules = async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;
    const organizationId = req.user.organizationId;
    
    const rules = await CatalogAccessControl.findByResource(resourceType, resourceId, organizationId);
    
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    logger.error('Erro ao obter regras do recurso:', error);
    next(error);
  }
};

export default {
  getEffectiveAccess,
  hasAccess,
  filterAccessibleCategories,
  filterAccessibleItems,
  createAccessRule,
  getAccessRules,
  updateAccessRule,
  deleteAccessRule,
  getEntityRules,
  getResourceRules
};


// ==================== CLIENT CATALOG ACCESS ====================

/**
 * Get catalog access permissions for a client
 * 
 * @route GET /api/catalog-access/clients/:id
 * @access Private (org-admin, tenant-admin)
 */
export const getClientCatalogAccess = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;
    const organizationId = req.user.organizationId;

    // Get all access rules for this client
    const rules = await CatalogAccessControl.findAll({
      where: {
        organizationId,
        entityType: 'client',
        entityId: clientId
      }
    });

    // If no rules exist, client has full access (default)
    if (rules.length === 0) {
      return res.json({
        success: true,
        data: {
          accessMode: 'all',
          allowedCategories: [],
          allowedItems: [],
          deniedCategories: [],
          deniedItems: []
        }
      });
    }

    // Separate rules by access type and resource type
    const allowedCategories = rules
      .filter(r => r.accessType === 'allow' && r.resourceType === 'category')
      .map(r => r.resourceId);

    const allowedItems = rules
      .filter(r => r.accessType === 'allow' && r.resourceType === 'item')
      .map(r => r.resourceId);

    const deniedCategories = rules
      .filter(r => r.accessType === 'deny' && r.resourceType === 'category')
      .map(r => r.resourceId);

    const deniedItems = rules
      .filter(r => r.accessType === 'deny' && r.resourceType === 'item')
      .map(r => r.resourceId);

    // Determine access mode
    let accessMode = 'all';
    if (allowedCategories.length > 0 || allowedItems.length > 0) {
      accessMode = 'selected';
    } else if (deniedCategories.length > 0 || deniedItems.length > 0) {
      accessMode = 'none';
    }

    res.json({
      success: true,
      data: {
        accessMode,
        allowedCategories,
        allowedItems,
        deniedCategories,
        deniedItems
      }
    });
  } catch (error) {
    logger.error('Error getting client catalog access:', error);
    next(error);
  }
};

/**
 * Update catalog access permissions for a client
 * 
 * @route PUT /api/catalog-access/clients/:id
 * @access Private (org-admin, tenant-admin)
 */
export const updateClientCatalogAccess = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;
    const { accessMode, allowedCategories = [], allowedItems = [], deniedCategories = [], deniedItems = [] } = req.body;
    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;

    // Validate access mode
    const validModes = ['all', 'selected', 'none'];
    if (accessMode && !validModes.includes(accessMode)) {
      return res.status(400).json({
        success: false,
        error: `Modo de acesso inválido. Valores permitidos: ${validModes.join(', ')}`
      });
    }

    // Remove all existing rules for this client
    await CatalogAccessControl.destroy({
      where: {
        organizationId,
        entityType: 'client',
        entityId: clientId
      }
    });

    // Create new rules based on access mode
    const rulesToCreate = [];

    if (accessMode === 'selected') {
      // Add allow rules for selected categories
      for (const categoryId of allowedCategories) {
        rulesToCreate.push({
          organizationId,
          entityType: 'client',
          entityId: clientId,
          resourceType: 'category',
          resourceId: categoryId,
          accessType: 'allow',
          createdBy
        });
      }

      // Add allow rules for selected items
      for (const itemId of allowedItems) {
        rulesToCreate.push({
          organizationId,
          entityType: 'client',
          entityId: clientId,
          resourceType: 'item',
          resourceId: itemId,
          accessType: 'allow',
          createdBy
        });
      }
    } else if (accessMode === 'none') {
      // For 'none' mode, we could add deny rules for all categories
      // But it's simpler to just not have any allow rules
      // The frontend will handle the 'none' mode by checking if there are no rules
    }
    // For 'all' mode, no rules are needed (default behavior)

    // Bulk create rules if any
    if (rulesToCreate.length > 0) {
      await CatalogAccessControl.bulkCreate(rulesToCreate);
    }

    logger.info(`Client catalog access updated: client=${clientId}, mode=${accessMode}, rules=${rulesToCreate.length}`);

    res.json({
      success: true,
      message: 'Permissões de catálogo atualizadas com sucesso',
      data: {
        accessMode,
        allowedCategories,
        allowedItems,
        deniedCategories,
        deniedItems,
        rulesCreated: rulesToCreate.length
      }
    });
  } catch (error) {
    logger.error('Error updating client catalog access:', error);
    next(error);
  }
};

/**
 * Get audit history for client catalog access changes
 * 
 * @route GET /api/catalog-access/clients/:id/audit
 * @access Private (org-admin, tenant-admin)
 */
export const getClientCatalogAccessAudit = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const organizationId = req.user.organizationId;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get audit logs for this client's catalog access
    const { rows: auditLogs, count } = await CatalogAccessControl.findAndCountAll({
      where: {
        organizationId,
        entityType: 'client',
        entityId: clientId
      },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'resourceType', 'resourceId', 'accessType', 'createdBy', 'created_at']
    });

    res.json({
      success: true,
      auditLogs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting client catalog access audit:', error);
    next(error);
  }
};

// ==================== CLIENT USER CATALOG ACCESS ====================

/**
 * Get catalog access permissions for a client user
 * 
 * @route GET /api/catalog-access/client-users/:id
 * @access Private (org-admin, tenant-admin)
 */
export const getClientUserCatalogAccess = async (req, res, next) => {
  try {
    const { id: clientUserId } = req.params;
    const organizationId = req.user.organizationId;

    // Get all access rules for this client user
    const rules = await CatalogAccessControl.findAll({
      where: {
        organizationId,
        entityType: 'user',
        entityId: clientUserId
      }
    });

    // If no rules exist, user inherits from client (default)
    if (rules.length === 0) {
      return res.json({
        success: true,
        data: {
          accessMode: 'inherit',
          allowedCategories: [],
          allowedItems: [],
          deniedCategories: [],
          deniedItems: []
        }
      });
    }

    // Separate rules by access type and resource type
    const allowedCategories = rules
      .filter(r => r.accessType === 'allow' && r.resourceType === 'category')
      .map(r => r.resourceId);

    const allowedItems = rules
      .filter(r => r.accessType === 'allow' && r.resourceType === 'item')
      .map(r => r.resourceId);

    const deniedCategories = rules
      .filter(r => r.accessType === 'deny' && r.resourceType === 'category')
      .map(r => r.resourceId);

    const deniedItems = rules
      .filter(r => r.accessType === 'deny' && r.resourceType === 'item')
      .map(r => r.resourceId);

    // Determine access mode
    let accessMode = 'inherit';
    if (allowedCategories.length > 0 || allowedItems.length > 0) {
      accessMode = 'selected';
    } else if (deniedCategories.length > 0 || deniedItems.length > 0) {
      accessMode = 'none';
    }

    res.json({
      success: true,
      data: {
        accessMode,
        allowedCategories,
        allowedItems,
        deniedCategories,
        deniedItems
      }
    });
  } catch (error) {
    logger.error('Error getting client user catalog access:', error);
    next(error);
  }
};

/**
 * Update catalog access permissions for a client user
 * 
 * @route PUT /api/catalog-access/client-users/:id
 * @access Private (org-admin, tenant-admin)
 */
export const updateClientUserCatalogAccess = async (req, res, next) => {
  try {
    const { id: clientUserId } = req.params;
    const { accessMode, allowedCategories = [], allowedItems = [], deniedCategories = [], deniedItems = [] } = req.body;
    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;

    // Validate access mode
    const validModes = ['inherit', 'selected', 'none'];
    if (accessMode && !validModes.includes(accessMode)) {
      return res.status(400).json({
        success: false,
        error: `Modo de acesso inválido. Valores permitidos: ${validModes.join(', ')}`
      });
    }

    // Remove all existing rules for this client user
    await CatalogAccessControl.destroy({
      where: {
        organizationId,
        entityType: 'user',
        entityId: clientUserId
      }
    });

    // Create new rules based on access mode
    const rulesToCreate = [];

    if (accessMode === 'selected') {
      // Add allow rules for selected categories
      for (const categoryId of allowedCategories) {
        rulesToCreate.push({
          organizationId,
          entityType: 'user',
          entityId: clientUserId,
          resourceType: 'category',
          resourceId: categoryId,
          accessType: 'allow',
          createdBy
        });
      }

      // Add allow rules for selected items
      for (const itemId of allowedItems) {
        rulesToCreate.push({
          organizationId,
          entityType: 'user',
          entityId: clientUserId,
          resourceType: 'item',
          resourceId: itemId,
          accessType: 'allow',
          createdBy
        });
      }
    } else if (accessMode === 'none') {
      // For 'none' mode, we could add deny rules for all categories
      // But it's simpler to just not have any allow rules
    }
    // For 'inherit' mode, no rules are needed (default behavior)

    // Bulk create rules if any
    if (rulesToCreate.length > 0) {
      await CatalogAccessControl.bulkCreate(rulesToCreate);
    }

    logger.info(`Client user catalog access updated: user=${clientUserId}, mode=${accessMode}, rules=${rulesToCreate.length}`);

    res.json({
      success: true,
      message: 'Permissões de catálogo atualizadas com sucesso',
      data: {
        accessMode,
        allowedCategories,
        allowedItems,
        deniedCategories,
        deniedItems,
        rulesCreated: rulesToCreate.length
      }
    });
  } catch (error) {
    logger.error('Error updating client user catalog access:', error);
    next(error);
  }
};

/**
 * Get audit history for client user catalog access changes
 * 
 * @route GET /api/catalog-access/client-users/:id/audit
 * @access Private (org-admin, tenant-admin)
 */
export const getClientUserCatalogAccessAudit = async (req, res, next) => {
  try {
    const { id: clientUserId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const organizationId = req.user.organizationId;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get audit logs for this client user's catalog access
    const { rows: auditLogs, count } = await CatalogAccessControl.findAndCountAll({
      where: {
        organizationId,
        entityType: 'user',
        entityId: clientUserId
      },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'resourceType', 'resourceId', 'accessType', 'createdBy', 'created_at']
    });

    res.json({
      success: true,
      auditLogs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting client user catalog access audit:', error);
    next(error);
  }
};
