import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Componente para proteger rotas com base em permissões
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo a renderizar se tiver permissão
 * @param {string} props.resource - Recurso necessário
 * @param {string} props.action - Ação necessária
 * @param {Array<string>} props.roles - Roles permitidos (opcional)
 * @param {string} props.redirectTo - Rota para redirecionar se não tiver permissão
 * 
 * @example
 * <ProtectedRoute resource="tickets" action="create">
 *   <CreateTicketPage />
 * </ProtectedRoute>
 * 
 * @example
 * <ProtectedRoute roles={['admin-org', 'gerente']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ 
  children, 
  resource, 
  action, 
  roles, 
  redirectTo = '/' 
}) => {
  const { can, hasRole, user } = usePermissions();

  // Se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar role se fornecido
  if (roles && roles.length > 0) {
    if (!hasRole(...roles)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Verificar permissão se fornecido
  if (resource && action) {
    if (!can(resource, action)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
};

/**
 * Componente para mostrar conteúdo apenas se tiver permissão
 * 
 * @example
 * <CanAccess resource="tickets" action="create">
 *   <button>Criar Ticket</button>
 * </CanAccess>
 */
export const CanAccess = ({ 
  children, 
  resource, 
  action, 
  roles,
  fallback = null 
}) => {
  const { can, hasRole } = usePermissions();

  // Verificar role se fornecido
  if (roles && roles.length > 0) {
    if (!hasRole(...roles)) {
      return fallback;
    }
  }

  // Verificar permissão se fornecido
  if (resource && action) {
    if (!can(resource, action)) {
      return fallback;
    }
  }

  return children;
};

export default ProtectedRoute;
