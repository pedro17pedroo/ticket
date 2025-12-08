import { Router } from 'express';
import webhookController from './webhookController.js';
import integrationController from './integrationController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== WEBHOOKS =====

// Listar webhooks
router.get('/webhooks',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  webhookController.getAll.bind(webhookController)
);

// Buscar webhook por ID
router.get('/webhooks/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  webhookController.getById.bind(webhookController)
);

// Criar webhook
router.post('/webhooks',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  webhookController.create.bind(webhookController)
);

// Atualizar webhook
router.put('/webhooks/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  webhookController.update.bind(webhookController)
);

// Deletar webhook
router.delete('/webhooks/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  webhookController.delete.bind(webhookController)
);

// Testar webhook
router.post('/webhooks/:id/test',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  webhookController.test.bind(webhookController)
);

// Logs do webhook
router.get('/webhooks/:id/logs',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  webhookController.getLogs.bind(webhookController)
);

// Stats do webhook
router.get('/webhooks/:id/stats',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  webhookController.getStats.bind(webhookController)
);

// Eventos disponíveis
router.get('/webhooks/events/available',
  authMiddleware,
  webhookController.getAvailableEvents.bind(webhookController)
);

// ===== INTEGRATIONS =====

// Listar integrações disponíveis
router.get('/available',
  authMiddleware,
  integrationController.getAvailable.bind(integrationController)
);

// Listar integrações
router.get('/',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  integrationController.getAll.bind(integrationController)
);

// Buscar integração por ID
router.get('/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  integrationController.getById.bind(integrationController)
);

// Criar integração
router.post('/',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  integrationController.create.bind(integrationController)
);

// Atualizar integração
router.put('/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  integrationController.update.bind(integrationController)
);

// Deletar integração
router.delete('/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  integrationController.delete.bind(integrationController)
);

// Testar integração
router.post('/:id/test',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  integrationController.test.bind(integrationController)
);

// Sincronizar integração
router.post('/:id/sync',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  integrationController.sync.bind(integrationController)
);

export default router;
