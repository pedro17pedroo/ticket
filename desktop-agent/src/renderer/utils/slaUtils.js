/**
 * Utilitários para cálculo de SLA
 */

/**
 * Calcula o tempo restante do SLA para um ticket
 * @param {Object} ticket - Objeto do ticket
 * @param {Object} sla - Objeto do SLA
 * @returns {Object} Informações sobre o tempo restante do SLA
 */
export function calculateSLATimeRemaining(ticket, sla) {
  if (!ticket || !sla) {
    return null;
  }

  const now = new Date();
  const createdAt = new Date(ticket.createdAt);
  
  // Calcular tempo decorrido em minutos
  const elapsedMinutes = Math.floor((now - createdAt) / (1000 * 60));
  
  // Determinar qual SLA usar baseado no status do ticket
  let slaMinutes;
  let slaType;
  
  // Se o ticket ainda não foi respondido, usar tempo de resposta
  if (ticket.status === 'novo') {
    slaMinutes = sla.responseTimeMinutes;
    slaType = 'response';
  } else {
    // Caso contrário, usar tempo de resolução
    slaMinutes = sla.resolutionTimeMinutes;
    slaType = 'resolution';
  }
  
  // Calcular tempo restante
  const remainingMinutes = slaMinutes - elapsedMinutes;
  
  // Determinar status do SLA
  let status;
  if (remainingMinutes <= 0) {
    status = 'breached'; // SLA violado
  } else if (remainingMinutes <= slaMinutes * 0.2) {
    status = 'critical'; // Crítico (20% do tempo restante)
  } else if (remainingMinutes <= slaMinutes * 0.5) {
    status = 'warning'; // Aviso (50% do tempo restante)
  } else {
    status = 'ok'; // OK
  }
  
  return {
    type: slaType,
    totalMinutes: slaMinutes,
    elapsedMinutes,
    remainingMinutes,
    status,
    percentage: Math.max(0, Math.min(100, (remainingMinutes / slaMinutes) * 100))
  };
}

/**
 * Formata o tempo restante em formato legível
 * @param {number} minutes - Minutos restantes
 * @returns {string} Tempo formatado
 */
export function formatTimeRemaining(minutes) {
  if (minutes <= 0) {
    return 'Vencido';
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Obtém a cor baseada no status do SLA
 * @param {string} status - Status do SLA
 * @returns {string} Cor em formato CSS
 */
export function getSLAStatusColor(status) {
  switch (status) {
    case 'breached':
      return '#ef4444'; // Vermelho
    case 'critical':
      return '#f97316'; // Laranja
    case 'warning':
      return '#eab308'; // Amarelo
    case 'ok':
      return '#22c55e'; // Verde
    default:
      return '#6b7280'; // Cinza
  }
}

/**
 * Obtém o ícone baseado no status do SLA
 * @param {string} status - Status do SLA
 * @returns {string} Nome do ícone
 */
export function getSLAStatusIcon(status) {
  switch (status) {
    case 'breached':
      return '⚠️';
    case 'critical':
      return '🔥';
    case 'warning':
      return '⏰';
    case 'ok':
      return '✅';
    default:
      return '⏱️';
  }
}

/**
 * Obtém o texto de status do SLA
 * @param {string} status - Status do SLA
 * @param {string} type - Tipo do SLA (response/resolution)
 * @returns {string} Texto do status
 */
export function getSLAStatusText(status, type) {
  const typeText = type === 'response' ? 'Resposta' : 'Resolução';
  
  switch (status) {
    case 'breached':
      return `SLA ${typeText} Violado`;
    case 'critical':
      return `SLA ${typeText} Crítico`;
    case 'warning':
      return `SLA ${typeText} Atenção`;
    case 'ok':
      return `SLA ${typeText} OK`;
    default:
      return `SLA ${typeText}`;
  }
}