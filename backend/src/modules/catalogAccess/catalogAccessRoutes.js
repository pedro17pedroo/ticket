/**
 * Catalog Access Routes - API Routes for Catalog Access Control
 * 
 * Defines REST API routes for managing catalog access permissions.
 * 
 * Feature: catalog-access-control
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireSmartPermission } from '../../middleware/smartPermission.js';
import { auditLog } from '../../middleware/audit.js';
import * as catalogAccessController from './catalogAccessController.js';

const router = express.Router();

// ==================== CLIENT CATALOG ACCESS ====================

/**
 * GET /api/catalog-access/clients/:id
 * Get catalog access rules for a client
 * Requirements: 7.1
 */
router.get(
  '/clients/:id',
  authenticate,
  requireSmartPermission('clients', 'read'),
  catalogAccessController.getClientCatalogAccess
);

/**
 * PUT /api/catalog-access/clients/:id
 * Update catalog access rules for a client
 * Requirements: 7.2, 7.6
 */
router.put(
  '/clients/:id',
  authenticate,
  authorize('org-admin', 'tenant-admin', 'super-admin', 'provider-admin'),
  auditLog('update', 'client_catalog_access'),
  catalogAccessController.updateClientCatalogAccess
);

/**
 * GET /api/catalog-access/clients/:id/audit
 * Get audit history for client catalog access
 * Requirements: 5.3
 */
router.get(
  '/clients/:id/audit',
  authenticate,
  requireSmartPermission('clients', 'read'),
  catalogAccessController.getClientCatalogAccessAudit
);

// ==================== CLIENT USER CATALOG ACCESS ====================

/**
 * GET /api/catalog-access/client-users/:id
 * Get catalog access rules for a client user
 * Requirements: 7.3
 */
router.get(
  '/client-users/:id',
  authenticate,
  requireSmartPermission('client_users', 'read'),
  catalogAccessController.getClientUserCatalogAccess
);

/**
 * PUT /api/catalog-access/client-users/:id
 * Update catalog access rules for a client user
 * Requirements: 7.4, 7.6
 */
router.put(
  '/client-users/:id',
  authenticate,
  authorize('org-admin', 'tenant-admin', 'super-admin', 'provider-admin'),
  auditLog('update', 'client_user_catalog_access'),
  catalogAccessController.updateClientUserCatalogAccess
);

/**
 * GET /api/catalog-access/client-users/:id/audit
 * Get audit history for client user catalog access
 * Requirements: 5.3
 */
router.get(
  '/client-users/:id/audit',
  authenticate,
  requireSmartPermission('client_users', 'read'),
  catalogAccessController.getClientUserCatalogAccessAudit
);

// ==================== EFFECTIVE ACCESS ====================

/**
 * GET /api/catalog-access/effective
 * Get current user's effective catalog permissions
 * Requirements: 7.5
 */
router.get(
  '/effective',
  authenticate,
  catalogAccessController.getEffectiveAccess
);

export default router;
