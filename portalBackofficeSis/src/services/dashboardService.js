import api from './api';

export const dashboardService = {
  // Obter estatísticas gerais
  async getStats() {
    const response = await api.get('/provider/stats');
    return response.data;
  },

  // Obter dados de gráficos
  async getChartData(type, params = {}) {
    const response = await api.get(`/dashboard/charts/${type}`, { params });
    return response.data;
  },

  // Obter organizações recentes
  async getRecentOrganizations(limit = 5) {
    const response = await api.get('/dashboard/recent-organizations', { 
      params: { limit } 
    });
    return response.data;
  },

  // Obter atividades recentes
  async getRecentActivity(limit = 10) {
    const response = await api.get('/dashboard/recent-activity', { 
      params: { limit } 
    });
    return response.data;
  },

  // Obter alertas do sistema
  async getAlerts() {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  },

  // ==================== SETTINGS ====================

  // Obter configurações gerais
  async getSettings() {
    const response = await api.get('/provider/settings');
    return response.data.settings;
  },

  // Atualizar configurações gerais
  async updateSettings(data) {
    const response = await api.put('/provider/settings', data);
    return response.data;
  },

  // Obter configurações de segurança
  async getSecuritySettings() {
    const response = await api.get('/provider/settings/security');
    return response.data.security;
  },

  // Atualizar configurações de segurança
  async updateSecuritySettings(data) {
    const response = await api.put('/provider/settings/security', data);
    return response.data;
  },

  // Obter configurações de integrações
  async getIntegrationSettings() {
    const response = await api.get('/provider/settings/integrations');
    return response.data.integrations;
  },

  // Atualizar configurações de integrações
  async updateIntegrationSettings(data) {
    const response = await api.put('/provider/settings/integrations', data);
    return response.data;
  },

  // ==================== AUDIT LOGS ====================

  // Obter logs de auditoria
  async getAuditLogs(params = {}) {
    const response = await api.get('/provider/audit-logs', { params });
    return response.data;
  },

  // Obter histórico de alterações
  async getChangeHistory(params = {}) {
    const response = await api.get('/provider/audit-logs/changes', { params });
    return response.data;
  },

  // ==================== EMAIL SETTINGS ====================

  // Obter configurações de email
  async getEmailSettings() {
    const response = await api.get('/provider/settings/email');
    return response.data;
  },

  // Atualizar configurações de email
  async updateEmailSettings(data) {
    const response = await api.put('/provider/settings/email', data);
    return response.data;
  },

  // Testar email
  async testEmail(email) {
    const response = await api.post('/provider/settings/email/test', { email });
    return response.data;
  },

  // ==================== REPORTS ====================

  // Relatório financeiro
  async getFinancialReports(period = '30days') {
    const response = await api.get('/provider/reports/financial', { params: { period } });
    return response.data;
  },

  // Relatório de uso
  async getUsageReports(period = '30days') {
    const response = await api.get('/provider/reports/usage', { params: { period } });
    return response.data;
  },

  // Relatório de suporte
  async getSupportReports(period = '30days') {
    const response = await api.get('/provider/reports/support', { params: { period } });
    return response.data;
  },

  // ==================== MONITORING ====================

  // Status do sistema
  async getSystemStatus() {
    const response = await api.get('/provider/monitoring/status');
    return response.data;
  },

  // Logs do sistema
  async getLogs(params = {}) {
    const response = await api.get('/provider/monitoring/logs', { params });
    return response.data;
  },

  // Métricas de performance
  async getPerformanceMetrics() {
    const response = await api.get('/provider/monitoring/performance');
    return response.data;
  },

  // Gerar nova chave API
  async generateApiKey() {
    const response = await api.post('/provider/settings/integrations/generate-key');
    return response.data.apiKey;
  }
};

export default dashboardService;
