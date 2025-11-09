import api from './api'

// DIRECTIONS
export const getDirections = () => api.get('/client/directions')
export const createDirection = (data) => api.post('/client/directions', data)
export const updateDirection = (id, data) => api.put(`/client/directions/${id}`, data)
export const deleteDirection = (id) => api.delete(`/client/directions/${id}`)

// DEPARTMENTS
export const getDepartments = () => api.get('/client/departments')
export const createDepartment = (data) => api.post('/client/departments', data)
export const updateDepartment = (id, data) => api.put(`/client/departments/${id}`, data)
export const deleteDepartment = (id) => api.delete(`/client/departments/${id}`)

// SECTIONS
export const getSections = () => api.get('/client/sections')
export const createSection = (data) => api.post('/client/sections', data)
export const updateSection = (id, data) => api.put(`/client/sections/${id}`, data)
export const deleteSection = (id) => api.delete(`/client/sections/${id}`)

// USERS
export const getClientUsers = () => api.get('/client/users')
export const createClientUser = (data) => api.post('/client/users', data)
export const updateClientUser = (id, data) => api.put(`/client/users/${id}`, data)
export const deleteClientUser = (id) => api.delete(`/client/users/${id}`)

export default {
  getDirections,
  createDirection,
  updateDirection,
  deleteDirection,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getClientUsers,
  createClientUser,
  updateClientUser,
  deleteClientUser
}
