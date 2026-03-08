import api from './api'

export const todoService = {
  // Listar todas as tarefas
  getAll: async (params = {}) => {
    const response = await api.get('/organization/todos', { params })
    return response.data
  },

  // Criar tarefa
  create: async (data) => {
    const response = await api.post('/organization/todos', data)
    return response.data
  },

  // Atualizar tarefa
  update: async (id, data) => {
    const response = await api.put(`/organization/todos/${id}`, data)
    return response.data
  },

  // Mover tarefa (drag & drop)
  move: async (id, data) => {
    const response = await api.put(`/organization/todos/${id}/move`, data)
    return response.data
  },

  // Deletar tarefa
  delete: async (id) => {
    const response = await api.delete(`/organization/todos/${id}`)
    return response.data
  },

  // Reordenar tarefas em lote
  reorder: async (todos) => {
    const response = await api.put('/organization/todos/reorder', { todos })
    return response.data
  },

  // Listar usuários disponíveis para colaboração (org + clientes)
  getAvailableUsers: async () => {
    const response = await api.get('/organization/todos/available-users')
    return response.data
  },

  // Adicionar colaborador (org ou client user)
  addCollaborator: async (todoId, userId, userType, clientId = null, canEdit = false) => {
    const response = await api.post(`/organization/todos/${todoId}/collaborators`, { 
      userId, 
      userType,
      clientId,
      canEdit 
    })
    return response.data
  },

  // Remover colaborador
  removeCollaborator: async (todoId, collaboratorId, userType) => {
    const response = await api.delete(`/organization/todos/${todoId}/collaborators/${collaboratorId}?userType=${userType}`)
    return response.data
  }
}

export default todoService
