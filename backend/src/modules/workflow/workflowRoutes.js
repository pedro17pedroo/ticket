import { Router } from 'express';
import workflowController from './workflowController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== WORKFLOW MANAGEMENT =====

// Listar workflows
router.get('/workflows',
  authMiddleware,
  workflowController.getWorkflows.bind(workflowController)
);

// Buscar workflow por ID
router.get('/workflows/:id',
  authMiddleware,
  workflowController.getWorkflowById.bind(workflowController)
);

// Criar workflow
router.post('/workflows',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.createWorkflow.bind(workflowController)
);

// Atualizar workflow
router.put('/workflows/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.updateWorkflow.bind(workflowController)
);

// Deletar workflow
router.delete('/workflows/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.deleteWorkflow.bind(workflowController)
);

// Alternar ativação do workflow
router.patch('/workflows/:id/toggle',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.toggleWorkflow.bind(workflowController)
);

// Duplicar workflow
router.post('/workflows/:id/duplicate',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.duplicateWorkflow.bind(workflowController)
);

// ===== WORKFLOW EXECUTION =====

// Executar workflow manualmente
router.post('/workflows/execute',
  authMiddleware,
  requireRole(['admin', 'admin-org', 'tecnico']),
  workflowController.executeWorkflow.bind(workflowController)
);

// Testar workflow
router.post('/workflows/:id/test',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.testWorkflow.bind(workflowController)
);

// Listar execuções
router.get('/executions',
  authMiddleware,
  workflowController.getExecutions.bind(workflowController)
);

// Buscar execução por ID
router.get('/executions/:id',
  authMiddleware,
  workflowController.getExecutionById.bind(workflowController)
);

// Cancelar execução
router.patch('/executions/:id/cancel',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.cancelExecution.bind(workflowController)
);

// Reiniciar execução falha
router.post('/executions/:id/retry',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.retryExecution.bind(workflowController)
);

// ===== STATISTICS =====

// Obter estatísticas
router.get('/statistics',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  workflowController.getStatistics.bind(workflowController)
);

export default router;
