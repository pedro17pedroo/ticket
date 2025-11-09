import api from './api';

export const tenantService = {
  async getTenants(params = {}) {
    try {
      const { data } = await api.get('/provider/tenants', { params });
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getTenantById(id) {
    try {
      const { data } = await api.get(`/provider/tenants/${id}`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createTenant(tenantData) {
    try {
      const { data } = await api.post('/provider/tenants', tenantData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateTenant(id, tenantData) {
    try {
      const { data } = await api.put(`/provider/tenants/${id}`, tenantData);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async suspendTenant(id, reason) {
    try {
      const { data } = await api.put(`/provider/tenants/${id}/suspend`, { reason });
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async activateTenant(id) {
    try {
      const { data } = await api.put(`/provider/tenants/${id}/activate`);
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getStats() {
    try {
      const { data } = await api.get('/provider/stats');
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
