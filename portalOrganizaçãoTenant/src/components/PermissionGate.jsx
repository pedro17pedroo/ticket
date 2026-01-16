import { usePermissions } from '../hooks/usePermissions'

/**
 * Componente para renderização condicional baseada em permissões
 * 
 * Uso:
 * <PermissionGate permission="users.create">
 *   <Button>Criar Utilizador</Button>
 * </PermissionGate>
 * 
 * <PermissionGate permissions={['users.create', 'users.update']} requireAll={false}>
 *   <Button>Editar</Button>
 * </PermissionGate>
 * 
 * <PermissionGate permission="users.delete" fallback={<span>Sem permissão</span>}>
 *   <Button>Eliminar</Button>
 * </PermissionGate>
 */
const PermissionGate = ({ 
  children, 
  permission,        // Permissão única
  permissions,       // Lista de permissões
  requireAll = false, // true = AND, false = OR
  fallback = null,   // Componente a mostrar se não tem permissão
  resource,          // Verificar acesso a recurso (qualquer ação)
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess, isAdmin } = usePermissions()

  // Admin tem acesso a tudo
  if (isAdmin) {
    return children
  }

  // Verificar acesso a recurso
  if (resource) {
    if (!canAccess(resource)) {
      return fallback
    }
    return children
  }

  // Verificar permissão única
  if (permission) {
    if (!hasPermission(permission)) {
      return fallback
    }
    return children
  }

  // Verificar lista de permissões
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasAccess) {
      return fallback
    }
    return children
  }

  // Se não especificou permissões, renderiza
  return children
}

export default PermissionGate
