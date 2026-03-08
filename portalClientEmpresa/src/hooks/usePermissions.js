import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook para verificar permissões do utilizador
 * 
 * @returns {Object} Objeto com funções de verificação de permissões
 * 
 * @example
 * const { can, canAny, canAll, hasRole } = usePermissions();
 * 
 * // Verificar permissão específica
 * if (can('tickets', 'create')) {
 *   // Mostrar botão criar ticket
 * }
 * 
 * // Verificar qualquer permissão (OR)
 * if (canAny([['tickets', 'update'], ['tickets', 'delete']])) {
 *   // Mostrar opções de gestão
 * }
 * 
 * // Verificar todas as permissões (AND)
 * if (canAll([['tickets', 'update'], ['comments', 'create']])) {
 *   // Permitir ação complexa
 * }
 * 
 * // Verificar role
 * if (hasRole('admin-org')) {
 *   // Funcionalidade apenas para admin
 * }
 */
export const usePermissions = () => {
  const { user } = useAuthStore();

  /**
   * Verificar se tem uma permissão específica
   * @param {string} resource - Recurso (ex: 'tickets')
   * @param {string} action - Ação (ex: 'create')
   * @returns {boolean}
   */
  const can = useMemo(() => {
    return (resource, action) => {
      if (!user) return false;
      
      // Verificar nas permissões
      if (!user.permissions || !Array.isArray(user.permissions)) {
        return false;
      }
      
      return user.permissions.some(p => 
        p.resource === resource && p.action === action
      );
    };
  }, [user]);

  /**
   * Verificar se tem pelo menos uma das permissões (OR)
   * @param {Array<[string, string]>} permissions - Array de [resource, action]
   * @returns {boolean}
   */
  const canAny = useMemo(() => {
    return (permissions) => {
      if (!user) return false;
      
      return permissions.some(([resource, action]) => can(resource, action));
    };
  }, [user, can]);

  /**
   * Verificar se tem todas as permissões (AND)
   * @param {Array<[string, string]>} permissions - Array de [resource, action]
   * @returns {boolean}
   */
  const canAll = useMemo(() => {
    return (permissions) => {
      if (!user) return false;
      
      return permissions.every(([resource, action]) => can(resource, action));
    };
  }, [user, can]);

  /**
   * Verificar se tem um role específico
   * @param {...string} roles - Roles a verificar
   * @returns {boolean}
   */
  const hasRole = useMemo(() => {
    return (...roles) => {
      if (!user) return false;
      return roles.includes(user.role);
    };
  }, [user]);

  /**
   * Verificar se está no nível hierárquico
   * @param {...string} levels - Níveis: 'organization', 'client', 'user'
   * @returns {boolean}
   */
  const isLevel = useMemo(() => {
    return (...levels) => {
      if (!user) return false;
      
      const roleLevelMap = {
        'admin-org': 'organization',
        'gerente': 'organization',
        'supervisor': 'organization',
        'agente': 'organization',
        'client-admin': 'client',
        'client-manager': 'client',
        'client-user': 'user',
        'client-viewer': 'user'
      };
      
      const userLevel = roleLevelMap[user.role] || 'user';
      return levels.includes(userLevel);
    };
  }, [user]);

  /**
   * Obter todas as permissões do utilizador
   * @returns {Array<{resource: string, action: string}>}
   */
  const getPermissions = useMemo(() => {
    return () => {
      if (!user || !user.permissions) return [];
      return user.permissions.map(p => ({
        resource: p.resource,
        action: p.action,
        displayName: p.displayName || `${p.resource}.${p.action}`,
        scope: p.scope
      }));
    };
  }, [user]);

  /**
   * Verificar se é admin (baseado em permissões)
   * @returns {boolean}
   */
  const isAdmin = useMemo(() => {
    // Admin é quem tem permissão de gerenciar configurações do sistema
    return can('settings', 'update') || can('users', 'delete');
  }, [can]);

  /**
   * Verificar se é cliente admin (baseado em permissões)
   * @returns {boolean}
   */
  const isClientAdmin = useMemo(() => {
    // Cliente admin é quem tem permissão de gerenciar usuários do cliente
    return can('client_users', 'create') || can('client_users', 'delete');
  }, [can]);

  /**
   * Verificar se pode acessar configurações
   * @returns {boolean}
   */
  const canAccessSettings = useMemo(() => {
    return can('settings', 'view') || can('settings', 'update');
  }, [can]);

  return {
    can,
    canAny,
    canAll,
    hasRole,
    isLevel,
    getPermissions,
    isAdmin,
    isClientAdmin,
    canAccessSettings,
    user
  };
};

export default usePermissions;
