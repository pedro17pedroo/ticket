import { useAuthStore } from '../store/authStore'
import { useMemo, useCallback } from 'react'

/**
 * Permissões padrão por perfil (fallback quando RBAC não está configurado)
 */
const DEFAULT_ROLE_PERMISSIONS = {
  // Administrador - todas as permissões
  'org-admin': ['*'],
  'admin': ['*'],
  'super-admin': ['*'],
  'provider-admin': ['*'],
  'client-admin': ['*'],
  
  // Gestor - quase todas as permissões exceto configurações de sistema
  'org-manager': [
    'dashboard.view',
    'tickets.*',
    'comments.*',
    'clients.*',
    'users.view', 'users.create', 'users.update', 'users.reset_password',
    'client_users.*',
    'directions.*',
    'departments.*',
    'sections.*',
    'catalog.*',
    'assets.*',
    'knowledge.*',
    'hours_bank.*',
    'reports.*',
    'settings.view',
    'tags.view',
    'templates.view',
    'desktop_agent.view',
    'projects.*',
    'project_tasks.*',
    'project_stakeholders.*',
  ],
  // Alias legado
  'gerente': [
    'dashboard.view',
    'tickets.*',
    'comments.*',
    'clients.*',
    'users.view', 'users.update', 'users.reset_password',
    'directions.*',
    'departments.*',
    'sections.*',
    'catalog.*',
    'assets.*',
    'knowledge.*',
    'hours_bank.*',
    'reports.*',
    'settings.view',
    'tags.view',
    'templates.view',
    'desktop_agent.view',
    'projects.*',
    'project_tasks.*',
    'project_stakeholders.*',
  ],
  
  // Supervisor
  'supervisor': [
    'dashboard.view',
    'tickets.*',
    'comments.*',
    'users.view',
    'clients.view',
    'directions.view',
    'departments.view',
    'sections.view',
    'catalog.view',
    'assets.view',
    'knowledge.view', 'knowledge.create', 'knowledge.update',
    'hours_bank.view',
    'reports.view',
    'tags.view',
    'templates.view',
    'desktop_agent.view',
    'projects.view', 'projects.create', 'projects.update',
    'project_tasks.view', 'project_tasks.create', 'project_tasks.update',
    'project_stakeholders.manage',
  ],
  
  // Agente - permissões operacionais
  'agent': [
    'dashboard.view',
    'tickets.view', 'tickets.create', 'tickets.update', 'tickets.assign', 'tickets.close',
    'comments.create', 'comments.create_internal', 'comments.view',
    'clients.view',
    'users.view',
    'directions.view',
    'departments.view',
    'sections.view',
    'catalog.view',
    'assets.view',
    'knowledge.view', 'knowledge.create', 'knowledge.update',
    'hours_bank.view', 'hours_bank.consume',
    'reports.view',
    'tags.view',
    'templates.view',
    'desktop_agent.view',
    'projects.view',
    'project_tasks.view', 'project_tasks.update',
  ],
  // Alias legado
  'agente': [
    'dashboard.view',
    'tickets.view', 'tickets.update', 'tickets.assign', 'tickets.close',
    'comments.create', 'comments.create_internal', 'comments.view',
    'clients.view',
    'users.view',
    'directions.view',
    'departments.view',
    'sections.view',
    'catalog.view',
    'assets.view',
    'knowledge.view',
    'hours_bank.view', 'hours_bank.consume',
    'tags.view',
    'templates.view',
    'desktop_agent.view',
    'projects.view',
    'project_tasks.view', 'project_tasks.update',
  ],
  
  // Técnico - permissões técnicas
  'technician': [
    'dashboard.view',
    'tickets.view', 'tickets.update',
    'comments.create', 'comments.view',
    'clients.view',
    'users.view',
    'directions.view',
    'departments.view',
    'sections.view',
    'catalog.view',
    'assets.*',
    'knowledge.view', 'knowledge.create',
    'hours_bank.view', 'hours_bank.consume',
    'tags.view',
    'templates.view',
    'desktop_agent.view',
    'projects.view',
    'project_tasks.view', 'project_tasks.update',
  ],
  
  // Cliente Admin
  'client-manager': [
    'dashboard.view',
    'tickets.view', 'tickets.create', 'tickets.update',
    'comments.create', 'comments.view',
    'client_users.view', 'client_users.create', 'client_users.update',
    'directions.view',
    'departments.view',
    'sections.view',
    'catalog.view',
    'assets.view',
    'knowledge.view',
    'hours_bank.view',
    'reports.view',
  ],
  
  // Cliente User
  'client-user': [
    'dashboard.view',
    'tickets.view', 'tickets.create', 'tickets.update',
    'comments.create', 'comments.view',
    'catalog.view',
    'assets.view',
    'knowledge.view',
    'hours_bank.view',
  ],
}

/**
 * Mapear permissões do backend para o formato do frontend
 * Backend: { resource: 'tickets', action: 'read' } ou 'tickets.read'
 * Frontend: 'tickets.view'
 */
const mapBackendPermission = (perm) => {
  // Se for objeto, converter para string
  if (typeof perm === 'object' && perm.resource && perm.action) {
    const action = perm.action === 'read' ? 'view' : 
                   perm.action === 'read_all' ? 'view' :
                   perm.action;
    return `${perm.resource}.${action}`;
  }
  
  // Se for string, mapear ações
  if (typeof perm === 'string') {
    return perm
      .replace('.read_all', '.view')
      .replace('.read', '.view');
  }
  
  return perm;
}

/**
 * Mapeamento de permissões do frontend para o backend
 * Usado para verificar permissões que têm nomes diferentes
 */
const PERMISSION_ALIASES = {
  // Inventário usa 'assets' no backend
  'inventory.view': ['assets.view', 'assets.read', 'assets.read_all'],
  'inventory.create': ['assets.create'],
  'inventory.update': ['assets.update'],
  'inventory.delete': ['assets.delete'],
  
  // Licenças também usa 'assets'
  'licenses.view': ['assets.view', 'assets.read', 'assets.read_all'],
  'licenses.create': ['assets.create'],
  'licenses.update': ['assets.update'],
  
  // Dashboard - todos podem ver (permissão implícita)
  'dashboard.view': ['dashboard.view'],
  
  // Tags e Templates - permissões específicas
  'tags.view': ['tags.view', 'tags.read'],
  'tags.create': ['tags.create'],
  'tags.update': ['tags.update'],
  'tags.delete': ['tags.delete'],
  
  'templates.view': ['templates.view', 'templates.read'],
  'templates.create': ['templates.create'],
  'templates.update': ['templates.update'],
  'templates.delete': ['templates.delete'],
  
  // Desktop Agent - permissão específica
  'desktop_agent.view': ['desktop_agent.view', 'desktop_agent.read'],
  'desktop_agent.manage': ['desktop_agent.manage'],
  
  // Clientes - mapear view para read
  'clients.view': ['clients.read', 'clients.read_all'],
  'clients.create': ['clients.create'],
  'clients.update': ['clients.update'],
  'clients.delete': ['clients.delete'],
  
  // Tickets - mapear view para read
  'tickets.view': ['tickets.read', 'tickets.read_all'],
  'tickets.create': ['tickets.create'],
  'tickets.update': ['tickets.update', 'tickets.update_all'],
  'tickets.delete': ['tickets.delete'],
  
  // Users - mapear view para read
  'users.view': ['users.read'],
  'users.create': ['users.create'],
  'users.update': ['users.update'],
  'users.delete': ['users.delete'],
  
  // Directions - mapear view para read
  'directions.view': ['directions.read'],
  'directions.create': ['directions.create'],
  'directions.update': ['directions.update'],
  'directions.delete': ['directions.delete'],
  
  // Departments - mapear view para read
  'departments.view': ['departments.read'],
  'departments.create': ['departments.create'],
  'departments.update': ['departments.update'],
  'departments.delete': ['departments.delete'],
  
  // Sections - mapear view para read
  'sections.view': ['sections.read'],
  'sections.create': ['sections.create'],
  'sections.update': ['sections.update'],
  'sections.delete': ['sections.delete'],
  
  // Catalog - mapear view para read
  'catalog.view': ['catalog.read'],
  'catalog.create': ['catalog.manage'],
  'catalog.update': ['catalog.manage'],
  'catalog.manage': ['catalog.manage'],
  'catalog.approve': ['catalog.manage'],
  
  // Assets - mapear view para read
  'assets.view': ['assets.read', 'assets.read_all'],
  
  // Knowledge - mapear view para read
  'knowledge.view': ['knowledge.read'],
  'knowledge.create': ['knowledge.create'],
  'knowledge.update': ['knowledge.update'],
  'knowledge.delete': ['knowledge.delete'],
  
  // Hours Bank - mapear view para view (já existe no backend)
  'hours_bank.view': ['hours_bank.view'],
  'hours_bank.manage': ['hours_bank.manage'],
  
  // Reports - mapear view para view (já existe no backend)
  'reports.view': ['reports.view'],
  
  // Roles/RBAC - mapear para settings
  'roles.view': ['settings.manage_roles'],
  
  // SLAs, Priorities, Types - mapear para settings
  'slas.view': ['settings.manage_sla', 'settings.view'],
  'priorities.view': ['settings.manage_sla', 'settings.view'],
  'types.view': ['settings.manage_sla', 'settings.view'],
  'categories.view': ['settings.manage_sla', 'settings.view'],
  
  // Settings do sistema
  'settings.manage_sla': ['settings.manage_sla'],
  'settings.manage_roles': ['settings.manage_roles'],
  'settings.view': ['settings.view'],
  
  // Projects - mapear view para view
  'projects.view': ['projects.view'],
  'projects.create': ['projects.create'],
  'projects.update': ['projects.update'],
  'projects.delete': ['projects.delete'],
  
  // Project Tasks - mapear view para view
  'project_tasks.view': ['project_tasks.view'],
  'project_tasks.create': ['project_tasks.create'],
  'project_tasks.update': ['project_tasks.update'],
  'project_tasks.delete': ['project_tasks.delete'],
  
  // Project Stakeholders - mapear manage
  'project_stakeholders.manage': ['project_stakeholders.manage'],
}

/**
 * Hook para verificar permissões do utilizador
 * 
 * Uso:
 * const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess } = usePermissions()
 * 
 * if (hasPermission('users.create')) { ... }
 * if (hasAnyPermission(['users.create', 'users.update'])) { ... }
 * if (canAccess('users')) { ... }
 */
export const usePermissions = () => {
  const { user, permissions: userPermissions } = useAuthStore()

  // Lista de permissões do utilizador (array de strings)
  const permissions = useMemo(() => {
    // Se tiver permissões carregadas do backend (RBAC)
    if (userPermissions && Array.isArray(userPermissions) && userPermissions.length > 0) {
      return userPermissions.map(mapBackendPermission);
    }
    
    // Fallback: verificar se o user tem permissões
    if (user?.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      return user.permissions.map(mapBackendPermission);
    }
    
    // Usar permissões padrão do perfil
    if (user?.role && DEFAULT_ROLE_PERMISSIONS[user.role]) {
      return DEFAULT_ROLE_PERMISSIONS[user.role]
    }
    
    // Fallback final: permissões básicas de visualização
    return ['dashboard.view']
  }, [user, userPermissions])

  // Verificar se é admin (tem todas as permissões)
  const isAdmin = useMemo(() => {
    const adminRoles = ['org-admin', 'admin', 'super-admin', 'provider-admin'];
    return adminRoles.includes(user?.role) || permissions.includes('*');
  }, [user, permissions])

  /**
   * Verifica se o utilizador tem uma permissão específica
   * @param {string} permission - Nome da permissão (ex: 'users.create')
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    if (!permission) return true
    if (isAdmin) return true
    
    // Dashboard é sempre acessível para utilizadores autenticados
    if (permission === 'dashboard.view') return true
    
    // Verificar permissão exata
    if (permissions.includes(permission)) {
      return true
    }
    
    // Verificar wildcard de recurso (ex: 'users.*' permite 'users.create')
    const [resource] = permission.split('.')
    if (permissions.includes(`${resource}.*`)) {
      return true
    }
    
    // Verificar aliases (mapeamento frontend -> backend)
    const aliases = PERMISSION_ALIASES[permission]
    if (aliases) {
      for (const alias of aliases) {
        if (permissions.includes(alias)) {
          return true
        }
        // Verificar wildcard do alias
        const [aliasResource] = alias.split('.')
        if (permissions.includes(`${aliasResource}.*`)) {
          return true
        }
      }
    }
    
    return false
  }, [permissions, isAdmin])

  /**
   * Verifica se o utilizador tem QUALQUER uma das permissões (OR)
   * @param {string[]} permissionList - Lista de permissões
   * @returns {boolean}
   */
  const hasAnyPermission = useCallback((permissionList) => {
    if (!permissionList || permissionList.length === 0) return true
    if (isAdmin) return true
    
    return permissionList.some(p => hasPermission(p))
  }, [hasPermission, isAdmin])

  /**
   * Verifica se o utilizador tem TODAS as permissões (AND)
   * @param {string[]} permissionList - Lista de permissões
   * @returns {boolean}
   */
  const hasAllPermissions = useCallback((permissionList) => {
    if (!permissionList || permissionList.length === 0) return true
    if (isAdmin) return true
    
    return permissionList.every(p => hasPermission(p))
  }, [hasPermission, isAdmin])

  /**
   * Verifica se o utilizador pode aceder a um recurso (qualquer ação)
   * @param {string} resource - Nome do recurso (ex: 'users', 'tickets')
   * @returns {boolean}
   */
  const canAccess = useCallback((resource) => {
    if (!resource) return true
    if (isAdmin) return true
    
    // Verificar se tem qualquer permissão para o recurso
    return permissions.some(p => p.startsWith(`${resource}.`) || p === `${resource}.*`)
  }, [permissions, isAdmin])

  /**
   * Filtra uma lista de items baseado em permissões
   * @param {Array} items - Lista de items com propriedade 'permission'
   * @returns {Array} - Items filtrados
   */
  const filterByPermission = useCallback((items) => {
    if (!items || !Array.isArray(items)) return []
    if (isAdmin) return items
    
    return items.filter(item => {
      if (!item.permission) return true
      return hasPermission(item.permission)
    })
  }, [hasPermission, isAdmin])

  return {
    permissions,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    filterByPermission,
    user
  }
}

export default usePermissions
