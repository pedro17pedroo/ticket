import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

let io;

/**
 * Inicializar Socket.IO
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.organizationId = decoded.organizationId;
      socket.userRole = decoded.role;
      
      logger.info(`Socket autenticado: User ${decoded.id} (${decoded.role})`);
      next();
    } catch (error) {
      logger.error('Erro de autenticação socket:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Conexão estabelecida
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const organizationId = socket.organizationId;

    logger.info(`Socket conectado: ${socket.id} - User: ${userId}`);

    // Juntar sala da organização
    socket.join(`org_${organizationId}`);
    
    // Juntar sala do usuário
    socket.join(`user_${userId}`);

    // Emitir evento de conexão
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      organizationId
    });

    // Juntar sala específica de ticket
    socket.on('join_ticket', (ticketId) => {
      socket.join(`ticket_${ticketId}`);
      logger.info(`User ${userId} entrou na sala do ticket ${ticketId}`);
    });

    // Sair da sala de ticket
    socket.on('leave_ticket', (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
      logger.info(`User ${userId} saiu da sala do ticket ${ticketId}`);
    });

    // Marcar como digitando
    socket.on('typing', ({ ticketId, isTyping }) => {
      socket.to(`ticket_${ticketId}`).emit('user_typing', {
        userId,
        ticketId,
        isTyping
      });
    });

    // Presença online
    socket.on('update_presence', (status) => {
      socket.to(`org_${organizationId}`).emit('user_presence', {
        userId,
        status,
        timestamp: new Date()
      });
    });

    // Desconexão
    socket.on('disconnect', () => {
      logger.info(`Socket desconectado: ${socket.id} - User: ${userId}`);
      
      // Notificar outros sobre offline
      socket.to(`org_${organizationId}`).emit('user_presence', {
        userId,
        status: 'offline',
        timestamp: new Date()
      });
    });

    // Erro
    socket.on('error', (error) => {
      logger.error(`Erro no socket ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO inicializado com sucesso');
  return io;
};

/**
 * Obter instância do Socket.IO
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO não foi inicializado');
  }
  return io;
};

/**
 * Emitir notificação para usuário específico
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
  logger.debug(`Evento '${event}' emitido para user ${userId}`);
};

/**
 * Emitir evento para organização
 */
export const emitToOrganization = (organizationId, event, data) => {
  if (!io) return;
  io.to(`org_${organizationId}`).emit(event, data);
  logger.debug(`Evento '${event}' emitido para organização ${organizationId}`);
};

/**
 * Emitir evento para ticket específico
 */
export const emitToTicket = (ticketId, event, data) => {
  if (!io) return;
  io.to(`ticket_${ticketId}`).emit(event, data);
  logger.debug(`Evento '${event}' emitido para ticket ${ticketId}`);
};

/**
 * Emitir notificação
 */
export const emitNotification = (userId, notification) => {
  emitToUser(userId, 'notification', notification);
};

/**
 * Emitir atualização de ticket
 */
export const emitTicketUpdate = (ticketId, update) => {
  emitToTicket(ticketId, 'ticket_updated', update);
};

/**
 * Emitir novo comentário
 */
export const emitNewComment = (ticketId, comment) => {
  emitToTicket(ticketId, 'new_comment', comment);
};

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToOrganization,
  emitToTicket,
  emitNotification,
  emitTicketUpdate,
  emitNewComment
};
