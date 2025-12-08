import { Router } from 'express';
import collaborationController from './collaborationController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== TICKET RELATIONSHIPS =====

// Buscar relações de um ticket
router.get('/tickets/:ticketId/relationships',
  authMiddleware,
  collaborationController.getTicketRelationships.bind(collaborationController)
);

// Criar relação entre tickets
router.post('/tickets/relationships',
  authMiddleware,
  collaborationController.createTicketRelationship.bind(collaborationController)
);

// Remover relação
router.delete('/tickets/relationships/:id',
  authMiddleware,
  collaborationController.deleteTicketRelationship.bind(collaborationController)
);

// ===== TEAM WORKSPACES =====

// Listar workspaces
router.get('/workspaces',
  authMiddleware,
  collaborationController.getTeamWorkspaces.bind(collaborationController)
);

// Buscar workspace por ID
router.get('/workspaces/:id',
  authMiddleware,
  collaborationController.getTeamWorkspaceById.bind(collaborationController)
);

// Criar workspace
router.post('/workspaces',
  authMiddleware,
  requireRole(['admin', 'org-admin', 'tecnico']),
  collaborationController.createTeamWorkspace.bind(collaborationController)
);

// Atualizar workspace
router.put('/workspaces/:id',
  authMiddleware,
  collaborationController.updateTeamWorkspace.bind(collaborationController)
);

// Adicionar membro
router.post('/workspaces/:id/members',
  authMiddleware,
  collaborationController.addWorkspaceMember.bind(collaborationController)
);

// Remover membro
router.delete('/workspaces/:id/members/:userId',
  authMiddleware,
  collaborationController.removeWorkspaceMember.bind(collaborationController)
);

// ===== SHARED VIEWS =====

// Listar views compartilhadas
router.get('/views',
  authMiddleware,
  collaborationController.getSharedViews.bind(collaborationController)
);

// Criar view
router.post('/views',
  authMiddleware,
  collaborationController.createSharedView.bind(collaborationController)
);

// Atualizar view
router.put('/views/:id',
  authMiddleware,
  collaborationController.updateSharedView.bind(collaborationController)
);

// ===== MENTIONS =====

// Minhas mentions
router.get('/mentions',
  authMiddleware,
  collaborationController.getMyMentions.bind(collaborationController)
);

// Marcar mention como lida
router.patch('/mentions/:id/read',
  authMiddleware,
  collaborationController.markMentionAsRead.bind(collaborationController)
);

export default router;
