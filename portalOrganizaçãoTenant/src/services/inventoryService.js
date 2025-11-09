import api from './api';

// ==================== ASSETS ====================

export const getAssets = async (params = {}) => {
  const response = await api.get('/inventory/assets', { params });
  return response.data;
};

export const getAssetById = async (id) => {
  const response = await api.get(`/inventory/assets/${id}`);
  return response.data;
};

export const createAsset = async (data) => {
  const response = await api.post('/inventory/assets', data);
  return response.data;
};

export const updateAsset = async (id, data) => {
  const response = await api.put(`/inventory/assets/${id}`, data);
  return response.data;
};

export const deleteAsset = async (id) => {
  const response = await api.delete(`/inventory/assets/${id}`);
  return response.data;
};

// ==================== SOFTWARE ====================

export const getSoftware = async (params = {}) => {
  const response = await api.get('/inventory/software', { params });
  return response.data;
};

export const addSoftware = async (data) => {
  const response = await api.post('/inventory/software', data);
  return response.data;
};

export const deleteSoftware = async (id) => {
  const response = await api.delete(`/inventory/software/${id}`);
  return response.data;
};

// ==================== LICENSES ====================

export const getLicenses = async (params = {}) => {
  const response = await api.get('/inventory/licenses', { params });
  return response.data;
};

export const getLicenseById = async (id) => {
  const response = await api.get(`/inventory/licenses/${id}`);
  return response.data;
};

export const createLicense = async (data) => {
  const response = await api.post('/inventory/licenses', data);
  return response.data;
};

export const updateLicense = async (id, data) => {
  const response = await api.put(`/inventory/licenses/${id}`, data);
  return response.data;
};

export const deleteLicense = async (id) => {
  const response = await api.delete(`/inventory/licenses/${id}`);
  return response.data;
};

export const assignLicense = async (id, assetId) => {
  const response = await api.post(`/inventory/licenses/${id}/assign`, { assetId });
  return response.data;
};

export const unassignLicense = async (id, assetId) => {
  const response = await api.post(`/inventory/licenses/${id}/unassign`, { assetId });
  return response.data;
};

// ==================== STATISTICS ====================

export const getStatistics = async (params = {}) => {
  const response = await api.get('/inventory/statistics', { params });
  return response.data;
};

// ==================== ORGANIZATION INVENTORY ====================

export const getOrganizationUsers = async () => {
  const response = await api.get('/inventory/organization/users');
  return response.data;
};

export const getOrganizationInventoryStats = async () => {
  const response = await api.get('/inventory/organization/statistics');
  return response.data;
};

export const getUserInventory = async (userId) => {
  const response = await api.get(`/inventory/users/${userId}`);
  return response.data;
};

// ==================== CLIENTS INVENTORY ====================

export const getClientsWithInventory = async () => {
  const response = await api.get('/inventory/clients');
  return response.data;
};

export const getClientsInventoryStats = async () => {
  const response = await api.get('/inventory/clients/statistics');
  return response.data;
};

export const getClientInventory = async (clientId) => {
  const response = await api.get(`/inventory/clients/${clientId}`);
  return response.data;
};

export const getClientUserInventory = async (clientId, userId) => {
  const response = await api.get(`/inventory/clients/${clientId}/users/${userId}`);
  return response.data;
};

export default {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getSoftware,
  addSoftware,
  deleteSoftware,
  getLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  deleteLicense,
  assignLicense,
  unassignLicense,
  getStatistics,
  // Organization
  getOrganizationUsers,
  getOrganizationInventoryStats,
  getUserInventory,
  // Clients
  getClientsWithInventory,
  getClientsInventoryStats,
  getClientInventory,
  getClientUserInventory
};
