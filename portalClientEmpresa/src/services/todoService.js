import api from './api'

export const todoService = {
  // Listar todas as tarefas
  getAll: async (params = {}) => {
    const response = await api.get('/client/todos', { params })
    return response.data
  },

  // Criar tarefa
  create: async (data) => {
    const response = await api.post('/client/todos', data)
    return response.data
  },

  // Atualizar tarefa
  update: async (id, data) => {
    const response = await api.put(`/client/todos/${id}`, data)
    return response.data
  },

  // Mover tarefa (drag & drop)
  move: async (id, data) => {
    const response = await api.put(`/client/todos/${id}/move`, data)
    return response.data
  },

  // Deletar tarefa
  delete: async (id) => {
    const response = await api.delete(`/client/todos/${id}`)
    return response.data
  },

  // Reordenar tarefas em lote
  reorder: async (todos) => {
    const response = await api.put('/client/todos/reorder', { todos })
    return response.data
  },

  // Listar usuários disponíveis para colaboração
  getAvailableUsers: async () => {
    const response = await api.get('/client/todos/users')
    return response.data
  },

  // Adicionar colaborador
  addCollaborator: async (todoId, userId, canEdit = false) => {
    const response = await api.post(`/client/todos/${todoId}/collaborators`, { userId, canEdit })
    return response.data
  },

  // Remover colaborador
  removeCollaborator: async (todoId, collaboratorId) => {
    const response = await api.delete(`/client/todos/${todoId}/collaborators/${collaboratorId}`)
    return response.data
  }
}

export default todoService
