import api from './api'

const clientService = {
  // Listar todos os clientes
  async getAll(params = {}) {
    const response = await api.get('/clients-b2b', { params })
    return response.data
  },

  // Buscar cliente por ID
  async getById(id) {
    const response = await api.get(`/clients-b2b/${id}`)
    return response.data
  },

  // Criar novo cliente
  async create(clientData) {
    const response = await api.post('/clients-b2b', clientData)
    return response.data
  },

  // Atualizar cliente
  async update(id, clientData) {
    const response = await api.put(`/clients-b2b/${id}`, clientData)
    return response.data
  },

  // Excluir/Desativar cliente
  async delete(id) {
    const response = await api.delete(`/clients-b2b/${id}`)
    return response.data
  },

  // Reativar cliente
  async activate(id) {
    const response = await api.put(`/clients-b2b/${id}/activate`)
    return response.data
  },

  // Estatísticas do cliente
  async getStats(id) {
    const response = await api.get(`/clients-b2b/${id}/stats`)
    return response.data
  },

  // Listar usuários de um cliente
  async getUsers(clientId, params = {}) {
    const response = await api.get(`/client-users-b2b/clients/${clientId}/users`, { params })
    return response.data
  },

  // Criar usuário para cliente
  async createUser(clientId, userData) {
    const response = await api.post(`/client-users-b2b/clients/${clientId}/users`, userData)
    return response.data
  },

  // Atualizar usuário de cliente
  async updateUser(userId, userData) {
    const response = await api.put(`/client-users-b2b/${userId}`, userData)
    return response.data
  },

  // Desativar usuário de cliente
  async deactivateUser(userId) {
    const response = await api.delete(`/client-users-b2b/${userId}`)
    return response.data
  },

  // Reativar usuário de cliente
  async activateUser(userId) {
    const response = await api.put(`/client-users-b2b/${userId}/activate`)
    return response.data
  },

  // Alterar senha de usuário
  async changeUserPassword(userId, passwordData) {
    const response = await api.put(`/client-users-b2b/${userId}/change-password`, passwordData)
    return response.data
  }
}

export default clientService
