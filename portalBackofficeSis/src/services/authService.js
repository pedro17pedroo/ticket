import api from './api';

export const authService = {
  async loginProvider(email, password) {
    // Modo PRODUÇÃO - Usar backend real
    try {
      const { data } = await api.post('/auth/login', { email, password, portalType: 'provider' });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getProfile() {
    try {
      const { data } = await api.get('/auth/profile');
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  isSuperAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'super-admin';
  },

  isProviderAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'provider-admin' || user?.role === 'super-admin';
  }
};
