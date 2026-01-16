import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      organization: null,
      permissions: [],
      permissionsLoaded: false,
      
      setAuth: (user, token) => {
        const permissions = (user?.role === 'org-admin' || user?.role === 'admin') 
          ? ['*'] 
          : (user?.permissions || []);
        
        set({ 
          user, 
          token, 
          organization: user.organization,
          permissions,
          permissionsLoaded: true
        });
      },
      
      setPermissions: (permissions) => set({ 
        permissions: permissions || [],
        permissionsLoaded: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        organization: null,
        permissions: [],
        permissionsLoaded: false
      }),
      
      updateUser: (userData) => set((state) => ({ 
        user: { ...state.user, ...userData } 
      })),

      // Verificar se é admin
      isAdmin: () => {
        const { user, permissions } = get()
        return user?.role === 'org-admin' || 
               user?.role === 'admin' || 
               permissions.includes('*')
      },

      // Verificar permissão
      hasPermission: (permission) => {
        const { user, permissions } = get()
        if (!permission) return true
        
        // Admin tem todas as permissões
        if (user?.role === 'org-admin' || user?.role === 'admin' || permissions.includes('*')) {
          return true
        }
        
        // Verificar permissão exata
        if (permissions.includes(permission)) return true
        
        // Verificar wildcard de recurso
        const [resource] = permission.split('.')
        if (permissions.includes(`${resource}.*`)) return true
        
        return false
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)
