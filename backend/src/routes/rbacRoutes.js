import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import * as rbacController from '../modules/rbac/rbacController.js';

const router = express.Router();

// ==================== ROLES ====================
router.get('/roles', 
  authenticate, 
  requirePermission('settings', 'manage_roles'), 
  rbacController.getRoles
);

router.get('/roles/:id', 
  authenticate, 
  requirePermission('settings', 'manage_roles'), 
  rbacController.getRoleById
);

router.post('/roles', 
  authenticate, 
  requirePermission('settings', 'manage_roles'), 
  rbacController.createRole
);

router.put('/roles/:id', 
  authenticate, 
  requirePermission('settings', 'manage_roles'), 
  rbacController.updateRole
);

router.delete('/roles/:id', 
  authenticate, 
  requirePermission('settings', 'manage_roles'), 
  rbacController.deleteRole
);

// ==================== PERMISSIONS ====================
router.get('/permissions', 
  authenticate, 
  requirePermission('settings', 'manage_roles'), 
  rbacController.getPermissions
);

// ==================== USER PERMISSIONS ====================
router.get('/users/:userId/permissions', 
  authenticate, 
  rbacController.getUserPermissions
);

router.post('/users/:userId/permissions', 
  authenticate, 
  requirePermission('settings', 'manage_roles'), 
  rbacController.grantUserPermission
);

router.delete('/users/:userId/permissions/:permissionId', 
  authenticate, 
  requirePermission('settings', 'manage_roles'), 
  rbacController.revokeUserPermission
);

// ==================== STATISTICS ====================
router.get('/statistics', 
  authenticate, 
  requirePermission('settings', 'view'), 
  rbacController.getStatistics
);

export default router;
