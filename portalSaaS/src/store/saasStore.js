import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Store principal do SaaS
const useSaasStore = create(
  persist(
    (set, get) => ({
      // Estado de autenticação
      isAuthenticated: false,
      user: null,
      token: null,

      // Estado do onboarding
      onboardingStep: 0,
      onboardingData: {},

      // Estado das organizações
      organizations: [],
      organizationsLoading: false,
      organizationsPagination: {},

      // Estado das estatísticas
      stats: null,
      statsLoading: false,

      // Estados de loading
      loading: false,
      error: null,

      // Actions de autenticação
      setAuth: (user, token) => {
        set({
          isAuthenticated: true,
          user,
          token,
          error: null
        });
      },

      logout: () => {
        localStorage.removeItem('saas_token');
        localStorage.removeItem('saas_user');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          onboardingData: {},
          onboardingStep: 0
        });
      },

      // Actions do onboarding
      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },

      updateOnboardingData: (data) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data }
        }));
      },

      nextOnboardingStep: () => {
        set((state) => ({
          onboardingStep: state.onboardingStep + 1
        }));
      },

      previousOnboardingStep: () => {
        set((state) => ({
          onboardingStep: Math.max(0, state.onboardingStep - 1)
        }));
      },

      resetOnboarding: () => {
        set({
          onboardingStep: 0,
          onboardingData: {}
        });
      },

      // Actions das organizações
      setOrganizations: (organizations, pagination) => {
        set({
          organizations,
          organizationsPagination: pagination,
          organizationsLoading: false
        });
      },

      setOrganizationsLoading: (loading) => {
        set({ organizationsLoading: loading });
      },

      // Actions das estatísticas
      setStats: (stats) => {
        set({ stats, statsLoading: false });
      },

      setStatsLoading: (loading) => {
        set({ statsLoading: loading });
      },

      // Actions gerais
      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Inicializar estado do localStorage
      initFromStorage: () => {
        const token = localStorage.getItem('saas_token');
        const userStr = localStorage.getItem('saas_user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              isAuthenticated: true,
              user,
              token
            });
          } catch (error) {
            console.error('Erro ao parsear usuário do localStorage:', error);
            localStorage.removeItem('saas_token');
            localStorage.removeItem('saas_user');
          }
        }
      }
    }),
    {
      name: 'tatuticket-saas-store',
      partialize: (state) => ({
        // Persistir apenas dados essenciais
        onboardingStep: state.onboardingStep,
        onboardingData: state.onboardingData
      }),
    }
  )
);

// Store para dados temporários/cache
export const useTempStore = create((set, get) => ({
  // Cache de validações
  slugValidations: {},
  
  // Estados de formulários
  forms: {},

  // Cache de dados
  cache: {},

  // Actions
  setSlugValidation: (slug, result) => {
    set((state) => ({
      slugValidations: {
        ...state.slugValidations,
        [slug]: result
      }
    }));
  },

  getSlugValidation: (slug) => {
    return get().slugValidations[slug];
  },

  setFormData: (formId, data) => {
    set((state) => ({
      forms: {
        ...state.forms,
        [formId]: data
      }
    }));
  },

  getFormData: (formId) => {
    return get().forms[formId] || {};
  },

  setCache: (key, data, ttl = 300000) => { // TTL padrão: 5 minutos
    const expiry = Date.now() + ttl;
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: { data, expiry }
      }
    }));
  },

  getCache: (key) => {
    const cached = get().cache[key];
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      // Cache expirado
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return { cache: newCache };
      });
      return null;
    }
    
    return cached.data;
  },

  clearCache: () => {
    set({ cache: {} });
  }
}));

export default useSaasStore;
