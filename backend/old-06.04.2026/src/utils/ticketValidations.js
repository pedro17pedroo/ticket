/**
 * Validações e helpers para regras de negócio de tickets
 */

/**
 * Verifica se o ticket está em um estado final (não pode mais ser modificado)
 */
export const isTicketClosed = (ticket) => {
  return ['fechado', 'resolvido'].includes(ticket.status);
};

/**
 * Verifica se o ticket está atribuído a alguém
 */
export const isTicketAssigned = (ticket) => {
  return ticket.assigneeId !== null && ticket.assigneeId !== undefined;
};

/**
 * Verifica se uma ação pode ser realizada no ticket
 */
export const canPerformAction = (ticket, action) => {
  const closed = isTicketClosed(ticket);
  const assigned = isTicketAssigned(ticket);

  const rules = {
    // Ações bloqueadas quando ticket está fechado/resolvido
    'start_timer': !closed && assigned,
    'add_comment': !closed && assigned,
    'assign': !closed,
    'merge': !closed,
    'transfer': !closed,
    'update_status': true, // Sempre pode atualizar status
    
    // Ações que necessitam ticket atribuído
    'pause_timer': assigned,
    'stop_timer': assigned,
    'add_internal_note': assigned,
  };

  return rules[action] ?? true;
};

/**
 * Retorna mensagem de erro apropriada
 */
export const getValidationMessage = (ticket, action) => {
  const closed = isTicketClosed(ticket);
  const assigned = isTicketAssigned(ticket);

  if (closed) {
    switch (action) {
      case 'start_timer':
        return 'Não é possível iniciar cronômetro em ticket concluído';
      case 'add_comment':
        return 'Não é possível adicionar comentários em ticket concluído';
      case 'assign':
        return 'Não é possível atribuir ticket concluído';
      case 'merge':
        return 'Não é possível mesclar ticket concluído';
      case 'transfer':
        return 'Não é possível transferir ticket concluído';
      default:
        return 'Ação não permitida em ticket concluído';
    }
  }

  if (!assigned) {
    switch (action) {
      case 'start_timer':
        return 'Ticket deve ser atribuído antes de iniciar o cronômetro';
      case 'add_comment':
        return 'Ticket deve ser atribuído antes de adicionar comentários';
      case 'pause_timer':
      case 'stop_timer':
        return 'Ticket não está atribuído';
      default:
        return 'Ticket deve ser atribuído para esta ação';
    }
  }

  return 'Ação não permitida';
};

/**
 * Middleware Express para validar ações em tickets
 */
export const validateTicketAction = (action) => {
  return async (req, res, next) => {
    try {
      const ticket = req.ticket; // Assumindo que o ticket já foi carregado

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      if (!canPerformAction(ticket, action)) {
        const message = getValidationMessage(ticket, action);
        return res.status(403).json({ error: message });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  isTicketClosed,
  isTicketAssigned,
  canPerformAction,
  getValidationMessage,
  validateTicketAction
};
