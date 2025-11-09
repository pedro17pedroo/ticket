import api from './api';

export const clientB2BService = {
  // Listar clientes B2B do tenant
  async getClients(params = {}) {
    try {
      const { data } = await api.get('/clients-b2b', { params });
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar cliente por ID
  async getClientById(id) {
    try {
      const { data } = await api.get(`/clients-b2b/${id}`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Criar novo cliente B2B
  async createClient(clientData) {
    try {
      const { data } = await api.post('/clients-b2b', clientData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar cliente
  async updateClient(id, clientData) {
    try {
      const { data } = await api.put(`/clients-b2b/${id}`, clientData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Desativar cliente
  async deactivateClient(id) {
    try {
      const { data } = await api.delete(`/clients-b2b/${id}`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reativar cliente
  async activateClient(id) {
    try {
      const { data } = await api.put(`/clients-b2b/${id}/activate`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Estatísticas do cliente
  async getClientStats(id) {
    try {
      const { data } = await api.get(`/clients-b2b/${id}/stats`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar usuários de um cliente
  async getClientUsers(clientId, params = {}) {
    try {
      const { data } = await api.get(`/client-users-b2b/clients/${clientId}/users`, { params });
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Criar usuário para cliente
  async createClientUser(clientId, userData) {
    try {
      const { data } = await api.post(`/client-users-b2b/clients/${clientId}/users`, userData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar usuário de cliente
  async updateClientUser(userId, userData) {
    try {
      const { data } = await api.put(`/client-users-b2b/${userId}`, userData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Desativar usuário de cliente
  async deactivateClientUser(userId) {
    try {
      const { data } = await api.delete(`/client-users-b2b/${userId}`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reativar usuário de cliente
  async activateClientUser(userId) {
    try {
      const { data } = await api.put(`/client-users-b2b/${userId}/activate`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Alterar senha de usuário
  async changeUserPassword(userId, passwordData) {
    try {
      const { data } = await api.put(`/client-users-b2b/${userId}/change-password`, passwordData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default clientB2BService;
