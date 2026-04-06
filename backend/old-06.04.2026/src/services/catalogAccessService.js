/**
 * Catalog Access Service - Gestão de Permissões de Acesso ao Catálogo
 * 
 * Gerencia:
 * - Permissões de acesso ao catálogo por cliente
 * - Permissões de acesso ao catálogo por utilizador cliente
 * - Cálculo de permissões efetivas (herança)
 * - Filtragem do catálogo baseada em permissões
 * - Cache de permissões efetivas (via CatalogAccessCacheService)
 * 
 * Feature: catalog-access-control
 */

import {
  ClientCatalogAccess,
  ClientUserCatalogAccess
} from '../modules/catalogAccess/index.js';
import { CatalogCategory, CatalogItem } from '../modules/catalog/catalogModel.js';
import Client from '../modules/clients/clientModel.js';
import ClientUser from '../modules/clients/clientUserModel.js';
import catalogAccessCacheService from './catalogAccessCacheService.js';
import catalogAccessAuditService from './catalogAccessAuditService.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';

class CatalogAccessService {
  /**
   * Get catalog access rules for a client
   * @param {string} clientId - Client UUID
   * @returns {Promise<Object>} Access rules
   * 
   * Requirements: 1.1, 1.2
   */
  async getClientAccess(clientId) {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    // Find existing access rules
    const access = await ClientCatalogAccess.findOne({
      where: { clientId }
    });

    // If no rules exist, return default (all access)
    if (!access) {
      return {
        clientId,
        accessMode: 'all',
        allowedCategories: [],
        allowedItems: [],
        deniedCategories: [],
        deniedItems: [],
        isDefault: true
      };
    }

    return {
      id: access.id,
      clientId: access.clientId,
      organizationId: access.organizationId,
      accessMode: access.accessMode,
      allowedCategories: access.allowedCategories || [],
      allowedItems: access.allowedItems || [],
      deniedCategories: access.deniedCategories || [],
      deniedItems: access.deniedItems || [],
      modifiedBy: access.modifiedBy,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt,
      isDefault: false
    };
  }

  /**
   * Set catalog access rules for a client
   * @param {string} clientId - Client UUID
   * @param {Object} rules - New access rules
   * @param {string} modifiedBy - User who made the change
   * @param {Object} [auditOptions] - Optional audit options
   * @param {string} [auditOptions.changedByName] - Name of user who made the change
   * @param {string} [auditOptions.ipAddress] - IP address from which change was made
   * @returns {Promise<Object>} Updated access rules
   * 
   * Requirements: 1.1, 1.2, 5.1, 5.2
   */
  async setClientAccess(clientId, rules, modifiedBy, auditOptions = {}) {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    // Get client to verify it exists and get organizationId
    const client = await Client.findByPk(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Validate access mode
    const validModes = ['all', 'selected', 'none'];
    if (rules.accessMode && !validModes.includes(rules.accessMode)) {
      throw new Error(`Invalid access mode. Must be one of: ${validModes.join(', ')}`);
    }

    // Get existing access for audit
    const existingAccess = await ClientCatalogAccess.findOne({
      where: { clientId }
    });

    const previousState = existingAccess ? existingAccess.toJSON() : null;

    // Prepare data
    const accessData = {
      organizationId: client.organizationId,
      clientId,
      accessMode: rules.accessMode || 'all',
      allowedCategories: rules.allowedCategories || [],
      allowedItems: rules.allowedItems || [],
      deniedCategories: rules.deniedCategories || [],
      deniedItems: rules.deniedItems || [],
      modifiedBy
    };

    let access;
    let action;

    if (existingAccess) {
      // Update existing
      await existingAccess.update(accessData);
      access = existingAccess;
      action = 'update';
    } else {
      // Create new
      access = await ClientCatalogAccess.create(accessData);
      action = 'create';
    }

    logger.info(`Client catalog access ${action}d for client ${clientId}`);

    // Log audit entry (Requirements: 5.1, 5.2)
    if (modifiedBy) {
      try {
        await catalogAccessAuditService.logChange({
          organizationId: client.organizationId,
          entityType: 'client',
          entityId: clientId,
          action,
          previousState,
          newState: access.toJSON(),
          changedBy: modifiedBy,
          changedByName: auditOptions.changedByName || null,
          ipAddress: auditOptions.ipAddress || null
        });
      } catch (auditError) {
        // Log error but don't fail the operation
        logger.error(`Failed to create audit log for client ${clientId}:`, auditError);
      }
    }

    // Invalidate cache for all users of this client (Requirements: 4.5)
    await catalogAccessCacheService.invalidateClientCache(clientId);

    return {
      id: access.id,
      clientId: access.clientId,
      organizationId: access.organizationId,
      accessMode: access.accessMode,
      allowedCategories: access.allowedCategories || [],
      allowedItems: access.allowedItems || [],
      deniedCategories: access.deniedCategories || [],
      deniedItems: access.deniedItems || [],
      modifiedBy: access.modifiedBy,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt
    };
  }

  /**
   * Get catalog access rules for a client user
   * @param {string} clientUserId - Client User UUID
   * @returns {Promise<Object>} Access rules with inheritance mode
   * 
   * Requirements: 2.1
   */
  async getUserAccess(clientUserId) {
    if (!clientUserId) {
      throw new Error('Client User ID is required');
    }

    // Find existing access rules
    const access = await ClientUserCatalogAccess.findOne({
      where: { clientUserId }
    });

    // If no rules exist, return default (inherit from client)
    if (!access) {
      // Get client user to find parent client
      const clientUser = await ClientUser.findByPk(clientUserId);
      if (!clientUser) {
        throw new Error('Client user not found');
      }

      return {
        clientUserId,
        clientId: clientUser.clientId,
        inheritanceMode: 'inherit',
        accessMode: 'all',
        allowedCategories: [],
        allowedItems: [],
        deniedCategories: [],
        deniedItems: [],
        isDefault: true
      };
    }

    return {
      id: access.id,
      clientUserId: access.clientUserId,
      clientId: access.clientId,
      organizationId: access.organizationId,
      inheritanceMode: access.inheritanceMode,
      accessMode: access.accessMode,
      allowedCategories: access.allowedCategories || [],
      allowedItems: access.allowedItems || [],
      deniedCategories: access.deniedCategories || [],
      deniedItems: access.deniedItems || [],
      modifiedBy: access.modifiedBy,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt,
      isDefault: false
    };
  }

  /**
   * Set catalog access rules for a client user
   * @param {string} clientUserId - Client User UUID
   * @param {Object} rules - New access rules
   * @param {string} modifiedBy - User who made the change
   * @param {Object} [auditOptions] - Optional audit options
   * @param {string} [auditOptions.changedByName] - Name of user who made the change
   * @param {string} [auditOptions.ipAddress] - IP address from which change was made
   * @returns {Promise<Object>} Updated access rules
   * 
   * Requirements: 2.1, 5.1, 5.2
   */
  async setUserAccess(clientUserId, rules, modifiedBy, auditOptions = {}) {
    if (!clientUserId) {
      throw new Error('Client User ID is required');
    }

    // Get client user to verify it exists and get organizationId/clientId
    const clientUser = await ClientUser.findByPk(clientUserId);
    if (!clientUser) {
      throw new Error('Client user not found');
    }

    // Validate inheritance mode
    const validInheritanceModes = ['inherit', 'override', 'extend'];
    if (rules.inheritanceMode && !validInheritanceModes.includes(rules.inheritanceMode)) {
      throw new Error(`Invalid inheritance mode. Must be one of: ${validInheritanceModes.join(', ')}`);
    }

    // Validate access mode
    const validAccessModes = ['all', 'selected', 'none'];
    if (rules.accessMode && !validAccessModes.includes(rules.accessMode)) {
      throw new Error(`Invalid access mode. Must be one of: ${validAccessModes.join(', ')}`);
    }

    // Get existing access for audit
    const existingAccess = await ClientUserCatalogAccess.findOne({
      where: { clientUserId }
    });

    const previousState = existingAccess ? existingAccess.toJSON() : null;

    // Prepare data
    const accessData = {
      organizationId: clientUser.organizationId,
      clientUserId,
      clientId: clientUser.clientId,
      inheritanceMode: rules.inheritanceMode || 'inherit',
      accessMode: rules.accessMode || 'all',
      allowedCategories: rules.allowedCategories || [],
      allowedItems: rules.allowedItems || [],
      deniedCategories: rules.deniedCategories || [],
      deniedItems: rules.deniedItems || [],
      modifiedBy
    };

    let access;
    let action;

    if (existingAccess) {
      // Update existing
      await existingAccess.update(accessData);
      access = existingAccess;
      action = 'update';
    } else {
      // Create new
      access = await ClientUserCatalogAccess.create(accessData);
      action = 'create';
    }

    logger.info(`Client user catalog access ${action}d for user ${clientUserId}`);

    // Log audit entry (Requirements: 5.1, 5.2)
    if (modifiedBy) {
      try {
        await catalogAccessAuditService.logChange({
          organizationId: clientUser.organizationId,
          entityType: 'client_user',
          entityId: clientUserId,
          action,
          previousState,
          newState: access.toJSON(),
          changedBy: modifiedBy,
          changedByName: auditOptions.changedByName || null,
          ipAddress: auditOptions.ipAddress || null
        });
      } catch (auditError) {
        // Log error but don't fail the operation
        logger.error(`Failed to create audit log for client user ${clientUserId}:`, auditError);
      }
    }

    // Invalidate cache for this specific user (Requirements: 4.5)
    await catalogAccessCacheService.invalidateCache(clientUserId);

    return {
      id: access.id,
      clientUserId: access.clientUserId,
      clientId: access.clientId,
      organizationId: access.organizationId,
      inheritanceMode: access.inheritanceMode,
      accessMode: access.accessMode,
      allowedCategories: access.allowedCategories || [],
      allowedItems: access.allowedItems || [],
      deniedCategories: access.deniedCategories || [],
      deniedItems: access.deniedItems || [],
      modifiedBy: access.modifiedBy,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt
    };
  }


  /**
   * Calculate effective permissions for a client user
   * Applies inheritance logic based on inheritanceMode
   * Uses cache for performance optimization (Requirements: 4.4)
   * 
   * @param {string} clientUserId - Client User UUID
   * @param {boolean} skipCache - Skip cache lookup (for testing)
   * @returns {Promise<Object>} Resolved effective permissions
   * 
   * Requirements: 2.2, 2.3, 2.4, 6.4
   */
  async getEffectiveAccess(clientUserId, skipCache = false) {
    if (!clientUserId) {
      throw new Error('Client User ID is required');
    }
    
    logger.info(`[getEffectiveAccess] Getting effective access for clientUserId: ${clientUserId}`);

    // Try to get from cache first (Requirements: 4.4)
    if (!skipCache) {
      const cached = await catalogAccessCacheService.getFromCache(clientUserId);
      if (cached) {
        logger.info(`[getEffectiveAccess] Returning cached access for ${clientUserId}`);
        return cached;
      }
    }

    // Get client user to find parent client
    const clientUser = await ClientUser.findByPk(clientUserId);
    if (!clientUser) {
      logger.error(`[getEffectiveAccess] Client user not found: ${clientUserId}`);
      throw new Error('Client user not found');
    }
    
    logger.info(`[getEffectiveAccess] Found client user: ${clientUser.name}, clientId: ${clientUser.clientId}`);

    // Get user-specific access rules
    const userAccess = await this.getUserAccess(clientUserId);
    logger.info(`[getEffectiveAccess] User access: inheritanceMode=${userAccess.inheritanceMode}, isDefault=${userAccess.isDefault}`);
    
    // Get client (parent) access rules
    const clientAccess = await this.getClientAccess(clientUser.clientId);
    logger.info(`[getEffectiveAccess] Client access: accessMode=${clientAccess.accessMode}, allowedCategories=${JSON.stringify(clientAccess.allowedCategories)}`);

    // Calculate effective permissions based on inheritance mode
    let effectiveAccess;

    switch (userAccess.inheritanceMode) {
      case 'inherit':
        // Use client permissions entirely
        effectiveAccess = {
          accessMode: clientAccess.accessMode,
          allowedCategories: [...clientAccess.allowedCategories],
          allowedItems: [...clientAccess.allowedItems],
          deniedCategories: [...clientAccess.deniedCategories],
          deniedItems: [...clientAccess.deniedItems]
        };
        break;

      case 'override':
        // Use user-specific permissions entirely
        effectiveAccess = {
          accessMode: userAccess.accessMode,
          allowedCategories: [...userAccess.allowedCategories],
          allowedItems: [...userAccess.allowedItems],
          deniedCategories: [...userAccess.deniedCategories],
          deniedItems: [...userAccess.deniedItems]
        };
        break;

      case 'extend':
        // Combine client and user permissions (union)
        // For extend mode, we use the more permissive access mode
        let accessMode = clientAccess.accessMode;
        if (userAccess.accessMode === 'all' || clientAccess.accessMode === 'all') {
          accessMode = 'all';
        } else if (userAccess.accessMode === 'selected' || clientAccess.accessMode === 'selected') {
          accessMode = 'selected';
        } else {
          accessMode = 'none';
        }

        effectiveAccess = {
          accessMode,
          // Union of allowed categories and items
          allowedCategories: this._uniqueArray([
            ...clientAccess.allowedCategories,
            ...userAccess.allowedCategories
          ]),
          allowedItems: this._uniqueArray([
            ...clientAccess.allowedItems,
            ...userAccess.allowedItems
          ]),
          // Union of denied categories and items
          deniedCategories: this._uniqueArray([
            ...clientAccess.deniedCategories,
            ...userAccess.deniedCategories
          ]),
          deniedItems: this._uniqueArray([
            ...clientAccess.deniedItems,
            ...userAccess.deniedItems
          ])
        };
        break;

      default:
        // Default to inherit
        effectiveAccess = {
          accessMode: clientAccess.accessMode,
          allowedCategories: [...clientAccess.allowedCategories],
          allowedItems: [...clientAccess.allowedItems],
          deniedCategories: [...clientAccess.deniedCategories],
          deniedItems: [...clientAccess.deniedItems]
        };
    }

    // Build result object
    const result = {
      clientUserId,
      clientId: clientUser.clientId,
      organizationId: clientUser.organizationId,
      inheritanceMode: userAccess.inheritanceMode,
      ...effectiveAccess,
      // Include source info for debugging
      _source: {
        clientAccess: {
          accessMode: clientAccess.accessMode,
          isDefault: clientAccess.isDefault
        },
        userAccess: {
          inheritanceMode: userAccess.inheritanceMode,
          isDefault: userAccess.isDefault
        }
      }
    };

    // Cache the result (Requirements: 4.4)
    await catalogAccessCacheService.cacheEffectiveAccess(
      clientUserId,
      result,
      clientUser.clientId
    );

    return result;
  }

  /**
   * Check if a category or item is accessible based on effective permissions
   * Implements whitelist/blacklist logic with blacklist precedence
   * Now supports hierarchical category checking
   * 
   * @param {Object} effectiveAccess - Effective permissions object
   * @param {string} categoryId - Category UUID to check
   * @param {string} itemId - Item UUID to check (optional)
   * @param {Array} categoryAncestors - Array of ancestor category IDs (optional)
   * @returns {boolean} Whether access is granted
   * 
   * Requirements: 6.4
   */
  _isAccessible(effectiveAccess, categoryId, itemId = null, categoryAncestors = []) {
    const {
      accessMode,
      allowedCategories,
      allowedItems,
      deniedCategories,
      deniedItems
    } = effectiveAccess;

    // Check blacklist first (blacklist takes precedence)
    if (itemId && deniedItems.includes(itemId)) {
      return false;
    }
    
    // Check if category or any of its ancestors are denied
    if (categoryId && deniedCategories.includes(categoryId)) {
      return false;
    }
    if (categoryAncestors && categoryAncestors.some(ancestorId => deniedCategories.includes(ancestorId))) {
      return false;
    }

    // Handle access modes
    switch (accessMode) {
      case 'all':
        // All items accessible (except denied ones, already checked)
        return true;

      case 'none':
        // No items accessible
        return false;

      case 'selected':
        // Only whitelisted items/categories accessible
        if (itemId && allowedItems.includes(itemId)) {
          return true;
        }
        // Check if the category itself is allowed
        if (categoryId && allowedCategories.includes(categoryId)) {
          return true;
        }
        // Check if any ancestor category is allowed (hierarchical permission)
        if (categoryAncestors && categoryAncestors.some(ancestorId => allowedCategories.includes(ancestorId))) {
          return true;
        }
        return false;

      default:
        return true;
    }
  }

  /**
   * Filter catalog items based on user permissions
   * @param {string} clientUserId - Client User UUID
   * @param {Object} query - Search/filter parameters
   * @returns {Promise<Array>} Filtered catalog items
   * 
   * Requirements: 4.1, 4.2, 4.3
   */
  async filterCatalog(clientUserId, query = {}) {
    if (!clientUserId) {
      throw new Error('Client User ID is required');
    }

    // Get effective permissions
    const effectiveAccess = await this.getEffectiveAccess(clientUserId);

    // If access mode is 'none', return empty array
    if (effectiveAccess.accessMode === 'none') {
      return [];
    }

    // Build base query for catalog items
    const where = {
      organizationId: effectiveAccess.organizationId,
      isActive: true,
      isPublic: true
    };

    // Apply search filter if provided
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { shortDescription: { [Op.iLike]: `%${query.search}%` } },
        { keywords: { [Op.contains]: [query.search] } }
      ];
    }

    // Apply category filter if provided
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    // Apply item type filter if provided
    if (query.itemType) {
      where.itemType = query.itemType;
    }

    // Fetch all matching items
    const items = await CatalogItem.findAll({
      where,
      include: [
        {
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color', 'parentCategoryId']
        }
      ],
      order: [['requestCount', 'DESC'], ['name', 'ASC']]
    });

    // Fetch all categories to build ancestor map
    const allCategories = await CatalogCategory.findAll({
      where: {
        organizationId: effectiveAccess.organizationId,
        isActive: true
      },
      attributes: ['id', 'parentCategoryId']
    });

    // Build a map of category ancestors
    const categoryAncestorsMap = new Map();
    const buildAncestors = (categoryId) => {
      if (categoryAncestorsMap.has(categoryId)) {
        return categoryAncestorsMap.get(categoryId);
      }
      
      const ancestors = [];
      const category = allCategories.find(c => c.id === categoryId);
      
      if (category && category.parentCategoryId) {
        ancestors.push(category.parentCategoryId);
        const parentAncestors = buildAncestors(category.parentCategoryId);
        ancestors.push(...parentAncestors);
      }
      
      categoryAncestorsMap.set(categoryId, ancestors);
      return ancestors;
    };

    // Filter items based on effective permissions with hierarchical support
    const filteredItems = items.filter(item => {
      const ancestors = buildAncestors(item.categoryId);
      return this._isAccessible(
        effectiveAccess,
        item.categoryId,
        item.id,
        ancestors
      );
    });

    return filteredItems;
  }

  /**
   * Check if user has access to a specific catalog item
   * @param {string} clientUserId - Client User UUID
   * @param {string} itemId - Catalog Item UUID
   * @returns {Promise<boolean>} Has access
   * 
   * Requirements: 4.3
   */
  async hasAccessToItem(clientUserId, itemId) {
    if (!clientUserId || !itemId) {
      return false;
    }

    // Get the item to find its category
    const item = await CatalogItem.findByPk(itemId, {
      include: [{
        model: CatalogCategory,
        as: 'category',
        attributes: ['id', 'parentCategoryId']
      }]
    });
    
    if (!item) {
      return false;
    }

    // Get effective permissions
    const effectiveAccess = await this.getEffectiveAccess(clientUserId);

    // Build category ancestors
    const ancestors = [];
    let currentCategory = item.category;
    while (currentCategory && currentCategory.parentCategoryId) {
      ancestors.push(currentCategory.parentCategoryId);
      currentCategory = await CatalogCategory.findByPk(currentCategory.parentCategoryId, {
        attributes: ['id', 'parentCategoryId']
      });
    }

    // Check if item is accessible with hierarchical support
    return this._isAccessible(effectiveAccess, item.categoryId, itemId, ancestors);
  }

  /**
   * Get filtered categories based on user permissions
   * Returns categories in hierarchical structure, including parent categories
   * when a subcategory is permitted
   * 
   * @param {string} clientUserId - Client User UUID
   * @returns {Promise<Array>} Filtered categories in tree structure
   * 
   * Requirements: 4.1
   */
  async getAccessibleCategories(clientUserId) {
    if (!clientUserId) {
      throw new Error('Client User ID is required');
    }

    // Get effective permissions
    const effectiveAccess = await this.getEffectiveAccess(clientUserId);
    
    logger.info(`[getAccessibleCategories] User: ${clientUserId}, AccessMode: ${effectiveAccess.accessMode}`);
    logger.info(`[getAccessibleCategories] Allowed Categories: ${JSON.stringify(effectiveAccess.allowedCategories)}`);
    logger.info(`[getAccessibleCategories] Denied Categories: ${JSON.stringify(effectiveAccess.deniedCategories)}`);

    // If access mode is 'none', return empty array
    if (effectiveAccess.accessMode === 'none') {
      return [];
    }

    // Fetch all active categories for the organization
    const allCategories = await CatalogCategory.findAll({
      where: {
        organizationId: effectiveAccess.organizationId,
        isActive: true
      },
      order: [['level', 'ASC'], ['order', 'ASC'], ['name', 'ASC']]
    });
    
    logger.info(`[getAccessibleCategories] Total categories in DB: ${allCategories.length}`);

    // If access mode is 'all', return full hierarchy
    if (effectiveAccess.accessMode === 'all') {
      const hierarchy = this._buildCategoryHierarchy(allCategories, effectiveAccess);
      logger.info(`[getAccessibleCategories] Access mode 'all', returning ${hierarchy.length} root categories`);
      return hierarchy;
    }

    // For 'selected' mode, we need to:
    // 1. Find all directly permitted categories
    // 2. Include all parent categories (for navigation) - but NOT their siblings
    // 3. Include all child categories (subcategories) of permitted categories
    // 4. Build the hierarchy tree
    
    const permittedCategoryIds = new Set(effectiveAccess.allowedCategories || []);
    const deniedCategoryIds = new Set(effectiveAccess.deniedCategories || []);
    
    logger.info(`[getAccessibleCategories] Permitted IDs: ${Array.from(permittedCategoryIds).join(', ')}`);
    logger.info(`[getAccessibleCategories] Denied IDs: ${Array.from(deniedCategoryIds).join(', ')}`);
    
    // Find all categories that need to be included (permitted + their ancestors + their descendants)
    const categoriesToInclude = new Set();
    
    // Helper function to add all descendants of a category
    const addDescendants = (categoryId) => {
      const children = allCategories.filter(c => c.parentCategoryId === categoryId);
      for (const child of children) {
        if (!deniedCategoryIds.has(child.id)) {
          categoriesToInclude.add(child.id);
          addDescendants(child.id); // Recursively add descendants
        }
      }
    };
    
    // First, add all permitted categories and their descendants
    for (const category of allCategories) {
      // Skip denied categories
      if (deniedCategoryIds.has(category.id)) {
        continue;
      }
      
      // Check if this category is directly permitted
      if (permittedCategoryIds.has(category.id)) {
        categoriesToInclude.add(category.id);
        
        // Add all descendants (subcategories)
        addDescendants(category.id);
      }
    }
    
    // Now add ancestors for navigation (but only the direct path, not siblings)
    const ancestorsToAdd = new Set();
    for (const categoryId of categoriesToInclude) {
      const category = allCategories.find(c => c.id === categoryId);
      logger.info(`[getAccessibleCategories] Processing category for ancestors: ${category?.name} (ID: ${categoryId}, parentCategoryId: ${category?.parentCategoryId})`);
      if (category && category.parentCategoryId) {
        let parentId = category.parentCategoryId;
        while (parentId) {
          logger.info(`[getAccessibleCategories] Adding ancestor: ${parentId}`);
          if (!deniedCategoryIds.has(parentId)) {
            ancestorsToAdd.add(parentId);
          }
          const parent = allCategories.find(c => c.id === parentId);
          logger.info(`[getAccessibleCategories] Found parent: ${parent?.name} (ID: ${parent?.id}, parentCategoryId: ${parent?.parentCategoryId})`);
          parentId = parent ? parent.parentCategoryId : null;
        }
      }
    }
    
    logger.info(`[getAccessibleCategories] Ancestors to add: ${Array.from(ancestorsToAdd).join(', ')}`);
    
    // Add ancestors to the set
    for (const ancestorId of ancestorsToAdd) {
      categoriesToInclude.add(ancestorId);
    }
    
    logger.info(`[getAccessibleCategories] Categories to include: ${Array.from(categoriesToInclude).join(', ')}`);

    // Filter categories to only include permitted ones and their ancestors/descendants
    const filteredCategories = allCategories.filter(cat => 
      categoriesToInclude.has(cat.id) && !deniedCategoryIds.has(cat.id)
    );
    
    logger.info(`[getAccessibleCategories] Filtered categories count: ${filteredCategories.length}`);
    filteredCategories.forEach(cat => {
      logger.info(`[getAccessibleCategories] - ${cat.name} (ID: ${cat.id}, Parent: ${cat.parentCategoryId || 'root'}, Level: ${cat.level})`);
    });

    // Build hierarchy with permitted categories marked
    const hierarchy = this._buildCategoryHierarchy(filteredCategories, effectiveAccess, permittedCategoryIds);
    
    logger.info(`[getAccessibleCategories] Final hierarchy root count: ${hierarchy.length}`);
    hierarchy.forEach(cat => {
      logger.info(`[getAccessibleCategories] Root: ${cat.name} (${cat.subcategories?.length || 0} subcategories)`);
    });
    
    return hierarchy;
  }

  /**
   * Build category hierarchy tree from flat list
   * @private
   * @param {Array} categories - Flat list of categories
   * @param {Object} effectiveAccess - Effective permissions
   * @param {Set} permittedCategoryIds - Set of directly permitted category IDs
   * @returns {Array} Hierarchical category tree
   */
  _buildCategoryHierarchy(categories, effectiveAccess, permittedCategoryIds = null) {
    const categoryMap = new Map();
    const rootCategories = [];

    logger.info(`[_buildCategoryHierarchy] Building hierarchy from ${categories.length} categories`);

    // First pass: create map of all categories
    for (const category of categories) {
      const catData = category.get ? category.get({ plain: true }) : { ...category };
      catData.subcategories = [];
      
      // Mark if this category is directly permitted (for UI indication)
      if (permittedCategoryIds) {
        catData.isDirectlyPermitted = permittedCategoryIds.has(catData.id);
      }
      
      categoryMap.set(catData.id, catData);
      logger.info(`[_buildCategoryHierarchy] Added to map: ${catData.name} (ID: ${catData.id}, Parent: ${catData.parentCategoryId || 'root'})`);
    }

    logger.info(`[_buildCategoryHierarchy] Category map has ${categoryMap.size} entries`);

    // Second pass: build tree structure
    for (const [id, category] of categoryMap) {
      if (category.parentCategoryId) {
        if (categoryMap.has(category.parentCategoryId)) {
          const parent = categoryMap.get(category.parentCategoryId);
          parent.subcategories.push(category);
          logger.info(`[_buildCategoryHierarchy] Added ${category.name} as subcategory of ${parent.name}`);
        } else {
          // Parent not in map - this is an orphan, add as root for now
          logger.warn(`[_buildCategoryHierarchy] ORPHAN: ${category.name} (ID: ${id}) - parent ${category.parentCategoryId} not in map, adding as root`);
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
        logger.info(`[_buildCategoryHierarchy] Added ${category.name} as root category`);
      }
    }

    // Sort subcategories
    const sortCategories = (cats) => {
      cats.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
      });
      for (const cat of cats) {
        if (cat.subcategories && cat.subcategories.length > 0) {
          sortCategories(cat.subcategories);
        }
      }
    };
    
    sortCategories(rootCategories);
    
    // Log final hierarchy
    const logTree = (cats, level = 0) => {
      for (const cat of cats) {
        logger.info(`[_buildCategoryHierarchy] ${'  '.repeat(level)}${cat.name} (${cat.subcategories?.length || 0} subcats)`);
        if (cat.subcategories?.length > 0) {
          logTree(cat.subcategories, level + 1);
        }
      }
    };
    logger.info(`[_buildCategoryHierarchy] Final tree structure:`);
    logTree(rootCategories);
    
    return rootCategories;
  }

  /**
   * Helper: Remove duplicates from array
   * @private
   */
  _uniqueArray(arr) {
    return [...new Set(arr)];
  }

  /**
   * Get the cache service instance
   * Useful for direct cache operations or testing
   * @returns {CatalogAccessCacheService} Cache service instance
   */
  getCacheService() {
    return catalogAccessCacheService;
  }

  /**
   * Invalidate cache for a specific user
   * @param {string} clientUserId - Client User UUID
   * @returns {Promise<boolean>} Success status
   * 
   * Requirements: 4.5
   */
  async invalidateUserCache(clientUserId) {
    return catalogAccessCacheService.invalidateCache(clientUserId);
  }

  /**
   * Invalidate cache for all users of a client
   * @param {string} clientId - Client UUID
   * @returns {Promise<number>} Number of invalidated entries
   * 
   * Requirements: 4.5
   */
  async invalidateClientUsersCache(clientId) {
    return catalogAccessCacheService.invalidateClientCache(clientId);
  }

  /**
   * Get the audit service instance
   * Useful for direct audit operations or testing
   * @returns {CatalogAccessAuditService} Audit service instance
   * 
   * Requirements: 5.1, 5.2, 5.3
   */
  getAuditService() {
    return catalogAccessAuditService;
  }

  /**
   * Get audit history for a client
   * @param {string} clientId - Client UUID
   * @param {Object} [options] - Query options
   * @returns {Promise<Object>} Audit history with pagination info
   * 
   * Requirements: 5.3
   */
  async getClientAuditHistory(clientId, options = {}) {
    return catalogAccessAuditService.getAuditHistory('client', clientId, options);
  }

  /**
   * Get audit history for a client user
   * @param {string} clientUserId - Client User UUID
   * @param {Object} [options] - Query options
   * @returns {Promise<Object>} Audit history with pagination info
   * 
   * Requirements: 5.3
   */
  async getUserAuditHistory(clientUserId, options = {}) {
    return catalogAccessAuditService.getAuditHistory('client_user', clientUserId, options);
  }
}

export default new CatalogAccessService();
