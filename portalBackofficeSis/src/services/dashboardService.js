import api from './api';

export const dashboardService = {
  // Obter estatísticas gerais
  async getStats() {
    const response = await api.get('/dashboard/stats');
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
  }
};

export default dashboardService;
