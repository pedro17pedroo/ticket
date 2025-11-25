import * as notificationService from './notificationService.js';
import logger from '../../config/logger.js';

/**
 * Obter notificações do usuário
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    const userId = req.user.id;
    let userType = req.user.userType; // 'organization' ou 'client'

    // CORREÇÃO: Detectar userType baseado no role se não estiver definido corretamente
    const isClientRole = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);
    const isOrgRole = ['org-admin', 'manager-org', 'technician-org', 'user-org'].includes(req.user.role);
    
    if (isClientRole) {
      userType = 'client';
      logger.info(`🔧 Forçando userType para 'client' baseado no role: ${req.user.role}`);
    } else if (isOrgRole) {
      userType = 'organization';
      logger.info(`🔧 Forçando userType para 'organization' baseado no role: ${req.user.role}`);
    } else {
      // Fallback para roles desconhecidos
      userType = userType || 'organization';
    }

    logger.info(`📬 Buscando notificações para userId: ${userId}, userType: ${userType}, role: ${req.user.role}, limit: ${limit}`);

    const result = await notificationService.getUserNotifications(userId, userType, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    logger.info(`📬 Encontradas ${result.notifications.length} notificações, ${result.unreadCount} não lidas`);

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
    let userType = req.user.userType;

    // CORREÇÃO: Detectar userType baseado no role
    const isClientRole = ['client-admin', 'client-user', 'client-manager'].includes(req.user.role);
    const isOrgRole = ['org-admin', 'manager-org', 'technician-org', 'user-org'].includes(req.user.role);
    
    if (isClientRole) {
      userType = 'client';
      logger.info(`🔧 Forçando userType para 'client' no unreadCount baseado no role: ${req.user.role}`);
    } else if (isOrgRole) {
      userType = 'organization';
      logger.info(`🔧 Forçando userType para 'organization' no unreadCount baseado no role: ${req.user.role}`);
    } else {
      // Fallback para roles desconhecidos
      userType = userType || 'organization';
    }

    const result = await notificationService.getUserNotifications(userId, userType, { limit: 1 });

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
    const userType = req.user.userType;

    const notification = await notificationService.markAsRead(id, userId, userType);

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
    const userType = req.user.userType;
    const count = await notificationService.markAllAsRead(userId, userType);

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
    const userType = req.user.userType;

    const deleted = await notificationService.deleteNotification(id, userId, userType);

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
