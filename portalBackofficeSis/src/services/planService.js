import api from './api';

export const planService = {
  // Listar todos os planos
  async getAll(params = {}) {
    const response = await api.get('/plans', { params });
    return response.data;
  },

  // Obter plano por ID
  async getById(id) {
    const response = await api.get(`/plans/${id}`);
    return response.data;
  },

  // Criar novo plano
  async create(data) {
    const response = await api.post('/plans', data);
    return response.data;
  },

  // Atualizar plano
  async update(id, data) {
    const response = await api.put(`/plans/${id}`, data);
    return response.data;
  },

  // Deletar plano
  async delete(id) {
    const response = await api.delete(`/plans/${id}`);
    return response.data;
  },

  // Ativar plano
  async activate(id) {
    const response = await api.put(`/plans/${id}/activate`);
    return response.data;
  },

  // Desativar plano
  async deactivate(id) {
    const response = await api.put(`/plans/${id}/deactivate`);
    return response.data;
  },

  // Obter assinaturas do plano
  async getSubscriptions(id, params = {}) {
    const response = await api.get(`/plans/${id}/subscriptions`, { params });
    return response.data;
  }
};

export default planService;
