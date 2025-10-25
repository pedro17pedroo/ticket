import notificationService from '../../services/notificationService.js';
import logger from '../../config/logger.js';

/**
 * Obter notificações do usuário
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const result = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    res.json(result);
  } catch (error) {
    logger.error('Erro ao buscar notificações:', error);
    next(error);
  }
};

/**
 * Obter contagem de não lidas
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.getUserNotifications(userId, { limit: 1 });

    res.json({
      unreadCount: result.unreadCount
    });
  } catch (error) {
    logger.error('Erro ao buscar contagem:', error);
    next(error);
  }
};

/**
 * Marcar notificação como lida
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    logger.error('Erro ao marcar como lida:', error);
    next(error);
  }
};

/**
 * Marcar todas como lidas
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    logger.error('Erro ao marcar todas como lidas:', error);
    next(error);
  }
};

/**
 * Deletar notificação
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await notificationService.deleteNotification(id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json({
      success: true,
      message: 'Notificação deletada'
    });
  } catch (error) {
    logger.error('Erro ao deletar notificação:', error);
    next(error);
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
