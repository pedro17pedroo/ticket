import { Router } from 'express';
import securityController from './securityController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// Audit Logs
router.get('/audit-logs',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  securityController.getAuditLogs.bind(securityController)
);

router.get('/audit-logs/export',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  securityController.exportAuditLogs.bind(securityController)
);

// Analytics
router.get('/analytics',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  securityController.getSecurityAnalytics.bind(securityController)
);

// IP Whitelist
router.get('/whitelist',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  securityController.getWhitelist.bind(securityController)
);

router.post('/whitelist',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  securityController.addToWhitelist.bind(securityController)
);

router.delete('/whitelist/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  securityController.removeFromWhitelist.bind(securityController)
);

export default router;
