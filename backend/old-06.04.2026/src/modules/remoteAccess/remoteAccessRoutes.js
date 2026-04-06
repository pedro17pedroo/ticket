import express from 'express';
import {
  requestRemoteAccess,
  acceptRemoteAccess,
  rejectRemoteAccess,
  startRemoteSession,
  endRemoteSession,
  getPendingRequests,
  getRemoteAccessByTicket,
  sendChatMessage,
  getAuditLog
} from './remoteAccessController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Solicitar acesso remoto (Agente/Admin)
router.post('/request', requestRemoteAccess);

// Aceitar acesso remoto (Cliente)
router.post('/:id/accept', acceptRemoteAccess);

// Rejeitar acesso remoto (Cliente)
router.post('/:id/reject', rejectRemoteAccess);

// Iniciar sessão (Agente)
router.post('/:id/start', startRemoteSession);

// Finalizar sessão
router.post('/:id/end', endRemoteSession);

// Chat durante sessão
router.post('/:id/chat', sendChatMessage);

// Obter histórico/auditoria
router.get('/:id/audit', getAuditLog);

// Obter solicitações pendentes (Cliente)
router.get('/pending', getPendingRequests);

// Obter acesso remoto por ticket
router.get('/ticket/:ticketId', getRemoteAccessByTicket);

export default router;
