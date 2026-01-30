/**
 * Serviço de Notificações para Watchers
 * Gerencia notificações para observadores de tickets
 */

import { createNotification } from '../modules/notifications/notificationService.js';
import { OrganizationUser, ClientUser } from '../modules/models/index.js';
import logger from '../config/logger.js';
import { sendEmail } from '../config/email.js';

/**
 * Notificar todos os watchers sobre criação/atualização de ticket
 */
export const notifyTicketWatchers = async (ticket, eventType = 'created', additionalData = {}) => {
  try {
    logger.info(`🔔 Iniciando notificação de watchers para ticket ${ticket.ticketNumber}`);
    logger.info(`🎫 Dados do ticket:`, {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      requesterType: ticket.requesterType,
      requesterEmail: ticket.requester?.email,
      assigneeEmail: ticket.assignee?.email,
      clientWatchers: ticket.clientWatchers,
      orgWatchers: ticket.orgWatchers
    });

    const promises = [];

    // 1. NOTIFICAR CLIENT WATCHERS (emails externos)
    if (ticket.clientWatchers && ticket.clientWatchers.length > 0) {
      logger.info(`📧 Notificando ${ticket.clientWatchers.length} client watchers por email`);
      
      for (const email of ticket.clientWatchers) {
        // Enviar apenas email (não criar notificação no sistema pois não são usuários registrados)
        promises.push(sendWatcherEmail(email, ticket, eventType, 'client', additionalData));
      }
    }

    // 2. NOTIFICAR ORG WATCHERS (usuários da organização)
    if (ticket.orgWatchers && ticket.orgWatchers.length > 0) {
      logger.info(`👥 Notificando ${ticket.orgWatchers.length} org watchers no sistema`);
      
      for (const userId of ticket.orgWatchers) {
        // Criar notificação no sistema + email
        promises.push(createOrgWatcherNotification(userId, ticket, eventType, additionalData));
      }
    }

    // 3. NOTIFICAR ASSIGNEE (se existir e não estiver nos watchers)
    if (ticket.assigneeId) {
      const isAlreadyWatcher = ticket.orgWatchers?.includes(ticket.assigneeId);
      if (!isAlreadyWatcher) {
        promises.push(createOrgWatcherNotification(ticket.assigneeId, ticket, eventType, additionalData));
      }
    }

    // 4. NOTIFICAR REQUESTER
    if (ticket.requesterType === 'organization' && ticket.requesterOrgUserId) {
      // Se for usuário da organização
      const isAlreadyWatcher = ticket.orgWatchers?.includes(ticket.requesterOrgUserId);
      if (!isAlreadyWatcher) {
        promises.push(createOrgWatcherNotification(ticket.requesterOrgUserId, ticket, eventType, additionalData));
      }
    } else if (ticket.requesterType === 'client' && ticket.requester?.email) {
      // Se for cliente, enviar email direto
      const isAlreadyWatcher = ticket.clientWatchers?.includes(ticket.requester.email);
      if (!isAlreadyWatcher) {
        logger.info(`📧 Notificando requester cliente: ${ticket.requester.email}`);
        promises.push(sendWatcherEmail(ticket.requester.email, ticket, eventType, 'client_requester', additionalData));
      }
    }

    await Promise.all(promises);
    logger.info(`✅ Todas as notificações de watchers enviadas para ticket ${ticket.ticketNumber}`);

  } catch (error) {
    logger.error(`❌ Erro ao notificar watchers do ticket ${ticket.ticketNumber}:`, error);
    throw error;
  }
};

/**
 * Criar notificação para usuário da organização
 */
const createOrgWatcherNotification = async (userId, ticket, eventType, additionalData = {}) => {
  try {
    const user = await OrganizationUser.findByPk(userId);
    if (!user) {
      logger.warn(`Usuário org ${userId} não encontrado para notificação`);
      return;
    }

    await createNotification({
      organizationId: ticket.organizationId,
      recipientId: userId,
      recipientType: 'organization',
      type: getNotificationType(eventType),
      title: getNotificationTitle(ticket, eventType),
      message: getNotificationMessage(ticket, eventType, additionalData),
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        eventType: eventType,
        ...additionalData
      }
    });

    logger.info(`📬 Notificação criada para org user ${user.name} (${user.email})`);

  } catch (error) {
    logger.error(`Erro ao criar notificação para org user ${userId}:`, error);
  }
};

/**
 * Enviar email para watcher externo
 */
const sendWatcherEmail = async (email, ticket, eventType, watcherType, additionalData = {}) => {
  try {
    const subject = `[${ticket.ticketNumber}] ${getEmailSubject(eventType)}`;
    const html = generateWatcherEmailBody(ticket, eventType, watcherType, additionalData);

    const result = await sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: `${subject}\n\n${getNotificationMessage(ticket, eventType, additionalData)}`
    });

    if (result.success) {
      logger.info(`📧 Email enviado com sucesso para watcher ${email}`);
    } else {
      logger.error(`❌ Falha ao enviar email para ${email}: ${result.message || result.error}`);
    }

  } catch (error) {
    logger.error(`Erro ao enviar email para ${email}:`, error);
  }
};

/**
 * Obter tipo de notificação baseado no evento
 */
const getNotificationType = (eventType) => {
  const types = {
    created: 'ticket_created',
    updated: 'ticket_updated', 
    commented: 'comment_added',
    status_changed: 'ticket_status_changed',
    assigned: 'ticket_assigned',
    resolved: 'ticket_resolved',
    timer_started: 'timer_started',
    timer_paused: 'timer_paused',
    timer_stopped: 'timer_stopped'
  };
  return types[eventType] || 'ticket_updated';
};

/**
 * Obter título da notificação
 */
const getNotificationTitle = (ticket, eventType) => {
  const titles = {
    created: `Novo ticket criado: ${ticket.ticketNumber}`,
    updated: `Ticket atualizado: ${ticket.ticketNumber}`,
    commented: `Novo comentário: ${ticket.ticketNumber}`,
    status_changed: `Status alterado: ${ticket.ticketNumber}`,
    assigned: `Ticket atribuído: ${ticket.ticketNumber}`,
    resolved: `Ticket resolvido: ${ticket.ticketNumber}`,
    timer_started: `Cronômetro iniciado: ${ticket.ticketNumber}`,
    timer_paused: `Cronômetro pausado: ${ticket.ticketNumber}`,
    timer_stopped: `Cronômetro parado: ${ticket.ticketNumber}`
  };
  return titles[eventType] || `Ticket ${ticket.ticketNumber}`;
};

/**
 * Obter mensagem da notificação
 */
const getNotificationMessage = (ticket, eventType, additionalData = {}) => {
  const subject = ticket.subject || 'Sem assunto';
  
  const messages = {
    created: `O ticket "${subject}" foi criado e você está sendo notificado como observador.`,
    updated: `O ticket "${subject}" foi atualizado.`,
    commented: `Um novo comentário foi adicionado ao ticket "${subject}".`,
    status_changed: `O status do ticket "${subject}" foi alterado para ${ticket.status}.`,
    assigned: `O ticket "${subject}" foi atribuído.`,
    resolved: `O ticket "${subject}" foi resolvido.`,
    timer_started: `${additionalData.startedBy || 'Um técnico'} iniciou o cronômetro no ticket "${subject}".`,
    timer_paused: `${additionalData.pausedBy || 'Um técnico'} pausou o cronômetro no ticket "${subject}".`,
    timer_stopped: `${additionalData.stoppedBy || 'Um técnico'} parou o cronômetro no ticket "${subject}"${additionalData.totalHours ? ` após ${additionalData.totalHours}h trabalhadas` : ''}.`
  };
  
  return messages[eventType] || `O ticket "${subject}" foi modificado.`;
};

/**
 * Obter assunto do email
 */
const getEmailSubject = (eventType) => {
  const subjects = {
    created: 'Novo Ticket Criado',
    updated: 'Ticket Atualizado',
    commented: 'Novo Comentário',
    status_changed: 'Status Alterado',
    assigned: 'Ticket Atribuído',
    resolved: 'Ticket Resolvido',
    timer_started: 'Cronômetro Iniciado',
    timer_paused: 'Cronômetro Pausado',
    timer_stopped: 'Cronômetro Parado'
  };
  return subjects[eventType] || 'Notificação de Ticket';
};

/**
 * Gerar corpo do email para watchers
 */
const generateWatcherEmailBody = (ticket, eventType, watcherType, additionalData = {}) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const ticketUrl = `${baseUrl}/tickets/${ticket.id}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
      <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${getEmailSubject(eventType)}</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">T-Desk Sistema</p>
      </div>
      
      <div style="padding: 30px 20px;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">
          ${getNotificationTitle(ticket, eventType)}
        </h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Número:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Assunto:</strong> ${ticket.subject || 'Sem assunto'}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          <p><strong>Prioridade:</strong> ${ticket.priority}</p>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6;">
          ${getNotificationMessage(ticket, eventType, additionalData)}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${ticketUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Ticket Completo
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Você está recebendo este email porque foi adicionado como observador deste ticket.</p>
          <p>© 2025 T-Desk - Sistema de Gestão de Tickets</p>
        </div>
      </div>
    </div>
  `;
};

export default {
  notifyTicketWatchers
};
