import api from './api';

export const organizationService = {
  // Listar todas as organizações
  async getAll(params = {}) {
    const response = await api.get('/organizations', { params });
    return response.data;
  },

  // Obter organização por ID
  async getById(id) {
    const response = await api.get(`/organizations/${id}`);
    // A API retorna { success: true, tenant: {...} } ou { success: true, organization: {...} }
    const data = response.data;
    return data.tenant || data.organization || data;
  },

  // Criar nova organização
  async create(data) {
    const response = await api.post('/organizations', data);
    return response.data;
  },

  // Atualizar organização
  async update(id, data) {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
  },

  // Deletar organização
  async delete(id) {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },

  // Suspender organização
  async suspend(id, reason) {
    const response = await api.post(`/organizations/${id}/suspend`, { reason });
    return response.data;
  },

  // Ativar organização
  async activate(id) {
    const response = await api.post(`/organizations/${id}/activate`);
    return response.data;
  },

  // Obter estatísticas da organização
  async getStats(id) {
    const response = await api.get(`/organizations/${id}/stats`);
    return response.data;
  },

  // Obter usuários da organização
  async getUsers(id, params = {}) {
    const response = await api.get(`/organizations/${id}/users`, { params });
    return response.data;
  },

  // Obter clientes da organização
  async getClients(id, params = {}) {
    const response = await api.get(`/organizations/${id}/clients`, { params });
    return response.data;
  }
};

export default organizationService;
