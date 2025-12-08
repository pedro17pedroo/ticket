import { create } from 'zustand';
import userService from '../services/userService';

const useUserStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  loading: false,
  error: null,

  // Fetch all users
  fetchUsers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await userService.getAll(params);
      set({ users: data.users || [], loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch single user
  fetchUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await userService.getById(id);
      set({ selectedUser: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Create user
  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await userService.create(userData);
      set((state) => ({
        users: [...state.users, data],
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    set({ loading: true, error: null });
    try {
      const data = await userService.update(id, userData);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? data : user
        ),
        selectedUser: state.selectedUser?.id === id ? data : state.selectedUser,
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await userService.delete(id);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Activate user
  activateUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await userService.activate(id);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? { ...user, isActive: true } : user
        ),
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Deactivate user
  deactivateUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await userService.deactivate(id);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? { ...user, isActive: false } : user
        ),
        loading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear selected user
  clearSelectedUser: () => {
    set({ selectedUser: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default useUserStore;
