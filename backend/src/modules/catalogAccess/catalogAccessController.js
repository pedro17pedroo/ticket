/**
 * Catalog Access Controller - API Endpoints for Catalog Access Control
 * 
 * Provides REST API endpoints for managing catalog access permissions
 * for clients and client users.
 * 
 * Feature: catalog-access-control
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import catalogAccessService from '../../services/catalogAccessService.js';
import { CatalogCategory, CatalogItem } from '../catalog/catalogModel.js';
import Client from '../clients/clientModel.js';
import ClientUser from '../clients/clientUserModel.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

// Roles that can manage client catalog access
const organizationAdminRoles = ['org-admin', 'tenant-admin', 'super-admin', 'provider-admin'];

/**
 * Validate that referenced category and item IDs exist in the organization
 * @param {string} organizationId - Organization UUID
 * @param {Array} categoryIds - Array of category UUIDs to validate
 * @param {Array} itemIds - Array of item UUIDs to validate
 * @returns {Object} Validation result with invalidIds if any
 * 
 * Requirements: 7.6
 */
async function validateCatalogReferences(organizationId, categoryIds = [], itemIds = []) {
  const invalidCategories = [];
  const invalidItems = [];

  // Validate categories
  if (categoryIds.length > 0) {
    const existingCategories = await CatalogCategory.findAll({
      where: {
        id: { [Op.in]: categoryIds },
        organizationId
      },
      attributes: ['id']
    });
    
    const existingCategoryIds = existingCategories.map(c => c.id);
    for (const catId of categoryIds) {
      if (!existingCategoryIds.includes(catId)) {
        invalidCategories.push(catId);
      }
    }
  }

  // Validate items
  if (itemIds.length > 0) {
    const existingItems = await CatalogItem.findAll({
      where: {
        id: { [Op.in]: itemIds },
        organizationId
      },
      attributes: ['id']
    });
    
    const existingItemIds = existingItems.map(i => i.id);
    for (const itemId of itemIds) {
      if (!existingItemIds.includes(itemId)) {
        invalidItems.push(itemId);
      }
    }
  }

  return {
    isValid: invalidCategories.length === 0 && invalidItems.length === 0,
    invalidCategories,
    invalidItems
  };
}

/**
 * GET /api/clients/:id/catalog-access
 * Retrieve catalog access rules for a client
 * 
 * Requirements: 7.1
 */
export const getClientCatalogAccess = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify client exists and belongs to the organization
    const client = await Client.findOne({
      where: { id: clientId, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'CLIENT_NOT_FOUND',
        message: 'Cliente não encontrado'
      });
    }

    const access = await catalogAccessService.getClientAccess(clientId);

    res.json({
      success: true,
      data: access
    });
  } catch (error) {
    logger.error('Error getting client catalog access:', error);
    next(error);
  }
};

/**
 * PUT /api/clients/:id/catalog-access
 * Update catalog access rules for a client
 * 
 * Requirements: 7.2, 7.6
 */
export const updateClientCatalogAccess = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;
    const organizationId = req.user.organizationId;
    const {
      accessMode,
      allowedCategories,
      allowedItems,
      deniedCategories,
      deniedItems
    } = req.body;

    // Verify permissions
    if (!organizationAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Sem permissão para atualizar permissões de catálogo'
      });
    }

    // Verify client exists and belongs to the organization
    const client = await Client.findOne({
      where: { id: clientId, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'CLIENT_NOT_FOUND',
        message: 'Cliente não encontrado'
      });
    }

    // Validate referenced categories and items exist (Requirements: 7.6)
    const allCategoryIds = [
      ...(allowedCategories || []),
      ...(deniedCategories || [])
    ];
    const allItemIds = [
      ...(allowedItems || []),
      ...(deniedItems || [])
    ];

    if (allCategoryIds.length > 0 || allItemIds.length > 0) {
      const validation = await validateCatalogReferences(
        organizationId,
        allCategoryIds,
        allItemIds
      );

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REFERENCES',
          message: 'Uma ou mais categorias ou itens referenciados não existem',
          details: {
            invalidCategories: validation.invalidCategories,
            invalidItems: validation.invalidItems
          }
        });
      }
    }

    const rules = {
      accessMode,
      allowedCategories: allowedCategories || [],
      allowedItems: allowedItems || [],
      deniedCategories: deniedCategories || [],
      deniedItems: deniedItems || []
    };

    const access = await catalogAccessService.setClientAccess(
      clientId,
      rules,
      req.user.id,
      {
        changedByName: req.user.name,
        ipAddress: req.ip || req.connection?.remoteAddress
      }
    );

    res.json({
      success: true,
      message: 'Permissões de catálogo atualizadas com sucesso',
      data: access
    });
  } catch (error) {
    logger.error('Error updating client catalog access:', error);
    next(error);
  }
};

/**
 * GET /api/client-users/:id/catalog-access
 * Retrieve catalog access rules for a client user
 * 
 * Requirements: 7.3
 */
export const getClientUserCatalogAccess = async (req, res, next) => {
  try {
    const { id: clientUserId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify client user exists and belongs to the organization
    const clientUser = await ClientUser.findOne({
      where: { id: clientUserId, organizationId }
    });

    if (!clientUser) {
      return res.status(404).json({
        success: false,
        error: 'CLIENT_USER_NOT_FOUND',
        message: 'Utilizador cliente não encontrado'
      });
    }

    const access = await catalogAccessService.getUserAccess(clientUserId);

    // Also get client access for reference
    const clientAccess = await catalogAccessService.getClientAccess(clientUser.clientId);

    res.json({
      success: true,
      data: {
        ...access,
        clientAccess: {
          accessMode: clientAccess.accessMode,
          allowedCategories: clientAccess.allowedCategories,
          allowedItems: clientAccess.allowedItems,
          deniedCategories: clientAccess.deniedCategories,
          deniedItems: clientAccess.deniedItems,
          isDefault: clientAccess.isDefault
        }
      }
    });
  } catch (error) {
    logger.error('Error getting client user catalog access:', error);
    next(error);
  }
};

/**
 * PUT /api/client-users/:id/catalog-access
 * Update catalog access rules for a client user
 * 
 * Requirements: 7.4, 7.6
 */
export const updateClientUserCatalogAccess = async (req, res, next) => {
  try {
    const { id: clientUserId } = req.params;
    const organizationId = req.user.organizationId;
    const {
      inheritanceMode,
      accessMode,
      allowedCategories,
      allowedItems,
      deniedCategories,
      deniedItems
    } = req.body;

    // Verify permissions
    if (!organizationAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Sem permissão para atualizar permissões de catálogo'
      });
    }

    // Verify client user exists and belongs to the organization
    const clientUser = await ClientUser.findOne({
      where: { id: clientUserId, organizationId }
    });

    if (!clientUser) {
      return res.status(404).json({
        success: false,
        error: 'CLIENT_USER_NOT_FOUND',
        message: 'Utilizador cliente não encontrado'
      });
    }

    // Validate referenced categories and items exist (Requirements: 7.6)
    const allCategoryIds = [
      ...(allowedCategories || []),
      ...(deniedCategories || [])
    ];
    const allItemIds = [
      ...(allowedItems || []),
      ...(deniedItems || [])
    ];

    if (allCategoryIds.length > 0 || allItemIds.length > 0) {
      const validation = await validateCatalogReferences(
        organizationId,
        allCategoryIds,
        allItemIds
      );

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REFERENCES',
          message: 'Uma ou mais categorias ou itens referenciados não existem',
          details: {
            invalidCategories: validation.invalidCategories,
            invalidItems: validation.invalidItems
          }
        });
      }
    }

    const rules = {
      inheritanceMode: inheritanceMode || 'inherit',
      accessMode: accessMode || 'all',
      allowedCategories: allowedCategories || [],
      allowedItems: allowedItems || [],
      deniedCategories: deniedCategories || [],
      deniedItems: deniedItems || []
    };

    const access = await catalogAccessService.setUserAccess(
      clientUserId,
      rules,
      req.user.id,
      {
        changedByName: req.user.name,
        ipAddress: req.ip || req.connection?.remoteAddress
      }
    );

    res.json({
      success: true,
      message: 'Permissões de catálogo do utilizador atualizadas com sucesso',
      data: access
    });
  } catch (error) {
    logger.error('Error updating client user catalog access:', error);
    next(error);
  }
};

/**
 * GET /api/catalog/effective-access
 * Get current user's effective catalog permissions
 * 
 * Requirements: 7.5
 */
export const getEffectiveAccess = async (req, res, next) => {
  try {
    const { userType, id: userId, clientId } = req.user;

    // This endpoint is for client users only
    if (userType !== 'client') {
      // For organization users, return full access
      return res.json({
        success: true,
        data: {
          accessMode: 'all',
          allowedCategories: [],
          allowedItems: [],
          deniedCategories: [],
          deniedItems: [],
          isOrganizationUser: true
        }
      });
    }

    // Get effective access for client user
    const effectiveAccess = await catalogAccessService.getEffectiveAccess(userId);

    res.json({
      success: true,
      data: effectiveAccess
    });
  } catch (error) {
    logger.error('Error getting effective catalog access:', error);
    next(error);
  }
};

/**
 * GET /api/clients/:id/catalog-access/audit
 * Get audit history for client catalog access changes
 * 
 * Requirements: 5.3
 */
export const getClientCatalogAccessAudit = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;
    const organizationId = req.user.organizationId;
    const { page = 1, limit = 20 } = req.query;

    // Verify client exists and belongs to the organization
    const client = await Client.findOne({
      where: { id: clientId, organizationId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'CLIENT_NOT_FOUND',
        message: 'Cliente não encontrado'
      });
    }

    const auditHistory = await catalogAccessService.getClientAuditHistory(clientId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      ...auditHistory
    });
  } catch (error) {
    logger.error('Error getting client catalog access audit:', error);
    next(error);
  }
};

/**
 * GET /api/client-users/:id/catalog-access/audit
 * Get audit history for client user catalog access changes
 * 
 * Requirements: 5.3
 */
export const getClientUserCatalogAccessAudit = async (req, res, next) => {
  try {
    const { id: clientUserId } = req.params;
    const organizationId = req.user.organizationId;
    const { page = 1, limit = 20 } = req.query;

    // Verify client user exists and belongs to the organization
    const clientUser = await ClientUser.findOne({
      where: { id: clientUserId, organizationId }
    });

    if (!clientUser) {
      return res.status(404).json({
        success: false,
        error: 'CLIENT_USER_NOT_FOUND',
        message: 'Utilizador cliente não encontrado'
      });
    }

    const auditHistory = await catalogAccessService.getUserAuditHistory(clientUserId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      ...auditHistory
    });
  } catch (error) {
    logger.error('Error getting client user catalog access audit:', error);
    next(error);
  }
};

// Export validation function for use in property tests
export { validateCatalogReferences };
