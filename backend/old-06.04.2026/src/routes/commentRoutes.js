import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import * as commentController from '../modules/comments/commentController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/tickets/:ticketId/comments - Listar comentários de um ticket
router.get(
  '/:ticketId/comments',
  requirePermission('comments', 'read'),
  commentController.getTicketComments
);

// POST /api/tickets/:ticketId/comments - Criar comentário
router.post(
  '/:ticketId/comments',
  requirePermission('comments', 'create'),
  commentController.createComment
);

// PUT /api/tickets/:ticketId/comments/:commentId - Atualizar comentário
router.put(
  '/:ticketId/comments/:commentId',
  requirePermission('comments', 'update'),
  commentController.updateComment
);

// DELETE /api/tickets/:ticketId/comments/:commentId - Eliminar comentário
router.delete(
  '/:ticketId/comments/:commentId',
  requirePermission('comments', 'delete'),
  commentController.deleteComment
);

export default router;
