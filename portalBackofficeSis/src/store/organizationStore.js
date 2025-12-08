import { create } from 'zustand';
import organizationService from '../services/organizationService';

const useOrganizationStore = create((set, get) => ({
  organizations: [],
  selectedOrganization: null,
  loading: false,
  error: null,

  // Fetch all organizations
  fetchOrganizations: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await organizationService.getAll(params);
      set({ organizations: data.organizations || [], loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch single organization
  fetchOrganization: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await organizationService.getById(id);
      set({ selectedOrganization: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create organization
  createOrganization: async (organizationData) => {
    set({ loading: true, error: null });
    try {
      const data = await organizationService.create(organizationData);
      set((state) => ({
        organizations: [...state.organizations, data],
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update organization
  updateOrganization: async (id, organizationData) => {
    set({ loading: true, error: null });
    try {
      const data = await organizationService.update(id, organizationData);
      set((state) => ({
        organizations: state.organizations.map((org) =>
          org.id === id ? data : org
        ),
        selectedOrganization: state.selectedOrganization?.id === id ? data : state.selectedOrganization,
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete organization
  deleteOrganization: async (id) => {
    set({ loading: true, error: null });
    try {
      await organizationService.delete(id);
      set((state) => ({
        organizations: state.organizations.filter((org) => org.id !== id),
        selectedOrganization: state.selectedOrganization?.id === id ? null : state.selectedOrganization,
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Suspend organization
  suspendOrganization: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const data = await organizationService.suspend(id, reason);
      set((state) => ({
        organizations: state.organizations.map((org) =>
          org.id === id ? { ...org, isActive: false } : org
        ),
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Activate organization
  activateOrganization: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await organizationService.activate(id);
      set((state) => ({
        organizations: state.organizations.map((org) =>
          org.id === id ? { ...org, isActive: true } : org
        ),
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear selected organization
  clearSelectedOrganization: () => {
    set({ selectedOrganization: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default useOrganizationStore;
