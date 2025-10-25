import { Op } from 'sequelize';
import Notification from '../modules/notifications/notificationModel.js';
import { User } from '../modules/models/index.js';
import logger from '../config/logger.js';

/**
 * Criar notificação
 */
export const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    // Buscar notificação completa com dados do usuário
    const fullNotification = await Notification.findByPk(notification.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar']
      }]
    });

    logger.info(`Notificação criada: ${notification.type} para usuário ${notificationData.userId}`);
    
    return fullNotification;
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
    return created;
  } catch (error) {
    logger.error('Erro ao criar notificações em massa:', error);
    throw error;
  }
};

/**
 * Buscar notificações do usuário
 */
export const getUserNotifications = async (userId, options = {}) => {
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  try {
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const unreadCount = await Notification.count({
      where: { userId, isRead: false }
    });

    return {
      notifications,
      unreadCount,
      total: await Notification.count({ where: { userId } })
    };
  } catch (error) {
    logger.error('Erro ao buscar notificações:', error);
    throw error;
  }
};

/**
 * Marcar notificação como lida
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
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
export const markAllAsRead = async (userId) => {
  try {
    const updated = await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: { userId, isRead: false }
      }
    );

    logger.info(`${updated[0]} notificações marcadas como lidas para usuário ${userId}`);
    return updated[0];
  } catch (error) {
    logger.error('Erro ao marcar todas como lidas:', error);
    throw error;
  }
};

/**
 * Deletar notificação
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const deleted = await Notification.destroy({
      where: { id: notificationId, userId }
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
 * Helper: Notificar sobre novo ticket
 */
export const notifyNewTicket = async (ticket, assigneeId) => {
  if (!assigneeId) return;

  return createNotification({
    userId: assigneeId,
    organizationId: ticket.organizationId,
    type: 'ticket_created',
    title: 'Novo Ticket Atribuído',
    message: `Ticket #${ticket.ticketNumber}: ${ticket.subject}`,
    ticketId: ticket.id,
    link: `/tickets/${ticket.id}`,
    priority: ticket.priority === 'crítica' || ticket.priority === 'alta' ? 'high' : 'normal',
    data: {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      priority: ticket.priority
    }
  });
};

/**
 * Helper: Notificar sobre atribuição
 */
export const notifyTicketAssigned = async (ticket, assigneeId, assignedBy) => {
  if (!assigneeId || assigneeId === assignedBy) return;

  return createNotification({
    userId: assigneeId,
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
      assignedBy
    }
  });
};

/**
 * Helper: Notificar sobre mudança de status
 */
export const notifyStatusChange = async (ticket, oldStatus, newStatus, userIds) => {
  const notifications = userIds.map(userId => ({
    userId,
    organizationId: ticket.organizationId,
    type: 'ticket_status_changed',
    title: 'Status do Ticket Alterado',
    message: `Ticket #${ticket.ticketNumber}: ${oldStatus} → ${newStatus}`,
    ticketId: ticket.id,
    link: `/tickets/${ticket.id}`,
    priority: 'normal',
    data: {
      ticketNumber: ticket.ticketNumber,
      oldStatus,
      newStatus
    }
  }));

  return createBulkNotifications(notifications);
};

/**
 * Helper: Notificar sobre novo comentário
 */
export const notifyNewComment = async (ticket, comment, authorId, recipientIds) => {
  const recipients = recipientIds.filter(id => id !== authorId);
  if (recipients.length === 0) return;

  const notifications = recipients.map(userId => ({
    userId,
    organizationId: ticket.organizationId,
    type: 'comment_added',
    title: 'Novo Comentário',
    message: `Novo comentário no ticket #${ticket.ticketNumber}`,
    ticketId: ticket.id,
    link: `/tickets/${ticket.id}`,
    priority: 'normal',
    data: {
      ticketNumber: ticket.ticketNumber,
      commentPreview: comment.content.substring(0, 100),
      isInternal: comment.isInternal
    }
  }));

  return createBulkNotifications(notifications);
};

/**
 * Helper: Notificar sobre transferência
 */
export const notifyTicketTransfer = async (ticket, newDepartment, newAssigneeId, transferredBy) => {
  if (!newAssigneeId || newAssigneeId === transferredBy) return;

  return createNotification({
    userId: newAssigneeId,
    organizationId: ticket.organizationId,
    type: 'ticket_transferred',
    title: 'Ticket Transferido',
    message: `Ticket #${ticket.ticketNumber} foi transferido para você`,
    ticketId: ticket.id,
    link: `/tickets/${ticket.id}`,
    priority: 'high',
    data: {
      ticketNumber: ticket.ticketNumber,
      department: newDepartment
    }
  });
};

export default {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanOldNotifications,
  notifyNewTicket,
  notifyTicketAssigned,
  notifyStatusChange,
  notifyNewComment,
  notifyTicketTransfer
};
