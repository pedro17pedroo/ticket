import { Router } from 'express';
import statusPageController from './statusPageController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== ROTAS PÚBLICAS (sem autenticação) =====

// Status geral público
router.get('/public/:organizationId', 
  statusPageController.getPublicStatus.bind(statusPageController)
);

// Histórico de um serviço específico
router.get('/public/:organizationId/service/:serviceId/history', 
  statusPageController.getServiceHistory.bind(statusPageController)
);

// Inscrição para notificações
router.post('/public/:organizationId/subscribe', 
  statusPageController.subscribe.bind(statusPageController)
);

// Cancelar inscrição
router.get('/unsubscribe/:token', 
  statusPageController.unsubscribe.bind(statusPageController)
);

// ===== ROTAS ADMINISTRATIVAS (requer autenticação) =====

// Gerenciamento de Serviços
router.post('/services',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  statusPageController.createService.bind(statusPageController)
);

router.put('/services/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  statusPageController.updateService.bind(statusPageController)
);

// Gerenciamento de Incidentes
router.post('/incidents',
  authMiddleware,
  requireRole(['admin', 'org-admin', 'tecnico']),
  statusPageController.createIncident.bind(statusPageController)
);

router.put('/incidents/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin', 'tecnico']),
  statusPageController.updateIncident.bind(statusPageController)
);

// Gerenciamento de Manutenções
router.post('/maintenances',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  statusPageController.createMaintenance.bind(statusPageController)
);

router.put('/maintenances/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  statusPageController.updateMaintenance.bind(statusPageController)
);

export default router;
