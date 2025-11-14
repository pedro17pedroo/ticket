import axios from 'axios';
import toast from 'react-hot-toast';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Adicionar token se existir
    const token = localStorage.getItem('saas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratar erros globalmente
    if (error.response?.status === 401) {
      localStorage.removeItem('saas_token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.error || error.message || 'Erro desconhecido';
    console.error('API Error:', message);
    
    return Promise.reject(error);
  }
);

// Serviços da API SaaS
export const saasAPI = {
  // Onboarding de Organizações
  async createOrganization(data) {
    try {
      const response = await api.post('/saas/onboarding', {
        // Dados da organização
        companyName: data.companyName,
        tradeName: data.tradeName,
        slug: data.slug,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        address: data.address,
        industry: data.industry,
        companySize: data.companySize,
        // Dados do usuário admin
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        adminPhone: data.adminPhone,
        adminPassword: data.adminPassword,
        // Configurações
        plan: data.plan || 'professional',
        country: data.country || 'PT',
        language: data.language || 'pt',
        timezone: data.timezone || 'Europe/Lisbon'
      });
      
      toast.success('Organização criada com sucesso! Verifique seu email.');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao criar organização';
      toast.error(message);
      throw error;
    }
  },

  // Verificar disponibilidade de slug
  async checkSlugAvailability(slug) {
    try {
      const response = await api.get(`/saas/check-slug/${slug}`);
      return response.data;
    } catch (error) {
      return { available: false, message: 'Erro ao verificar disponibilidade' };
    }
  },

  // Enviar email de verificação
  async sendVerificationEmail(adminEmail, adminName, companyName) {
    try {
      const response = await api.post('/saas/send-verification', {
        adminEmail,
        adminName,
        companyName
      });
      
      toast.success('Email de verificação enviado!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao enviar email';
      toast.error(message);
      throw error;
    }
  },

  // Verificar email com token
  async verifyEmail(email, token) {
    try {
      const response = await api.post('/saas/verify-email', {
        email,
        token
      });
      
      toast.success('Email verificado com sucesso!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao verificar email';
      toast.error(message);
      throw error;
    }
  },

  // Listar planos
  async getPlans() {
    try {
      const response = await api.get('/saas/plans');
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      return { success: false, plans: [] };
    }
  },

  // Login SaaS Admin
  async loginSaasAdmin(email, password) {
    try {
      const response = await api.post('/auth/saas-login', {
        email,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('saas_token', response.data.token);
        localStorage.setItem('saas_user', JSON.stringify(response.data.user));
      }
      
      toast.success('Login realizado com sucesso!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  },

  // Listar organizações (Admin SaaS)
  async getOrganizations(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      });
      
      const response = await api.get(`/organizations?${params}`);
      return response.data;
    } catch (error) {
      toast.error('Erro ao carregar organizações');
      throw error;
    }
  },

  // Estatísticas SaaS
  async getSaasStats() {
    try {
      const response = await api.get('/saas/statistics');
      return response.data;
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
      throw error;
    }
  },

  // Enviar trial request
  async requestTrial(data) {
    try {
      const response = await api.post('/trial-requests', {
        email: data.email,
        fullName: data.fullName,
        company: data.company,
        phone: data.phone,
        message: data.message,
        source: 'website'
      });
      
      toast.success('Solicitação de trial enviada! Entraremos em contato em breve.');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao enviar solicitação';
      toast.error(message);
      throw error;
    }
  },

  // Newsletter
  async subscribeNewsletter(email) {
    try {
      const response = await api.post('/newsletter/subscribe', { email });
      toast.success('Inscrição realizada com sucesso!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao inscrever no newsletter';
      toast.error(message);
      throw error;
    }
  },

  // Contato
  async sendContact(data) {
    try {
      const response = await api.post('/contact', data);
      toast.success('Mensagem enviada com sucesso! Responderemos em breve.');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao enviar mensagem';
      toast.error(message);
      throw error;
    }
  }
};

export default api;
