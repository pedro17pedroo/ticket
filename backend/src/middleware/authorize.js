import logger from '../config/logger.js';

/**
 * Middleware de autorização baseado em roles
 * @param {...string} allowedRoles - Roles permitidas para acessar a rota
 * @returns {Function} Middleware function
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Verificar se usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para acessar este recurso'
      });
    }

    // Verificar se o usuário tem permissão
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      logger.warn(`Acesso negado: ${req.user.email} tentou acessar ${req.path} com role ${req.user.role}`);

      return res.status(403).json({
        error: 'Acesso negado',
        message: `Esta ação requer uma das seguintes permissões: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário é admin da organização
 */
export const requireAdminOrg = authorize('org-admin');

/**
 * Middleware para verificar se o usuário é agente ou admin
 */
export const requireAgent = authorize('org-admin', 'agent');

/**
 * Middleware para verificar se o usuário pertence à mesma organização
 */
export const requireSameOrganization = (req, res, next) => {
  const resourceOrgId = req.params.organizationId || req.body.organizationId;

  if (!resourceOrgId) {
    return next(); // Deixar outra validação tratar isso
  }

  if (req.user.organizationId !== resourceOrgId) {
    logger.warn(`Tentativa de acesso cross-org: ${req.user.email} tentou acessar recurso da org ${resourceOrgId}`);

    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Você não tem permissão para acessar recursos de outra organização'
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário pode acessar o recurso
 * Permite acesso se:
 * - For admin da organização
 * - For o próprio usuário (no caso de perfis)
 */
export const requireOwnerOrAdmin = (req, res, next) => {
  const resourceUserId = req.params.userId || req.params.id;

  // Admin tem acesso total
  if (req.user.role === 'org-admin') {
    return next();
  }

  // Verificar se é o próprio usuário
  if (req.user.id === resourceUserId) {
    return next();
  }

  logger.warn(`Acesso negado: ${req.user.email} tentou acessar recurso do usuário ${resourceUserId}`);

  return res.status(403).json({
    error: 'Acesso negado',
    message: 'Você não tem permissão para acessar este recurso'
  });
};

export default authorize;
