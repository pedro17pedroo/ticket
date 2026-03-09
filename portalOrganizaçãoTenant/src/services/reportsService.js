import api from './api';

/**
 * Serviço de Relatórios de Horas
 * Integração com backend para análise de tempo trabalhado
 */

/**
 * Obter relatório de horas por ticket
 * @param {Object} filters - Filtros (startDate, endDate, ticketId, status)
 * @returns {Promise} Dados do relatório
 */
export const getHoursByTicket = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.ticketId) params.append('ticketId', filters.ticketId);
  if (filters.status) params.append('status', filters.status);
  
  const response = await api.get(`/reports/hours-by-ticket?${params.toString()}`);
  return response.data;
};

/**
 * Obter relatório de horas por usuário
 * @param {Object} filters - Filtros (startDate, endDate, userId)
 * @returns {Promise} Dados do relatório
 */
export const getHoursByUser = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.userId) params.append('userId', filters.userId);
  
  const response = await api.get(`/reports/hours-by-user?${params.toString()}`);
  return response.data;
};

/**
 * Obter relatório de horas por cliente
 * @param {Object} filters - Filtros (startDate, endDate, clientId)
 * @returns {Promise} Dados do relatório
 */
export const getHoursByClient = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.clientId) params.append('clientId', filters.clientId);
  
  const response = await api.get(`/reports/hours-by-client?${params.toString()}`);
  return response.data;
};

/**
 * Obter relatório diário de horas
 * @param {Object} filters - Filtros (startDate, endDate, userId, clientId)
 * @returns {Promise} Dados do relatório
 */
export const getDailyReport = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.clientId) params.append('clientId', filters.clientId);
  
  const response = await api.get(`/reports/hours-by-day?${params.toString()}`);
  return response.data;
};

/**
 * Obter resumo por cliente
 * @param {string} clientId - ID do cliente (opcional)
 * @returns {Promise} Dados do resumo
 */
export const getClientSummary = async (clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await api.get(`/reports/client-summary${params}`);
  return response.data;
};

/**
 * Obter relatório detalhado de um usuário
 * @param {string} userId - ID do usuário
 * @param {Object} filters - Filtros (startDate, endDate)
 * @returns {Promise} Dados do relatório
 */
export const getUserDetailedReport = async (userId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  
  const response = await api.get(`/reports/user/${userId}/detailed?${params.toString()}`);
  return response.data;
};

/**
 * Exportar relatório para CSV
 * @param {string} reportType - Tipo de relatório
 * @param {Object} filters - Filtros aplicados
 * @param {Array} data - Dados do relatório
 * @returns {void}
 */
export const exportToCSV = (reportType, filters, data) => {
  let csv = '';
  let filename = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
  
  switch (reportType) {
    case 'hours-by-ticket':
      csv = 'Ticket,Assunto,Cliente,Usuários,Sessões,Horas,Minutos\n';
      data.forEach(item => {
        csv += `"${item.ticket.ticketNumber}","${item.ticket.subject}","${item.ticket.client?.name || 'N/A'}",${item.totalUsers},${item.totalSessions},${item.totalHours},${item.totalMinutes}\n`;
      });
      break;
      
    case 'hours-by-user':
      csv = 'Usuário,Email,Tickets,Sessões,Horas,Minutos\n';
      data.forEach(item => {
        csv += `"${item.user.name}","${item.user.email}",${item.totalTickets},${item.totalSessions},${item.totalHours},${item.totalMinutes}\n`;
      });
      break;
      
    case 'hours-by-client':
      csv = 'Cliente,Email,Tickets,Usuários,Sessões,Horas,Minutos\n';
      data.forEach(item => {
        csv += `"${item.client.name}","${item.client.email}",${item.totalTickets},${item.totalUsers},${item.totalSessions},${item.totalHours},${item.totalMinutes}\n`;
      });
      break;
      
    case 'daily':
      csv = 'Data,Tickets,Usuários,Sessões,Horas,Minutos\n';
      data.forEach(item => {
        csv += `"${item.date}",${item.totalTickets},${item.totalUsers},${item.totalSessions},${item.totalHours},${item.totalMinutes}\n`;
      });
      break;
      
    default:
      console.error('Tipo de relatório não suportado');
      return;
  }
  
  // Criar blob e fazer download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default {
  getHoursByTicket,
  getHoursByUser,
  getHoursByClient,
  getDailyReport,
  getClientSummary,
  getUserDetailedReport,
  exportToCSV
};
