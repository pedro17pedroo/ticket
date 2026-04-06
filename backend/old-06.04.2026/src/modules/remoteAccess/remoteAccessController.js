import { RemoteAccess, Ticket, User, Asset } from '../models/index.js';
import { sequelize } from '../../config/database.js';
import crypto from 'crypto';
import logger from '../../config/logger.js';

// Solicitar acesso remoto
export const requestRemoteAccess = async (req, res, next) => {
  try {
    const { ticketId, assetId } = req.body;
    logger.info('🔍 Solicitação de acesso remoto', { ticketId, assetId, userId: req.user.id });

    // Verificar ticket
    const ticket = await Ticket.findOne({
      where: { 
        id: ticketId, 
        organizationId: req.user.organizationId 
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    if (!ticket) {
      logger.warn('❌ Ticket não encontrado', { ticketId });
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    logger.info('✅ Ticket encontrado', { 
      ticketId, 
      requesterId: ticket.requesterId, 
      requesterRole: ticket.requester?.role 
    });

    // Verificar se o requester é cliente
    if (!ticket.requester || ticket.requester.role !== 'cliente-org') {
      logger.warn('❌ Requester não é cliente', { 
        requesterId: ticket.requesterId, 
        requesterRole: ticket.requester?.role 
      });
      return res.status(400).json({ 
        error: 'O solicitante do ticket não é um cliente',
        requesterRole: ticket.requester?.role
      });
    }

    // Verificar se já existe solicitação pendente
    const existingRequest = await RemoteAccess.findOne({
      where: {
        ticketId,
        status: ['pending', 'accepted', 'active']
      }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'Já existe uma solicitação de acesso ativa para este ticket',
        existingRequest
      });
    }

    // Criar token único
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Definir expiração (30 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Capturar IP do solicitante
    const requesterIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Criar solicitação
    const remoteAccess = await RemoteAccess.create({
      organizationId: req.user.organizationId,
      ticketId,
      requesterId: req.user.id,
      clientId: ticket.requesterId,
      assetId: assetId || null,
      status: 'pending',
      accessToken,
      requestedAt: new Date(),
      expiresAt,
      requesterIp,
      auditLog: [{
        action: 'requested',
        userId: req.user.id,
        userName: req.user.name,
        timestamp: new Date(),
        ip: requesterIp
      }]
    });

    // Carregar com relações
    const fullRemoteAccess = await RemoteAccess.findByPk(remoteAccess.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: Ticket, as: 'ticket', attributes: ['id', 'ticketNumber', 'subject'] },
        { model: Asset, as: 'asset', attributes: ['id', 'hostname', 'type'] }
      ]
    });

    logger.info(`Acesso remoto solicitado para ticket ${ticket.ticketNumber} por ${req.user.email}`);

    // Emitir evento WebSocket para o cliente
    const io = req.app.get('io');
    io.to(`user-${ticket.requesterId}`).emit('remote-access-requested', fullRemoteAccess);

    res.json({
      success: true,
      remoteAccess: fullRemoteAccess
    });
  } catch (error) {
    next(error);
  }
};

// Aceitar acesso remoto (Cliente no Agent)
export const acceptRemoteAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    const remoteAccess = await RemoteAccess.findOne({
      where: { 
        id,
        clientId: req.user.id,
        status: 'pending'
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: Ticket, as: 'ticket', attributes: ['id', 'ticketNumber'] }
      ]
    });

    if (!remoteAccess) {
      return res.status(404).json({ error: 'Solicitação não encontrada ou já respondida' });
    }

    // Verificar se expirou
    if (remoteAccess.expiresAt && new Date() > remoteAccess.expiresAt) {
      await remoteAccess.update({ status: 'rejected', rejectionReason: 'Expirado' });
      return res.status(400).json({ error: 'Solicitação expirada' });
    }

    // Capturar IP do cliente
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Atualizar auditLog
    const auditLog = remoteAccess.auditLog || [];
    auditLog.push({
      action: 'accepted',
      userId: req.user.id,
      userName: req.user.name,
      timestamp: new Date(),
      ip: clientIp
    });

    // Atualizar status
    await remoteAccess.update({
      status: 'accepted',
      respondedAt: new Date(),
      clientIp,
      auditLog
    });

    logger.info(`Acesso remoto aceito: ${id} pelo cliente ${req.user.email}`);

    // Notificar agente via WebSocket
    const io = req.app.get('io');
    io.to(`user-${remoteAccess.requesterId}`).emit('remote-access-accepted', {
      id: remoteAccess.id,
      accessToken: remoteAccess.accessToken,
      ticketNumber: remoteAccess.ticket.ticketNumber
    });

    res.json({
      success: true,
      remoteAccess
    });
  } catch (error) {
    next(error);
  }
};

// Rejeitar acesso remoto (Cliente no Agent)
export const rejectRemoteAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const remoteAccess = await RemoteAccess.findOne({
      where: { 
        id,
        clientId: req.user.id,
        status: 'pending'
      }
    });

    if (!remoteAccess) {
      return res.status(404).json({ error: 'Solicitação não encontrada ou já respondida' });
    }

    // Capturar IP
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Atualizar auditLog
    const auditLog = remoteAccess.auditLog || [];
    auditLog.push({
      action: 'rejected',
      userId: req.user.id,
      userName: req.user.name,
      timestamp: new Date(),
      ip: clientIp,
      reason: reason || 'Recusado pelo cliente'
    });

    // Atualizar status
    await remoteAccess.update({
      status: 'rejected',
      respondedAt: new Date(),
      rejectionReason: reason || 'Recusado pelo cliente',
      clientIp,
      auditLog
    });

    logger.info(`Acesso remoto rejeitado: ${id} pelo cliente ${req.user.email}`);

    // Notificar agente
    const io = req.app.get('io');
    io.to(`user-${remoteAccess.requesterId}`).emit('remote-access-rejected', {
      id: remoteAccess.id,
      reason: reason || 'Recusado pelo cliente'
    });

    res.json({
      success: true,
      message: 'Acesso remoto rejeitado'
    });
  } catch (error) {
    next(error);
  }
};

// Iniciar sessão de acesso (quando agente conecta)
export const startRemoteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const remoteAccess = await RemoteAccess.findOne({
      where: { 
        id,
        requesterId: req.user.id,
        status: 'accepted'
      }
    });

    if (!remoteAccess) {
      return res.status(404).json({ error: 'Acesso não encontrado ou não aceito' });
    }

    await remoteAccess.update({
      status: 'active',
      startedAt: new Date()
    });

    logger.info(`Sessão de acesso remoto iniciada: ${id}`);

    res.json({
      success: true,
      accessToken: remoteAccess.accessToken
    });
  } catch (error) {
    next(error);
  }
};

// Finalizar sessão de acesso
export const endRemoteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const remoteAccess = await RemoteAccess.findOne({
      where: { id, status: 'active' }
    });

    if (!remoteAccess) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    await remoteAccess.update({
      status: 'ended',
      endedAt: new Date()
    });

    logger.info(`Sessão de acesso remoto finalizada: ${id}`);

    // Notificar ambas as partes
    const io = req.app.get('io');
    io.to(`user-${remoteAccess.clientId}`).emit('remote-access-ended', { id });
    io.to(`user-${remoteAccess.requesterId}`).emit('remote-access-ended', { id });

    res.json({
      success: true,
      message: 'Sessão finalizada'
    });
  } catch (error) {
    next(error);
  }
};

// Obter solicitações pendentes (para o cliente no Agent)
export const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await RemoteAccess.findAll({
      where: {
        clientId: req.user.id,
        status: 'pending'
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: Ticket, as: 'ticket', attributes: ['id', 'ticketNumber', 'subject'] },
        { model: Asset, as: 'asset', attributes: ['id', 'hostname', 'type'] }
      ],
      order: [['requestedAt', 'DESC']]
    });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// Adicionar mensagem ao chat
export const sendChatMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const remoteAccess = await RemoteAccess.findOne({
      where: {
        id,
        status: ['accepted', 'active']
      }
    });

    if (!remoteAccess) {
      return res.status(404).json({ error: 'Sessão não encontrada ou não está ativa' });
    }

    // Verificar permissão (apenas requester ou cliente)
    if (req.user.id !== remoteAccess.requesterId && req.user.id !== remoteAccess.clientId) {
      return res.status(403).json({ error: 'Sem permissão para participar deste chat' });
    }

    // Adicionar mensagem
    const chatMessages = remoteAccess.chatMessages || [];
    const newMessage = {
      id: crypto.randomBytes(16).toString('hex'),
      userId: req.user.id,
      userName: req.user.name,
      message,
      timestamp: new Date()
    };
    chatMessages.push(newMessage);

    await remoteAccess.update({ chatMessages });

    // Emitir via WebSocket
    const io = req.app.get('io');
    const targetUserId = req.user.id === remoteAccess.requesterId ? 
      remoteAccess.clientId : remoteAccess.requesterId;
    
    io.to(`user-${targetUserId}`).emit('remote-access:chat-message', {
      sessionId: id,
      message: newMessage
    });

    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    next(error);
  }
};

// Obter histórico de auditoria
export const getAuditLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const remoteAccess = await RemoteAccess.findByPk(id, {
      attributes: ['id', 'auditLog', 'chatMessages', 'status', 'createdAt', 'durationSeconds'],
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: Ticket, as: 'ticket', attributes: ['id', 'ticketNumber', 'subject'] }
      ]
    });

    if (!remoteAccess) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // Verificar permissão
    if (req.user.organizationId !== remoteAccess.organizationId) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    res.json({
      success: true,
      session: remoteAccess
    });
  } catch (error) {
    next(error);
  }
};

// Obter acesso remoto por ticket
export const getRemoteAccessByTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const remoteAccesses = await RemoteAccess.findAll({
      where: {
        ticketId,
        organizationId: req.user.organizationId
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: Asset, as: 'asset', attributes: ['id', 'hostname', 'type'] }
      ],
      order: [['requestedAt', 'DESC']]
    });

    res.json({
      success: true,
      remoteAccesses
    });
  } catch (error) {
    next(error);
  }
};
