import api from './api';

export const subscriptionService = {
  // Listar todas as subscrições
  async getAll(params = {}) {
    const response = await api.get('/subscriptions', { params });
    return response.data;
  },

  // Listar subscrições pendentes de aprovação
  async getPending(params = {}) {
    const response = await api.get('/subscriptions/pending', { params });
    return response.data;
  },

  // Obter estatísticas
  async getStats() {
    const response = await api.get('/subscriptions/stats');
    return response.data;
  },

  // Obter subscrição por ID
  async getById(id) {
    const response = await api.get(`/subscriptions/${id}`);
    return response.data;
  },

  // Alterar plano
  async changePlan(id, planId, reason) {
    const response = await api.put(`/subscriptions/${id}/plan`, { planId, reason });
    return response.data;
  },

  // Aprovar subscrição (pagamento manual)
  async approve(id, data) {
    const response = await api.put(`/subscriptions/${id}/approve`, data);
    return response.data;
  },

  // Rejeitar subscrição
  async reject(id, reason) {
    const response = await api.put(`/subscriptions/${id}/reject`, { reason });
    return response.data;
  },

  // Cancelar subscrição
  async cancel(id, reason, immediate = false) {
    const response = await api.put(`/subscriptions/${id}/cancel`, { reason, immediate });
    return response.data;
  },

  // Reativar subscrição
  async reactivate(id) {
    const response = await api.put(`/subscriptions/${id}/reactivate`);
    return response.data;
  },

  // Estender trial
  async extendTrial(id, days) {
    const response = await api.put(`/subscriptions/${id}/extend-trial`, { days });
    return response.data;
  }
};

export default subscriptionService;
