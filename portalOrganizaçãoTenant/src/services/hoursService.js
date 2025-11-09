import api from './api';

// ==================== HOURS BANK ====================

export const getHoursBanks = async (params = {}) => {
  const response = await api.get('/hours-bank', { params });
  return response.data;
};

export const getHoursBankById = async (id) => {
  const response = await api.get(`/hours-bank/${id}`);
  return response.data;
};

export const createHoursBank = async (data) => {
  const response = await api.post('/hours-bank', data);
  return response.data;
};

export const updateHoursBank = async (id, data) => {
  const response = await api.put(`/hours-bank/${id}`, data);
  return response.data;
};

export const deleteHoursBank = async (id) => {
  const response = await api.delete(`/hours-bank/${id}`);
  return response.data;
};

// ==================== HOURS TRANSACTIONS ====================

export const getHoursTransactions = async (params = {}) => {
  const response = await api.get('/hours-bank/transactions', { params });
  return response.data;
};

export const createHoursTransaction = async (data) => {
  const response = await api.post('/hours-bank/transactions', data);
  return response.data;
};

export const updateHoursTransaction = async (id, data) => {
  const response = await api.put(`/hours-bank/transactions/${id}`, data);
  return response.data;
};

export const deleteHoursTransaction = async (id) => {
  const response = await api.delete(`/hours-bank/transactions/${id}`);
  return response.data;
};

// ==================== STATISTICS ====================

export const getStatistics = async (params = {}) => {
  const response = await api.get('/hours-bank/statistics', { params });
  return response.data;
};

export const getClientStatistics = async (clientId, params = {}) => {
  const response = await api.get(`/hours-bank/clients/${clientId}/statistics`, { params });
  return response.data;
};

export const getTransactionsByType = async (params = {}) => {
  const response = await api.get('/hours-bank/transactions/by-type', { params });
  return response.data;
};

export const getHoursUtilization = async (params = {}) => {
  const response = await api.get('/hours-bank/utilization', { params });
  return response.data;
};

// ==================== REPORTS ====================

export const generateHoursReport = async (params = {}) => {
  const response = await api.get('/hours-bank/reports', { params });
  return response.data;
};

export const exportHoursReport = async (params = {}) => {
  const response = await api.get('/hours-bank/reports/export', { 
    params,
    responseType: 'blob'
  });
  return response.data;
};

export default {
  // Hours Banks
  getHoursBanks,
  getHoursBankById,
  createHoursBank,
  updateHoursBank,
  deleteHoursBank,
  
  // Transactions
  getHoursTransactions,
  createHoursTransaction,
  updateHoursTransaction,
  deleteHoursTransaction,
  
  // Statistics
  getStatistics,
  getClientStatistics,
  getTransactionsByType,
  getHoursUtilization,
  
  // Reports
  generateHoursReport,
  exportHoursReport
};