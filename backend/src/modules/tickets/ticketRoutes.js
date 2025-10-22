import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addComment,
  getStatistics
} from './ticketController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate, schemas } from '../../middleware/validate.js';
import { auditLog } from '../../middleware/audit.js';
import { uploadMultiple } from '../../middleware/upload.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Estatísticas
router.get('/statistics', getStatistics);

// CRUD Tickets
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post(
  '/', 
  validate(schemas.createTicket), 
  auditLog('ticket_created', 'ticket'), 
  createTicket
);
router.put(
  '/:id',
  authorize('admin-org', 'agente'),
  validate(schemas.updateTicket),
  auditLog('ticket_updated', 'ticket'),
  updateTicket
);

// Comentários
router.post(
  '/:id/comments',
  validate(schemas.createComment),
  auditLog('create', 'comment'),
  addComment
);

// Upload de anexos
router.post('/:id/attachments', uploadMultiple('files', 5), async (req, res, next) => {
  try {
    const files = req.files?.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: file.path
    }));

    res.json({
      message: 'Arquivos enviados com sucesso',
      files
    });
  } catch (error) {
    next(error);
  }
});

export default router;
