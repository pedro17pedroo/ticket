import api from './api';

const rbacService = {
  // ==================== ROLES ====================
  
  /**
   * Listar todos os roles
   */
  async getRoles() {
    const response = await api.get('/rbac/roles');
    return response.data;
  },

  /**
   * Obter role por ID
   */
  async getRoleById(id) {
    const response = await api.get(`/rbac/roles/${id}`);
    return response.data;
  },

  /**
   * Criar role customizado
   */
  async createRole(roleData) {
    const response = await api.post('/rbac/roles', roleData);
    return response.data;
  },

  /**
   * Atualizar role
   */
  async updateRole(id, roleData) {
    const response = await api.put(`/rbac/roles/${id}`, roleData);
    return response.data;
  },

  /**
   * Eliminar role
   */
  async deleteRole(id) {
    const response = await api.delete(`/rbac/roles/${id}`);
    return response.data;
  },

  // ==================== PERMISSIONS ====================
  
  /**
   * Listar todas as permissões
   */
  async getPermissions(category = null) {
    const params = category ? { category } : {};
    const response = await api.get('/rbac/permissions', { params });
    return response.data;
  },

  // ==================== USER PERMISSIONS ====================
  
  /**
   * Obter permissões de um utilizador
   */
  async getUserPermissions(userId) {
    const response = await api.get(`/rbac/users/${userId}/permissions`);
    return response.data;
  },

  /**
   * Conceder permissão específica a um utilizador
   */
  async grantUserPermission(userId, permissionData) {
    const response = await api.post(`/rbac/users/${userId}/permissions`, permissionData);
    return response.data;
  },

  /**
   * Revogar permissão de um utilizador
   */
  async revokeUserPermission(userId, permissionId) {
    const response = await api.delete(`/rbac/users/${userId}/permissions/${permissionId}`);
    return response.data;
  },

  // ==================== STATISTICS ====================
  
  /**
   * Obter estatísticas do sistema RBAC
   */
  async getStatistics() {
    const response = await api.get('/rbac/statistics');
    return response.data;
  }
};

export default rbacService;
