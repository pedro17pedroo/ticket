import { useState, useRef, useEffect } from 'react';
import { Building2, Users, ChevronDown, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * ContextSwitcher Component
 * 
 * Displays current context in header/navbar and allows switching between contexts
 * Used during active session to switch between organizations and client companies
 * 
 * Features:
 * - Display current context (organization or client name)
 * - Dropdown with available contexts
 * - Visual indicator for active context
 * - Handle context switch action and API call
 * - Show loading state during switch
 * - Handle errors and display user feedback
 * - Redirect to appropriate portal if switching between organization and client contexts
 */
const ContextSwitcher = () => {
  const { user, setAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch available contexts when dropdown opens
  useEffect(() => {
    if (isOpen && contexts.length === 0) {
      fetchContexts();
    }
  }, [isOpen]);

  const fetchContexts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/contexts');
      // Filter contexts: only show clients in client portal
      const allContexts = response.data.contexts || [];
      const filteredContexts = allContexts.filter(ctx => ctx.contextType === 'client');
      setContexts(filteredContexts);
    } catch (err) {
      console.error('Error fetching contexts:', err);
      setError('Erro ao carregar contextos disponíveis');
      toast.error('Erro ao carregar contextos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleContextSwitch = async (context) => {
    if (switching) return;

    // Check if it's the current context
    const isCurrent = isCurrentContext(context);
    if (isCurrent) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    setError(null);

    try {
      const response = await api.post('/auth/switch-context', {
        contextId: context.contextId,
        contextType: context.contextType
      });

      const { token: newToken, user: newUser } = response.data;

      // Update auth store with new token and user data
      setAuth(newUser, newToken);

      toast.success(`Contexto alterado para ${context.type === 'organization' ? context.organizationName : context.clientName}`);

      // Check if we need to redirect to a different portal
      const currentPortal = window.location.hostname.includes('organizacao') ? 'organization' : 'client';
      const targetPortal = context.type === 'organization' ? 'organization' : 'client';

      if (currentPortal !== targetPortal) {
        // Redirect to the appropriate portal
        const targetUrl = targetPortal === 'organization' 
          ? import.meta.env.VITE_ORGANIZATION_PORTAL_URL || 'http://localhost:5173'
          : import.meta.env.VITE_CLIENT_PORTAL_URL || 'http://localhost:5174';
        
        window.location.href = targetUrl;
      } else {
        // Same portal, just reload to refresh the UI
        window.location.reload();
      }
    } catch (err) {
      console.error('Error switching context:', err);
      const errorMessage = err.response?.data?.error || 'Erro ao trocar contexto';
      setError(errorMessage);
      toast.error(errorMessage);
      setSwitching(false);
    }
  };

  const isCurrentContext = (context) => {
    if (!user) return false;
    
    if (context.type === 'organization') {
      return user.organizationId === context.organizationId;
    } else {
      return user.clientId === context.clientId;
    }
  };

  const getCurrentContextName = () => {
    if (!user) return 'Contexto';
    
    // For organization users
    if (user.organizationId && user.organization?.name) {
      return user.organization.name;
    }
    
    // For client users
    if (user.clientId && user.client?.name) {
      return user.client.name;
    }
    
    return 'Contexto';
  };

  const getCurrentContextType = () => {
    if (!user) return null;
    return user.organizationId ? 'organization' : 'client';
  };

  // Group contexts by type
  const organizationContexts = contexts.filter(ctx => ctx.type === 'organization');
  const clientContexts = contexts.filter(ctx => ctx.type === 'client');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Context Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
          switching ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="Trocar contexto"
      >
        {getCurrentContextType() === 'organization' ? (
          <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        ) : (
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        )}
        <span className="text-sm font-medium hidden md:inline">
          {getCurrentContextName()}
        </span>
        {switching ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 max-h-96 overflow-y-auto z-50">
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Trocar Contexto
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Selecione uma organização ou empresa
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="px-4 py-3 mx-2 my-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Contexts List */}
          {!loading && !error && contexts.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum contexto adicional disponível
              </p>
            </div>
          )}

          {!loading && !error && contexts.length > 0 && (
            <div className="py-2">
              {/* Organization Contexts */}
              {organizationContexts.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Organizações
                      </span>
                    </div>
                  </div>
                  {organizationContexts.map((context) => {
                    const isCurrent = isCurrentContext(context);
                    return (
                      <button
                        key={context.id}
                        onClick={() => handleContextSwitch(context)}
                        disabled={switching || isCurrent}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          isCurrent ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                        } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isCurrent && (
                                <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {context.organizationName}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isCurrent
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {context.role}
                            </span>
                          </div>
                          {isCurrent && (
                            <span className="text-xs font-medium text-primary-600 dark:text-primary-400 whitespace-nowrap">
                              Ativo
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Client Contexts */}
              {clientContexts.length > 0 && (
                <div>
                  {organizationContexts.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  )}
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Empresas Cliente
                      </span>
                    </div>
                  </div>
                  {clientContexts.map((context) => {
                    const isCurrent = isCurrentContext(context);
                    return (
                      <button
                        key={context.id}
                        onClick={() => handleContextSwitch(context)}
                        disabled={switching || isCurrent}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isCurrent && (
                                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {context.clientName}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Cliente de: {context.organizationName}
                            </span>
                          </div>
                          {isCurrent && (
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              Ativo
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContextSwitcher;
