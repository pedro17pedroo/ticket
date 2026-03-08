import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4003/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Landing Page Config
export const getLandingPageConfig = async () => {
  try {
    const response = await api.get('/landing-page/config');
    return response.data.config;
  } catch (error) {
    console.error('Erro ao carregar configuração da landing page:', error);
    return null;
  }
};

// Obter planos públicos (para landing page)
export const getPublicPlans = async () => {
  try {
    const response = await api.get('/plans/public');
    return response.data.plans || [];
  } catch (error) {
    console.error('Erro ao carregar planos:', error);
    return null;
  }
};

// SaaS API - Onboarding
export const saasAPI = {
  // Verificar disponibilidade do slug
  checkSlugAvailability: async (slug) => {
    const response = await api.get(`/saas/check-slug/${slug}`);
    return response.data;
  },

  // Enviar email de verificação
  sendVerificationEmail: async (email, name, companyName) => {
    const response = await api.post('/saas/send-verification', {
      adminEmail: email,
      adminName: name,
      companyName
    });
    return response;
  },

  // Verificar código do email
  verifyEmail: async (email, code) => {
    const response = await api.post('/saas/verify-email', {
      email,
      token: code
    });
    return response.data;
  },

  // Criar organização
  createOrganization: async (data) => {
    const response = await api.post('/saas/onboarding', data);
    return response;
  },

  // Obter planos disponíveis (usa o endpoint público)
  getPlans: async () => {
    // Adicionar timestamp para evitar cache
    const timestamp = new Date().getTime();
    const response = await api.get(`/plans/public?_t=${timestamp}`);
    return response.data;
  }
};

// Payment API
export const paymentAPI = {
  // Criar pagamento
  createPayment: async (data) => {
    const response = await api.post('/payments/create', data);
    return response.data;
  },

  // Verificar status do pagamento
  checkPaymentStatus: async (transactionId) => {
    const response = await api.get(`/payments/${transactionId}/status`);
    return response.data;
  },

  // Obter histórico de pagamentos
  getPaymentHistory: async (filters = {}) => {
    const response = await api.get('/payments/history', { params: filters });
    return response.data;
  },

  // Obter recibo
  getReceipt: async (transactionId) => {
    const response = await api.get(`/payments/${transactionId}/receipt`);
    return response.data;
  },

  // Calcular valor de upgrade
  calculateUpgrade: async (newPlanId) => {
    const response = await api.post('/payments/calculate-upgrade', { newPlanId });
    return response.data;
  }
};

