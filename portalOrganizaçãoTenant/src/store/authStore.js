import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      organization: null,
      
      setAuth: (user, token) => set({ user, token, organization: user.organization }),
      
      logout: () => set({ user: null, token: null, organization: null }),
      
      updateUser: (userData) => set((state) => ({ 
        user: { ...state.user, ...userData } 
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
)
