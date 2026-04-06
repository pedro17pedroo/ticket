import { Router } from 'express';
import securityController from './securityController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// Audit Logs
router.get('/audit-logs',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  securityController.getAuditLogs.bind(securityController)
);

router.get('/audit-logs/export',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  securityController.exportAuditLogs.bind(securityController)
);

// Analytics
router.get('/analytics',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  securityController.getSecurityAnalytics.bind(securityController)
);

// IP Whitelist
router.get('/whitelist',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  securityController.getWhitelist.bind(securityController)
);

router.post('/whitelist',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  securityController.addToWhitelist.bind(securityController)
);

router.delete('/whitelist/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  securityController.removeFromWhitelist.bind(securityController)
);

export default router;
