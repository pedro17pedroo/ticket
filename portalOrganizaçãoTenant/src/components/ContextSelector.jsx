import { Building2, Users, CheckCircle2, Clock } from 'lucide-react';

/**
 * ContextSelector Component
 * 
 * Displays available contexts (Organizations and Clients) for user selection
 * Used during login when multiple contexts are available
 * 
 * @param {Array} contexts - Array of available contexts
 * @param {Function} onSelect - Callback when a context is selected
 * @param {Boolean} loading - Loading state
 */
const ContextSelector = ({ contexts = [], onSelect, loading = false }) => {
  // Group contexts by type
  const organizationContexts = contexts.filter(ctx => ctx.type === 'organization');
  const clientContexts = contexts.filter(ctx => ctx.type === 'client');

  const handleSelectContext = (context) => {
    if (!loading && onSelect) {
      onSelect(context);
    }
  };

  const formatLastAccessed = (date) => {
    if (!date) return null;
    const lastAccessed = new Date(date);
    const now = new Date();
    const diffMs = now - lastAccessed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return lastAccessed.toLocaleDateString('pt-BR');
  };

  if (contexts.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum contexto disponível
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Selecione um Contexto
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Você tem acesso a múltiplas organizações e empresas
        </p>
      </div>

      {/* Organization Contexts */}
      {organizationContexts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Organizações
            </h3>
          </div>
          <div className="space-y-2">
            {organizationContexts.map((context) => (
              <button
                key={context.id}
                type="button"
                onClick={() => handleSelectContext(context)}
                disabled={loading}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  context.isLastUsed
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-gray-800'
                } ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {context.isLastUsed && (
                        <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white truncate">
                        {context.organizationName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        context.isLastUsed
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {context.role}
                      </span>
                      {context.isLastUsed && context.lastAccessedAt && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {formatLastAccessed(context.lastAccessedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {context.isLastUsed && (
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                      Último usado
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Client Contexts */}
      {clientContexts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Empresas Cliente
            </h3>
          </div>
          <div className="space-y-2">
            {clientContexts.map((context) => (
              <button
                key={context.id}
                type="button"
                onClick={() => handleSelectContext(context)}
                disabled={loading}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  context.isLastUsed
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
                } ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {context.isLastUsed && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white truncate">
                        {context.clientName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Cliente de: {context.organizationName}
                      </span>
                      {context.isLastUsed && context.lastAccessedAt && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {formatLastAccessed(context.lastAccessedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {context.isLastUsed && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      Último usado
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default ContextSelector;
