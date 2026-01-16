import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Erro desconhecido'

    // Não redirecionar em caso de erro na rota de login
    const isLoginRequest = error.config?.url?.includes('/auth/login')

    if (error.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      toast.error('Sessão expirada. Faça login novamente.')
    }

    // Não mostrar toast automático - deixar componentes tratarem
    // toast.error(message)

    return Promise.reject(error)
  }
)

export default api

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password, portalType: 'client' })
    return response.data
  },
  requestPasswordReset: async (email, portalType = 'client') => {
    const response = await api.post('/auth/password-reset/request', { email, portalType })
    return response.data
  },
  validatePasswordResetToken: async (email, token, portalType = 'client') => {
    const response = await api.post('/auth/password-reset/validate', { email, token, portalType })
    return response.data
  },
  resetPasswordWithToken: async (email, token, newPassword, portalType = 'client') => {
    const response = await api.post('/auth/password-reset/reset', { email, token, newPassword, portalType })
    return response.data
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data)
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

export const ticketService = {
  getMyTickets: async (params) => {
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

  addComment: async (id, data) => {
    const response = await api.post(`/tickets/${id}/comments`, data)
    return response.data
  },

  getPriorities: async () => {
    const response = await api.get('/priorities')
    return response.data
  },

  getTypes: async () => {
    const response = await api.get('/types')
    return response.data
  },

  getCategories: async () => {
    const response = await api.get('/catalog/categories')
    return response.data
  },

  uploadAttachments: async (ticketId, files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await api.post(`/tickets/${ticketId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  getAttachments: async (ticketId) => {
    const response = await api.get(`/tickets/${ticketId}/attachments`)
    return response.data
  },

  downloadAttachment: async (ticketId, attachmentId) => {
    const response = await api.get(`/tickets/${ticketId}/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  deleteAttachment: async (ticketId, attachmentId) => {
    const response = await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`)
    return response.data
  },
}

// Client portal - users management (DEPRECATED - usar clientUserService.js)
// Mantido para compatibilidade, mas recomenda-se usar o serviço separado
export const clientUserServiceLegacy = {
  getAll: async (params) => {
    const user = JSON.parse(localStorage.getItem('user'))
    const response = await api.get(`/client-users-b2b/clients/${user?.clientId}/users`, { params })
    return response.data
  },
  create: async (data) => {
    const user = JSON.parse(localStorage.getItem('user'))
    const response = await api.post(`/client-users-b2b/clients/${user?.clientId}/users`, data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/client-users-b2b/${id}`, data)
    return response.data
  },
  remove: async (id) => {
    const response = await api.delete(`/client-users-b2b/${id}`)
    return response.data
  },
  activate: async (id) => {
    const response = await api.put(`/client-users-b2b/${id}/activate`)
    return response.data
  },
  resetPassword: async (id, newPassword) => {
    const response = await api.put(`/client-users-b2b/${id}/change-password`, { newPassword })
    return response.data
  }
}

// Client Users - Re-export do serviço separado
export { clientUserService } from './clientUserService'

// Hours Bank - Cliente
export const hoursBankService = {
  getAll: async () => {
    const response = await api.get('/client/hours-banks')
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/client/hours-banks/${id}`)
    return response.data
  },
  getTransactions: async (id, params = {}) => {
    const response = await api.get(`/client/hours-banks/${id}/transactions`, { params })
    return response.data
  },
  getAllTransactions: async (params = {}) => {
    const response = await api.get('/client/hours-transactions', { params })
    return response.data
  }
}
