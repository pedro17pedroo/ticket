import api from './api';

const rbacService = {
  // Roles
  async getRoles() {
    const response = await api.get('/rbac/roles');
    return response.data;
  },

  async getRoleById(id) {
    const response = await api.get(`/rbac/roles/${id}`);
    return response.data;
  },

  async createRole(data) {
    const response = await api.post('/rbac/roles', data);
    return response.data;
  },

  async updateRole(id, data) {
    const response = await api.put(`/rbac/roles/${id}`, data);
    return response.data;
  },

  async deleteRole(id) {
    const response = await api.delete(`/rbac/roles/${id}`);
    return response.data;
  },

  // Permissions
  async getPermissions() {
    const response = await api.get('/rbac/permissions');
    return response.data;
  },

  // User Permissions
  async getUserPermissions(userId) {
    const response = await api.get(`/rbac/users/${userId}/permissions`);
    return response.data;
  },

  async grantUserPermission(userId, permissionId) {
    const response = await api.post(`/rbac/users/${userId}/permissions`, { permissionId });
    return response.data;
  },

  async revokeUserPermission(userId, permissionId) {
    const response = await api.delete(`/rbac/users/${userId}/permissions/${permissionId}`);
    return response.data;
  },

  // Statistics
  async getStatistics() {
    const response = await api.get('/rbac/statistics');
    return response.data;
  }
};

export default rbacService;
