/**
 * Catalog Access Audit Service - Audit Trail for Permission Changes
 * 
 * Provides audit logging for catalog access permission changes.
 * Tracks all modifications to client and client user permissions.
 * 
 * Feature: catalog-access-control
 * Requirements: 5.1, 5.2, 5.3
 */

import { CatalogAccessAuditLog } from '../modules/catalogAccess/index.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize';

// Valid entity types
const VALID_ENTITY_TYPES = ['client', 'client_user'];

// Valid actions
const VALID_ACTIONS = ['create', 'update', 'delete'];

class CatalogAccessAuditService {
  /**
   * Log a permission change
   * 
   * @param {Object} params - Log parameters
   * @param {string} params.organizationId - Organization UUID
   * @param {string} params.entityType - Entity type: 'client' or 'client_user'
   * @param {string} params.entityId - Entity UUID (client or client_user ID)
   * @param {string} params.action - Action: 'create', 'update', or 'delete'
   * @param {Object|null} params.previousState - Previous permission state (null for create)
   * @param {Object|null} params.newState - New permission state (null for delete)
   * @param {string} params.changedBy - User UUID who made the change
   * @param {string} [params.changedByName] - Name of user who made the change
   * @param {string} [params.ipAddress] - IP address from which change was made
   * @returns {Promise<Object>} Created audit log entry
   * 
   * Requirements: 5.1, 5.2
   */
  async logChange({
    organizationId,
    entityType,
    entityId,
    action,
    previousState,
    newState,
    changedBy,
    changedByName = null,
    ipAddress = null
  }) {
    // Validate required parameters
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      throw new Error(`Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    }
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    if (!action || !VALID_ACTIONS.includes(action)) {
      throw new Error(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
    }
    if (!changedBy) {
      throw new Error('Changed by user ID is required');
    }

    // Validate state based on action
    if (action === 'create' && previousState !== null) {
      logger.warn('Previous state should be null for create action');
    }
    if (action === 'delete' && newState !== null) {
      logger.warn('New state should be null for delete action');
    }
    if (action === 'update' && (previousState === null || newState === null)) {
      logger.warn('Both previous and new state should be provided for update action');
    }

    try {
      const auditLog = await CatalogAccessAuditLog.create({
        organizationId,
        entityType,
        entityId,
        action,
        previousState,
        newState,
        changedBy,
        changedByName,
        ipAddress
      });

      logger.info(`Audit log created: ${action} ${entityType} ${entityId} by ${changedBy}`);

      return {
        id: auditLog.id,
        organizationId: auditLog.organizationId,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        action: auditLog.action,
        previousState: auditLog.previousState,
        newState: auditLog.newState,
        changedBy: auditLog.changedBy,
        changedByName: auditLog.changedByName,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt
      };
    } catch (error) {
      logger.error(`Error creating audit log for ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get audit history for an entity
   * 
   * @param {string} entityType - Entity type: 'client' or 'client_user'
   * @param {string} entityId - Entity UUID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=50] - Maximum number of records to return
   * @param {number} [options.offset=0] - Number of records to skip
   * @param {Date} [options.startDate] - Filter by start date
   * @param {Date} [options.endDate] - Filter by end date
   * @returns {Promise<Object>} Audit history with pagination info
   * 
   * Requirements: 5.3
   */
  async getAuditHistory(entityType, entityId, options = {}) {
    // Validate parameters
    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      throw new Error(`Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    }
    if (!entityId) {
      throw new Error('Entity ID is required');
    }

    const { limit = 50, offset = 0, startDate, endDate } = options;

    // Build where clause
    const where = {
      entityType,
      entityId
    };

    // Add date filters if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = startDate;
      }
      if (endDate) {
        where.createdAt[Op.lte] = endDate;
      }
    }

    try {
      // Get total count
      const total = await CatalogAccessAuditLog.count({ where });

      // Get audit logs in chronological order (newest first)
      const logs = await CatalogAccessAuditLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        logs: logs.map(log => ({
          id: log.id,
          organizationId: log.organizationId,
          entityType: log.entityType,
          entityId: log.entityId,
          action: log.action,
          previousState: log.previousState,
          newState: log.newState,
          changedBy: log.changedBy,
          changedByName: log.changedByName,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + logs.length < total
        }
      };
    } catch (error) {
      logger.error(`Error getting audit history for ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get audit history for an organization
   * 
   * @param {string} organizationId - Organization UUID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=50] - Maximum number of records to return
   * @param {number} [options.offset=0] - Number of records to skip
   * @param {string} [options.entityType] - Filter by entity type
   * @param {string} [options.action] - Filter by action
   * @param {Date} [options.startDate] - Filter by start date
   * @param {Date} [options.endDate] - Filter by end date
   * @returns {Promise<Object>} Audit history with pagination info
   */
  async getOrganizationAuditHistory(organizationId, options = {}) {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    const { limit = 50, offset = 0, entityType, action, startDate, endDate } = options;

    // Build where clause
    const where = { organizationId };

    if (entityType && VALID_ENTITY_TYPES.includes(entityType)) {
      where.entityType = entityType;
    }

    if (action && VALID_ACTIONS.includes(action)) {
      where.action = action;
    }

    // Add date filters if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = startDate;
      }
      if (endDate) {
        where.createdAt[Op.lte] = endDate;
      }
    }

    try {
      // Get total count
      const total = await CatalogAccessAuditLog.count({ where });

      // Get audit logs in chronological order (newest first)
      const logs = await CatalogAccessAuditLog.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        logs: logs.map(log => ({
          id: log.id,
          organizationId: log.organizationId,
          entityType: log.entityType,
          entityId: log.entityId,
          action: log.action,
          previousState: log.previousState,
          newState: log.newState,
          changedBy: log.changedBy,
          changedByName: log.changedByName,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + logs.length < total
        }
      };
    } catch (error) {
      logger.error(`Error getting organization audit history for ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest audit entry for an entity
   * 
   * @param {string} entityType - Entity type: 'client' or 'client_user'
   * @param {string} entityId - Entity UUID
   * @returns {Promise<Object|null>} Latest audit log entry or null
   */
  async getLatestAuditEntry(entityType, entityId) {
    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      throw new Error(`Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    }
    if (!entityId) {
      throw new Error('Entity ID is required');
    }

    try {
      const log = await CatalogAccessAuditLog.findOne({
        where: { entityType, entityId },
        order: [['createdAt', 'DESC']]
      });

      if (!log) {
        return null;
      }

      return {
        id: log.id,
        organizationId: log.organizationId,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        previousState: log.previousState,
        newState: log.newState,
        changedBy: log.changedBy,
        changedByName: log.changedByName,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt
      };
    } catch (error) {
      logger.error(`Error getting latest audit entry for ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Count audit entries for an entity
   * 
   * @param {string} entityType - Entity type: 'client' or 'client_user'
   * @param {string} entityId - Entity UUID
   * @returns {Promise<number>} Count of audit entries
   */
  async countAuditEntries(entityType, entityId) {
    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      throw new Error(`Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
    }
    if (!entityId) {
      throw new Error('Entity ID is required');
    }

    try {
      return await CatalogAccessAuditLog.count({
        where: { entityType, entityId }
      });
    } catch (error) {
      logger.error(`Error counting audit entries for ${entityType} ${entityId}:`, error);
      throw error;
    }
  }
}

export default new CatalogAccessAuditService();
