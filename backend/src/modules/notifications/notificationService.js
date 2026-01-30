import { Op } from 'sequelize';
import Notification from './notificationModel.js';
import { OrganizationUser, ClientUser } from '../models/index.js';
import logger from '../../config/logger.js';
import { sendEmail } from '../../config/email.js';
import { emitNotification } from '../../socket/index.js';

/**
 * Criar notificação
 */
export const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    logger.info(`Notificação criada: ${notification.type} para ${notificationData.recipientType} ${notificationData.recipientId}`);
    
    // Enviar e-mail se necessário
    if (notificationData.sendEmail !== false) {
      await sendNotificationEmail(notification);
    }
    
    // Emitir via WebSocket em tempo real
    emitNotification(notificationData.recipientId, {
      ...notification.toJSON(),
      recipientType: notificationData.recipientType
    });
    
    return notification;
  } catch (error) {
    logger.error('Erro ao criar notificação:', error);
    throw error;
  }
};

/**
 * Criar notificações em massa
 */
export const createBulkNotifications = async (notifications) => {
  try {
    const created = await Notification.bulkCreate(notifications);
    logger.info(`${created.length} notificações criadas em massa`);
    
    // Enviar e-mails em background
    created.forEach(notification => {
      sendNotificationEmail(notification).catch(err => 
        logger.error('Erro ao enviar e-mail de notificação:', err)
      );
    });
    
    // Emitir cada notificação via WebSocket
    created.forEach(notification => {
      const originalData = notifications.find(n => n.recipientId === notification.recipientId && n.recipientType === notification.recipientType);
      emitNotification(notification.recipientId, {
        ...notification.toJSON(),
        recipientType: originalData?.recipientType || 'client'
      });
    });
    
    return created;
  } catch (error) {
    logger.error('Erro ao criar notificações em massa:', error);
    throw error;
  }
};

/**
 * Buscar notificações do usuário
 */
export const getUserNotifications = async (recipientId, recipientType, options = {}) => {
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  try {
    const where = { recipientId, recipientType };
    if (unreadOnly) {
      where.isRead = false;
    }

    logger.info(`🔍 [getUserNotifications] Buscando notificações:`, {
      recipientId,
      recipientType,
      where,
      limit,
      offset
    });

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const unreadCount = await Notification.count({
      where: { recipientId, recipientType, isRead: false }
    });

    const total = await Notification.count({ where: { recipientId, recipientType } });

    logger.info(`📊 [getUserNotifications] Resultado:`, {
      found: notifications.length,
      unreadCount,
      total
    });

    return {
      notifications,
      unreadCount,
      total
    };
  } catch (error) {
    logger.error('Erro ao buscar notificações:', error);
    throw error;
  }
};

/**
 * Marcar notificação como lida
 */
export const markAsRead = async (notificationId, recipientId, recipientType) => {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, recipientId, recipientType }
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    return notification;
  } catch (error) {
    logger.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
};

/**
 * Marcar todas como lidas
 */
export const markAllAsRead = async (recipientId, recipientType) => {
  try {
    const updated = await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: { recipientId, recipientType, isRead: false }
      }
    );

    logger.info(`${updated[0]} notificações marcadas como lidas para ${recipientType} ${recipientId}`);
    return updated[0];
  } catch (error) {
    logger.error('Erro ao marcar todas como lidas:', error);
    throw error;
  }
};

/**
 * Deletar notificação
 */
export const deleteNotification = async (notificationId, recipientId, recipientType) => {
  try {
    const deleted = await Notification.destroy({
      where: { id: notificationId, recipientId, recipientType }
    });

    return deleted > 0;
  } catch (error) {
    logger.error('Erro ao deletar notificação:', error);
    throw error;
  }
};

/**
 * Limpar notificações antigas
 */
export const cleanOldNotifications = async (daysOld = 30) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);

    const deleted = await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: date
        },
        isRead: true
      }
    });

    logger.info(`${deleted} notificações antigas deletadas`);
    return deleted;
  } catch (error) {
    logger.error('Erro ao limpar notificações antigas:', error);
    throw error;
  }
};

/**
 * Enviar e-mail de notificação
 */
const sendNotificationEmail = async (notification) => {
  try {
    // Buscar dados do destinatário
    let recipient;
    if (notification.recipientType === 'organization') {
      recipient = await OrganizationUser.findByPk(notification.recipientId);
    } else {
      recipient = await ClientUser.findByPk(notification.recipientId);
    }

    if (!recipient || !recipient.email) {
      logger.warn(`Destinatário não encontrado ou sem e-mail: ${notification.recipientId}`);
      return;
    }

    // Criar HTML do email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .priority-high { border-left: 4px solid #ef4444; padding-left: 12px; }
          .priority-normal { border-left: 4px solid #3b82f6; padding-left: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">T-Desk</h2>
          </div>
          <div class="content">
            <p>Olá <strong>${recipient.name}</strong>,</p>
            <div class="priority-${notification.priority === 'high' ? 'high' : 'normal'}">
              <h3>${notification.title}</h3>
              <p>${notification.message}</p>
            </div>
            ${notification.link ? `<a href="${process.env.CLIENT_PORTAL_URL || 'http://localhost:5174'}${notification.link}" class="button">Ver Detalhes</a>` : ''}
          </div>
          <div class="footer">
            <p>Esta é uma notificação automática do T-Desk. Por favor, não responda a este email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `${notification.title}\n\n${notification.message}\n\n${notification.link ? `Ver detalhes: ${process.env.CLIENT_PORTAL_URL || 'http://localhost:5174'}${notification.link}` : ''}`;

    // Enviar email
    const result = await sendEmail({
      to: recipient.email,
      subject: notification.title,
      html,
      text
    });

    if (result.success) {
      // Marcar como enviado
      await notification.update({
        emailSent: true,
        emailSentAt: new Date()
      });

      logger.info(`✅ E-mail de notificação enviado para ${recipient.email} - ${notification.title}`);
    } else {
      logger.error(`❌ Falha ao enviar e-mail para ${recipient.email}: ${result.error}`);
      
      // Registrar erro
      await notification.update({
        emailError: result.error || 'Erro desconhecido'
      });
    }
  } catch (error) {
    logger.error('Erro ao enviar e-mail de notificação:', error);
    
    // Registrar erro
    try {
      await notification.update({
        emailError: error.message
      });
    } catch (err) {
      logger.error('Erro ao registrar falha de e-mail:', err);
    }
  }
};

// ==================== HELPERS PARA EVENTOS DE TICKETS ====================

/**
 * Notificar quando um ticket é criado
 */
export const notifyTicketCreated = async (ticket, creatorId, creatorType) => {
  try {
    const notifications = [];

    // 1. Notificar o CLIENTE que criou o ticket (confirmação de criação)
    if (creatorType === 'client' && creatorId) {
      notifications.push({
        recipientId: creatorId,
        recipientType: 'client',
        organizationId: ticket.organizationId,
        type: 'ticket_created',
        title: 'Ticket Criado com Sucesso',
        message: `Seu ticket #${ticket.ticketNumber} foi criado: ${ticket.subject}`,
        ticketId: ticket.id,
        link: `/tickets/${ticket.id}`,
        priority: 'normal',
        data: {
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status
        },
        actorId: creatorId,
        actorType: creatorType,
        actorName: ticket.requesterName || 'Você'
      });
    }

    // 2. Notificar organização (admins e managers)
    const orgUsers = await OrganizationUser.findAll({
      where: {
        organizationId: ticket.organizationId,
        role: {
          [Op.in]: ['org-admin', 'org-manager']
        }
      }
    });

    orgUsers
      .filter(user => user.id !== creatorId)
      .forEach(user => {
        notifications.push({
          recipientId: user.id,
          recipientType: 'organization',
          organizationId: ticket.organizationId,
          type: 'ticket_created',
          title: 'Novo Ticket Criado',
          message: `Ticket #${ticket.ticketNumber}: ${ticket.subject}`,
          ticketId: ticket.id,
          link: `/tickets/${ticket.id}`,
          priority: ticket.priority === 'crítica' || ticket.priority === 'alta' ? 'high' : 'normal',
          data: {
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            priority: ticket.priority,
            status: ticket.status
          },
          actorId: creatorId,
          actorType: creatorType,
          actorName: ticket.requesterName || 'Sistema'
        });
      });

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
      logger.info(`✅ ${notifications.length} notificações enviadas para criação do ticket ${ticket.ticketNumber}`);
    }
  } catch (error) {
    logger.error('Erro ao notificar criação de ticket:', error);
  }
};

/**
 * Notificar quando um ticket é atribuído
 */
export const notifyTicketAssigned = async (ticket, assigneeId, assignedById, assignedByName) => {
  if (!assigneeId || assigneeId === assignedById) return;

  try {
    await createNotification({
      recipientId: assigneeId,
      recipientType: 'organization',
      organizationId: ticket.organizationId,
      type: 'ticket_assigned',
      title: 'Ticket Atribuído a Você',
      message: `Ticket #${ticket.ticketNumber} foi atribuído a você`,
      ticketId: ticket.id,
      link: `/tickets/${ticket.id}`,
      priority: 'high',
      data: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        priority: ticket.priority
      },
      actorId: assignedById,
      actorType: 'organization',
      actorName: assignedByName
    });
  } catch (error) {
    logger.error('Erro ao notificar atribuição de ticket:', error);
  }
};

/**
 * Notificar mudança de status
 */
export const notifyStatusChange = async (ticket, oldStatus, newStatus, changedById, changedByName) => {
  try {
    const recipients = [];

    // Notificar responsável
    if (ticket.assigneeId && ticket.assigneeId !== changedById) {
      recipients.push({
        recipientId: ticket.assigneeId,
        recipientType: 'organization'
      });
    }

    // Notificar cliente - Detectar tipo automaticamente
    if (ticket.requesterId && ticket.requesterId !== changedById) {
      // Tentar detectar tipo do requester
      let recipientType = 'client'; // padrão
      
      if (ticket.requesterClientUserId) {
        recipientType = 'client';
      } else if (ticket.requesterOrgUserId || ticket.requesterType === 'organization') {
        recipientType = 'organization';
      } else if (ticket.requesterType) {
        recipientType = ticket.requesterType === 'client' ? 'client' : 'organization';
      }
      
      recipients.push({
        recipientId: ticket.requesterId,
        recipientType
      });
    }

    const notifications = recipients.map(recipient => ({
      ...recipient,
      organizationId: ticket.organizationId,
      type: 'ticket_status_changed',
      title: 'Status do Ticket Alterado',
      message: `Ticket #${ticket.ticketNumber}: ${oldStatus} → ${newStatus}`,
      ticketId: ticket.id,
      link: `/tickets/${ticket.id}`,
      priority: 'normal',
      data: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        oldStatus,
        newStatus
      },
      actorId: changedById,
      actorType: 'organization',
      actorName: changedByName
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    logger.error('Erro ao notificar mudança de status:', error);
  }
};

/**
 * Notificar novo comentário
 */
export const notifyNewComment = async (ticket, comment, authorId, authorType, authorName) => {
  try {
    const recipients = [];

    logger.info(`🔔 [notifyNewComment] Iniciando notificação para ticket ${ticket.ticketNumber}`);
    logger.info(`🔔 [notifyNewComment] Autor: ${authorName} (${authorId}, tipo: ${authorType})`);
    logger.info(`🔔 [notifyNewComment] Ticket assigneeId: ${ticket.assigneeId}, requesterId: ${ticket.requesterId}`);
    logger.info(`🔔 [notifyNewComment] Comentário interno: ${comment.isInternal}`);

    // Notificar responsável
    if (ticket.assigneeId && ticket.assigneeId !== authorId) {
      recipients.push({
        recipientId: ticket.assigneeId,
        recipientType: 'organization'
      });
      logger.info(`✅ [notifyNewComment] Adicionado assignee: ${ticket.assigneeId}`);
    }

    // Notificar cliente (se não for comentário interno) - Detectar tipo automaticamente
    if (!comment.isInternal && ticket.requesterId && ticket.requesterId !== authorId) {
      // Tentar detectar tipo do requester
      let recipientType = 'client'; // padrão
      
      if (ticket.requesterClientUserId) {
        recipientType = 'client';
      } else if (ticket.requesterOrgUserId || ticket.requesterType === 'organization') {
        recipientType = 'organization';
      } else if (ticket.requesterType) {
        recipientType = ticket.requesterType === 'client' ? 'client' : 'organization';
      }
      
      recipients.push({
        recipientId: ticket.requesterId,
        recipientType
      });
      logger.info(`✅ [notifyNewComment] Adicionado requester: ${ticket.requesterId} (tipo: ${recipientType})`);
    } else {
      logger.info(`⚠️ [notifyNewComment] Requester não notificado - interno: ${comment.isInternal}, requesterId: ${ticket.requesterId}, é autor: ${ticket.requesterId === authorId}`);
    }

    logger.info(`📊 [notifyNewComment] Total de recipients: ${recipients.length}`);

    const notifications = recipients.map(recipient => ({
      ...recipient,
      organizationId: ticket.organizationId,
      type: 'comment_added',
      title: 'Novo Comentário',
      message: `Novo comentário no ticket #${ticket.ticketNumber}`,
      ticketId: ticket.id,
      link: `/tickets/${ticket.id}`,
      priority: 'normal',
      data: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        commentPreview: comment.content.substring(0, 100),
        isInternal: comment.isInternal
      },
      actorId: authorId,
      actorType: authorType,
      actorName: authorName
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
      logger.info(`✅ [notifyNewComment] ${notifications.length} notificações criadas`);
    } else {
      logger.warn(`⚠️ [notifyNewComment] Nenhuma notificação criada`);
    }
  } catch (error) {
    logger.error('Erro ao notificar novo comentário:', error);
  }
};

/**
 * Notificar quando ticket é aprovado
 */
export const notifyTicketApproved = async (ticket, approvedById, approvedByName) => {
  try {
    const recipients = [];

    // Notificar criador - Detectar tipo automaticamente
    if (ticket.requesterId) {
      // Tentar detectar tipo do requester
      let recipientType = 'client'; // padrão
      
      if (ticket.requesterClientUserId) {
        recipientType = 'client';
      } else if (ticket.requesterOrgUserId || ticket.requesterType === 'organization') {
        recipientType = 'organization';
      } else if (ticket.requesterType) {
        recipientType = ticket.requesterType === 'client' ? 'client' : 'organization';
      }
      
      recipients.push({
        recipientId: ticket.requesterId,
        recipientType
      });
    }

    // Notificar responsável se houver
    if (ticket.assigneeId && ticket.assigneeId !== approvedById) {
      recipients.push({
        recipientId: ticket.assigneeId,
        recipientType: 'organization'
      });
    }

    const notifications = recipients.map(recipient => ({
      ...recipient,
      organizationId: ticket.organizationId,
      type: 'ticket_approved',
      title: 'Ticket Aprovado',
      message: `Ticket #${ticket.ticketNumber} foi aprovado`,
      ticketId: ticket.id,
      link: `/tickets/${ticket.id}`,
      priority: 'high',
      data: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject
      },
      actorId: approvedById,
      actorType: 'organization',
      actorName: approvedByName
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    logger.error('Erro ao notificar aprovação de ticket:', error);
  }
};

/**
 * Notificar quando ticket é resolvido
 */
export const notifyTicketResolved = async (ticket, resolvedById, resolvedByName) => {
  try {
    const recipients = [];

    // Notificar cliente - Detectar tipo automaticamente
    if (ticket.requesterId) {
      // Tentar detectar tipo do requester
      let recipientType = 'client'; // padrão
      
      if (ticket.requesterClientUserId) {
        recipientType = 'client';
      } else if (ticket.requesterOrgUserId || ticket.requesterType === 'organization') {
        recipientType = 'organization';
      } else if (ticket.requesterType) {
        recipientType = ticket.requesterType === 'client' ? 'client' : 'organization';
      }
      
      recipients.push({
        recipientId: ticket.requesterId,
        recipientType
      });
    }

    const notifications = recipients.map(recipient => ({
      ...recipient,
      organizationId: ticket.organizationId,
      type: 'ticket_resolved',
      title: 'Ticket Resolvido',
      message: `Ticket #${ticket.ticketNumber} foi resolvido`,
      ticketId: ticket.id,
      link: `/tickets/${ticket.id}`,
      priority: 'high',
      data: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        resolution: ticket.resolution
      },
      actorId: resolvedById,
      actorType: 'organization',
      actorName: resolvedByName
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    logger.error('Erro ao notificar resolução de ticket:', error);
  }
};

/**
 * Notificar quando ticket é fechado
 */
export const notifyTicketClosed = async (ticket, closedById, closedByName) => {
  try {
    const recipients = [];

    // Notificar cliente - Detectar tipo automaticamente
    if (ticket.requesterId) {
      // Tentar detectar tipo do requester
      let recipientType = 'client'; // padrão
      
      if (ticket.requesterClientUserId) {
        recipientType = 'client';
      } else if (ticket.requesterOrgUserId || ticket.requesterType === 'organization') {
        recipientType = 'organization';
      } else if (ticket.requesterType) {
        recipientType = ticket.requesterType === 'client' ? 'client' : 'organization';
      }
      
      recipients.push({
        recipientId: ticket.requesterId,
        recipientType
      });
    }

    const notifications = recipients.map(recipient => ({
      ...recipient,
      organizationId: ticket.organizationId,
      type: 'ticket_closed',
      title: 'Ticket Fechado',
      message: `Ticket #${ticket.ticketNumber} foi fechado`,
      ticketId: ticket.id,
      link: `/tickets/${ticket.id}`,
      priority: 'normal',
      data: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject
      },
      actorId: closedById,
      actorType: 'organization',
      actorName: closedByName
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    logger.error('Erro ao notificar fechamento de ticket:', error);
  }
};

export default {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanOldNotifications,
  // Helpers
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyStatusChange,
  notifyNewComment,
  notifyTicketApproved,
  notifyTicketResolved,
  notifyTicketClosed
};
