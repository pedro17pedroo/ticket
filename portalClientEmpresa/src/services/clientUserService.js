import api from './api';

export const clientUserService = {
  // Listar usuários do cliente atual
  async getUsers() {
    try {      
      const { data } = await api.get(`/client/users`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Alias para getUsers (compatibilidade)
  getAll() {
    return this.getUsers();
  },

  // Buscar usuário por ID
  async getUserById(id) {
    try {
      const { data } = await api.get(`/client/users/${id}`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Criar novo usuário (apenas Client Admin)
  async createUser(userData) {
    try {
      const { data } = await api.post(`/client/users`, userData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar usuário
  async updateUser(id, userData) {
    try {
      const { data } = await api.put(`/client/users/${id}`, userData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Desativar usuário
  async deactivateUser(id) {
    try {
      const { data } = await api.delete(`/client/users/${id}`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reativar usuário (via update)
  async activateUser(id) {
    try {
      const { data } = await api.put(`/client/users/${id}`, { isActive: true });
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Alterar senha (usando endpoint geral de update)
  async changePassword(id, passwordData) {
    try {
      const { data } = await api.put(`/client/users/${id}`, passwordData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default clientUserService;
