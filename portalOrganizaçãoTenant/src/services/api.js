import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Erro desconhecido'
    
    // Se token expirou, fazer logout
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      toast.error('Sessão expirada. Faça login novamente.')
    } else {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api

// Serviços de autenticação
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data)
    return response.data
  },
}

// Serviços de tickets
export const ticketService = {
  getAll: async (params) => {
    const response = await api.get('/tickets', { params })
    return response.data
  },
  
  getById: async (id) => {
    const response = await api.get(`/tickets/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/tickets', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/tickets/${id}`, data)
    return response.data
  },
  
  addComment: async (id, data) => {
    const response = await api.post(`/tickets/${id}/comments`, data)
    return response.data
  },
  
  getStatistics: async () => {
    const response = await api.get('/tickets/statistics')
    return response.data
  },
}

// Serviços de departamentos
export const departmentService = {
  getAll: async () => {
    const response = await api.get('/departments')
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/departments', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/departments/${id}`)
    return response.data
  },
}
