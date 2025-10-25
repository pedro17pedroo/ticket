import api from './api';

// ==================== ASSETS ====================

export const getMyAssets = async (params = {}) => {
  const response = await api.get('/inventory/assets', { params });
  return response.data;
};

export const getAssetById = async (id) => {
  const response = await api.get(`/inventory/assets/${id}`);
  return response.data;
};

// ==================== SOFTWARE ====================

export const getAssetSoftware = async (assetId) => {
  const response = await api.get('/inventory/software', { 
    params: { assetId } 
  });
  return response.data;
};

// ==================== LICENSES ====================

export const getMyLicenses = async () => {
  const response = await api.get('/inventory/licenses');
  return response.data;
};

// ==================== STATISTICS ====================

export const getMyStatistics = async () => {
  const response = await api.get('/inventory/statistics');
  return response.data;
};

export default {
  getMyAssets,
  getAssetById,
  getAssetSoftware,
  getMyLicenses,
  getMyStatistics
};
