import { Router } from 'express';
import biController from './biController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== DASHBOARDS =====

router.get('/dashboards',
  authMiddleware,
  biController.getDashboards.bind(biController)
);

router.get('/dashboards/:id',
  authMiddleware,
  biController.getDashboardById.bind(biController)
);

router.post('/dashboards',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  biController.createDashboard.bind(biController)
);

router.put('/dashboards/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  biController.updateDashboard.bind(biController)
);

router.delete('/dashboards/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  biController.deleteDashboard.bind(biController)
);

router.post('/dashboards/:id/duplicate',
  authMiddleware,
  biController.duplicateDashboard.bind(biController)
);

// ===== REPORTS =====

router.get('/reports',
  authMiddleware,
  biController.getReports.bind(biController)
);

router.post('/reports',
  authMiddleware,
  requireRole(['admin', 'org-admin', 'tecnico']),
  biController.createReport.bind(biController)
);

router.post('/reports/:id/execute',
  authMiddleware,
  biController.executeReport.bind(biController)
);

router.get('/reports/:id/export',
  authMiddleware,
  biController.exportReport.bind(biController)
);

// ===== KPIs =====

router.get('/kpis',
  authMiddleware,
  biController.getKPIs.bind(biController)
);

router.post('/kpis',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  biController.createKPI.bind(biController)
);

router.post('/kpis/:id/calculate',
  authMiddleware,
  biController.calculateKPI.bind(biController)
);

router.post('/kpis/calculate-all',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  biController.calculateAllKPIs.bind(biController)
);

// ===== METRICS =====

router.get('/metrics',
  authMiddleware,
  biController.getMetrics.bind(biController)
);

router.get('/metrics/forecast',
  authMiddleware,
  biController.getForecast.bind(biController)
);

router.get('/metrics/compare',
  authMiddleware,
  biController.comparePeriodsMetrics.bind(biController)
);

// ===== EXPORT =====

router.get('/export',
  authMiddleware,
  requireRole(['admin', 'org-admin', 'tecnico']),
  biController.exportData.bind(biController)
);

// ===== ANALYTICS =====

router.get('/analytics',
  authMiddleware,
  biController.getAnalytics.bind(biController)
);

export default router;
