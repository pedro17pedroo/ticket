import api from './api'

const rbacService = {
  // Roles
  async getRoles() {
    const response = await api.get('/rbac/roles')
    return response.data
  },

  async getRoleById(id) {
    const response = await api.get(`/rbac/roles/${id}`)
    return response.data
  },

  async createRole(data) {
    const response = await api.post('/rbac/roles', data)
    return response.data
  },

  async updateRole(id, data) {
    const response = await api.put(`/rbac/roles/${id}`, data)
    return response.data
  },

  async deleteRole(id) {
    const response = await api.delete(`/rbac/roles/${id}`)
    return response.data
  },

  // Permissions
  async getPermissions() {
    const response = await api.get('/rbac/permissions')
    return response.data
  },

  async getPermissionById(id) {
    const response = await api.get(`/rbac/permissions/${id}`)
    return response.data
  },

  async createPermission(data) {
    const response = await api.post('/rbac/permissions', data)
    return response.data
  },

  async updatePermission(id, data) {
    const response = await api.put(`/rbac/permissions/${id}`, data)
    return response.data
  },

  async deletePermission(id) {
    const response = await api.delete(`/rbac/permissions/${id}`)
    return response.data
  },

  // Role Permissions
  async assignPermissionToRole(roleId, permissionId, granted = true) {
    const response = await api.post(`/rbac/roles/${roleId}/permissions`, {
      permissionId,
      granted
    })
    return response.data
  },

  async removePermissionFromRole(roleId, permissionId) {
    const response = await api.delete(`/rbac/roles/${roleId}/permissions/${permissionId}`)
    return response.data
  },

  async getRolePermissions(roleId) {
    const response = await api.get(`/rbac/roles/${roleId}/permissions`)
    return response.data
  },

  // User Roles
  async assignRoleToUser(userId, roleId) {
    const response = await api.post(`/rbac/users/${userId}/roles`, {
      roleId
    })
    return response.data
  },

  async removeRoleFromUser(userId, roleId) {
    const response = await api.delete(`/rbac/users/${userId}/roles/${roleId}`)
    return response.data
  },

  async getUserRoles(userId) {
    const response = await api.get(`/rbac/users/${userId}/roles`)
    return response.data
  },

  // Check Permissions
  async checkPermission(resource, action) {
    const response = await api.post('/rbac/check-permission', {
      resource,
      action
    })
    return response.data
  },

  async checkBulkPermissions(checks) {
    const response = await api.post('/rbac/check-permissions', {
      checks
    })
    return response.data
  }
}

export default rbacService
