import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePermissions } from '../hooks/usePermissions'

/**
 * Componente de rota protegida com verificação de permissões
 * 
 * Uso:
 * <ProtectedRoute permission="users.view">
 *   <Users />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute permissions={['users.view', 'users.create']} requireAll={false}>
 *   <Users />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ 
  children, 
  permission,        // Permissão única
  permissions,       // Lista de permissões
  requireAll = false, // true = AND, false = OR
  redirectTo = '/',  // Para onde redirecionar se não tem permissão
  resource,          // Verificar acesso a recurso (qualquer ação)
}) => {
  const { token, permissionsLoaded } = useAuthStore()
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess, isAdmin } = usePermissions()
  const location = useLocation()

  // Se não está autenticado, redireciona para login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Aguardar permissões serem carregadas
  if (!permissionsLoaded) {
    // Mostrar loading enquanto carrega permissões
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Admin tem acesso a tudo
  if (isAdmin) {
    return children
  }

  // Verificar acesso a recurso
  if (resource) {
    if (!canAccess(resource)) {
      console.log(`🛡️ ProtectedRoute: NO ACCESS to resource=${resource}, redirecting from ${location.pathname}`)
      return <Navigate to={redirectTo} replace />
    }
    return children
  }

  // Verificar permissão única
  if (permission) {
    if (!hasPermission(permission)) {
      console.log(`🛡️ ProtectedRoute: NO PERMISSION ${permission}, redirecting from ${location.pathname}`)
      return <Navigate to={redirectTo} replace />
    }
    return children
  }

  // Verificar lista de permissões
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasAccess) {
      console.log(`🛡️ ProtectedRoute: NO PERMISSIONS ${permissions.join(',')}, redirecting from ${location.pathname}`)
      return <Navigate to={redirectTo} replace />
    }
    return children
  }

  // Se não especificou permissões, renderiza
  return children
}

export default ProtectedRoute
