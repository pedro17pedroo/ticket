import api from './api';

export const clientUserService = {
  // Listar usuários do cliente atual
  async getUsers() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.clientId) throw new Error('Client ID não encontrado');
      
      const { data } = await api.get(`/client-users-b2b/clients/${user.clientId}/users`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar usuário por ID
  async getUserById(id) {
    try {
      const { data } = await api.get(`/client-users-b2b/${id}`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Criar novo usuário (apenas Client Admin)
  async createUser(userData) {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.clientId) throw new Error('Client ID não encontrado');
      
      const { data } = await api.post(`/client-users-b2b/clients/${user.clientId}/users`, userData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar usuário
  async updateUser(id, userData) {
    try {
      const { data } = await api.put(`/client-users-b2b/${id}`, userData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Desativar usuário
  async deactivateUser(id) {
    try {
      const { data } = await api.delete(`/client-users-b2b/${id}`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reativar usuário
  async activateUser(id) {
    try {
      const { data } = await api.put(`/client-users-b2b/${id}/activate`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Alterar senha
  async changePassword(id, passwordData) {
    try {
      const { data } = await api.put(`/client-users-b2b/${id}/change-password`, passwordData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default clientUserService;
