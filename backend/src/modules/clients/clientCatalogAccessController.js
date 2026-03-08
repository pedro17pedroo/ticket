/**
 * Client Catalog Access Controller
 * 
 * Manages catalog access permissions for B2B clients.
 * Allows organization admins to control which catalog categories and items
 * each client can view and request.
 */

import { CatalogAccessControl } from '../catalogAccess/catalogAccessModel.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

/**
 * Get catalog access permissions for a client
 * 
 * @route GET /api/clients/:id/catalog-access
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
 * @route PUT /api/clients/:id/catalog-access
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
 * @route GET /api/clients/:id/catalog-access/audit
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

export default {
  getClientCatalogAccess,
  updateClientCatalogAccess,
  getClientCatalogAccessAudit
};
