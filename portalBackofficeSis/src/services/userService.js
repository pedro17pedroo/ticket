import api from './api';

export const userService = {
  // Listar usuários provider
  async getAll(params = {}) {
    const response = await api.get('/provider/users', { params });
    return response.data;
  },

  // Obter usuário por ID
  async getById(id) {
    const response = await api.get(`/provider/users/${id}`);
    return response.data;
  },

  // Criar novo usuário
  async create(data) {
    const response = await api.post('/provider/users', data);
    return response.data;
  },

  // Atualizar usuário
  async update(id, data) {
    const response = await api.put(`/provider/users/${id}`, data);
    return response.data;
  },

  // Deletar usuário
  async delete(id) {
    const response = await api.delete(`/provider/users/${id}`);
    return response.data;
  },

  // Ativar/Desativar usuário
  async toggleStatus(id) {
    const response = await api.post(`/provider/users/${id}/toggle-status`);
    return response.data;
  },

  // Atualizar permissões
  async updatePermissions(id, permissions) {
    const response = await api.put(`/provider/users/${id}/permissions`, { permissions });
    return response.data;
  },

  // Resetar senha
  async resetPassword(id) {
    const response = await api.post(`/provider/users/${id}/reset-password`);
    return response.data;
  }
};

export default userService;
