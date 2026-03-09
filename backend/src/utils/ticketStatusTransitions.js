/**
 * Utilitário para gerenciar transições automáticas de status de tickets
 * 
 * Regras de transição:
 * 1. Quando um responsável (assignee) interage com o ticket (comentário, timer), status muda de 'novo' para 'em_progresso'
 * 2. Quando o cliente responde e o ticket está 'aguardando_cliente', volta para 'em_progresso'
 * 3. Tickets 'fechado' ou 'resolvido' não podem ter status alterado automaticamente
 */

import logger from '../config/logger.js';

/**
 * Verifica se o ticket deve ter seu status alterado automaticamente
 * @param {Object} ticket - Instância do ticket
 * @param {Object} user - Usuário que está interagindo
 * @param {String} action - Tipo de ação: 'comment', 'timer_start', 'timer_stop', 'manual_time'
 * @returns {Promise<Object>} { shouldUpdate: boolean, newStatus: string|null, reason: string }
 */
export const checkStatusTransition = async (ticket, user, action) => {
  const currentStatus = ticket.status;
  
  // Tickets fechados ou resolvidos não mudam automaticamente
  if (['fechado', 'resolvido'].includes(currentStatus)) {
    return { 
      shouldUpdate: false, 
      newStatus: null, 
      reason: 'Ticket já está concluído' 
    };
  }

  // Determinar se o usuário é o responsável pelo ticket
  const isAssignee = ticket.assigneeId && ticket.assigneeId === user.id;
  
  // Determinar se o usuário é um cliente
  const isClient = ['client-admin', 'client-user', 'client-viewer'].includes(user.role);

  // REGRA 1: Responsável interage com ticket 'novo' → muda para 'em_progresso'
  if (isAssignee && currentStatus === 'novo' && ['comment', 'timer_start', 'manual_time'].includes(action)) {
    return {
      shouldUpdate: true,
      newStatus: 'em_progresso',
      reason: `Responsável iniciou trabalho no ticket (${action})`
    };
  }

  // REGRA 2: Cliente responde quando ticket está 'aguardando_cliente' → volta para 'em_progresso'
  if (isClient && currentStatus === 'aguardando_cliente' && action === 'comment') {
    return {
      shouldUpdate: true,
      newStatus: 'em_progresso',
      reason: 'Cliente respondeu ao ticket'
    };
  }

  // REGRA 3: Qualquer membro da organização interage com ticket 'novo' → muda para 'em_progresso'
  // (mesmo que não seja o assignee, se alguém da org está trabalhando, o ticket está em progresso)
  if (!isClient && currentStatus === 'novo' && ['comment', 'timer_start', 'manual_time'].includes(action)) {
    return {
      shouldUpdate: true,
      newStatus: 'em_progresso',
      reason: `Membro da organização iniciou trabalho no ticket (${action})`
    };
  }

  // Nenhuma transição necessária
  return {
    shouldUpdate: false,
    newStatus: null,
    reason: 'Nenhuma transição automática aplicável'
  };
};

/**
 * Aplica a transição de status se necessário
 * @param {Object} ticket - Instância do ticket
 * @param {Object} user - Usuário que está interagindo
 * @param {String} action - Tipo de ação
 * @returns {Promise<Object>} { updated: boolean, oldStatus: string, newStatus: string|null }
 */
export const applyStatusTransition = async (ticket, user, action) => {
  try {
    const transition = await checkStatusTransition(ticket, user, action);
    
    if (!transition.shouldUpdate) {
      logger.debug(`Status do ticket ${ticket.ticketNumber} não alterado: ${transition.reason}`);
      return {
        updated: false,
        oldStatus: ticket.status,
        newStatus: null,
        reason: transition.reason
      };
    }

    const oldStatus = ticket.status;
    await ticket.update({ status: transition.newStatus });
    
    logger.info(
      `✅ Status do ticket ${ticket.ticketNumber} alterado automaticamente: ` +
      `${oldStatus} → ${transition.newStatus}. Motivo: ${transition.reason}`
    );

    return {
      updated: true,
      oldStatus,
      newStatus: transition.newStatus,
      reason: transition.reason
    };
  } catch (error) {
    logger.error(`Erro ao aplicar transição de status no ticket ${ticket.ticketNumber}:`, error);
    return {
      updated: false,
      oldStatus: ticket.status,
      newStatus: null,
      error: error.message
    };
  }
};

/**
 * Middleware para aplicar transições automáticas após ações
 * Uso: await applyStatusTransitionMiddleware(ticket, req.user, 'comment');
 */
export const applyStatusTransitionMiddleware = async (ticket, user, action) => {
  return await applyStatusTransition(ticket, user, action);
};

export default {
  checkStatusTransition,
  applyStatusTransition,
  applyStatusTransitionMiddleware
};
