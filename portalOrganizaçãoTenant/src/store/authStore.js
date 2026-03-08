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
        // ✅ RBAC: Usar permissões do backend, sem fallback hardcoded
        const permissions = user?.permissions || [];
        
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

      // Verificar se é admin (baseado em permissões, não em role)
      isAdmin: () => {
        const { permissions } = get()
        // Admin é quem tem permissão de gerenciar roles
        return permissions.some(p => 
          (typeof p === 'object' && p.resource === 'settings' && p.action === 'manage_roles') ||
          (typeof p === 'string' && p === 'settings.manage_roles')
        )
      },

      // Verificar permissão (baseado em RBAC, não em role)
      hasPermission: (permission) => {
        const { permissions } = get()
        if (!permission) return true
        
        // Verificar se permissões estão carregadas
        if (!permissions || permissions.length === 0) return false
        
        // Suportar formato string "resource.action"
        if (typeof permission === 'string') {
          const [resource, action] = permission.split('.')
          
          // Verificar permissão exata no formato objeto
          const hasObjectPermission = permissions.some(p => 
            typeof p === 'object' && 
            p.resource === resource && 
            p.action === action
          )
          
          if (hasObjectPermission) return true
          
          // Verificar permissão exata no formato string
          if (permissions.includes(permission)) return true
          
          // Verificar wildcard de recurso
          if (permissions.includes(`${resource}.*`)) return true
          
          // Verificar permissão all (ex: tickets.assign_all inclui tickets.assign_team)
          const allAction = `${action}_all`
          const hasAllPermission = permissions.some(p =>
            (typeof p === 'object' && p.resource === resource && p.action === allAction) ||
            (typeof p === 'string' && p === `${resource}.${allAction}`)
          )
          
          if (hasAllPermission) return true
        }
        
        return false
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)
