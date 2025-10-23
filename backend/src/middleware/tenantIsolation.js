/**
 * Middleware para garantir isolamento entre tenants (organizações)
 * Previne acesso cruzado entre organizações diferentes
 */

import logger from '../config/logger.js';

/**
 * Valida que recursos acessados pertencem à organização do usuário
 * Uso: Aplicar em rotas que modificam recursos por ID
 */
export const ensureTenantIsolation = (model, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userOrgId = req.user.organizationId;

      if (!resourceId) {
        return next(); // Se não há ID, deixa passar (ex: GET /api/tickets)
      }

      // Verificar se recurso existe e pertence à mesma organização
      const resource = await model.findOne({
        where: { 
          id: resourceId,
          organizationId: userOrgId 
        }
      });

      if (!resource) {
        // Log de tentativa de acesso não autorizado
        logger.warn(`Tentativa de acesso cross-tenant: usuário ${req.user.email} (org: ${userOrgId}) tentou acessar recurso ${resourceId}`);
        
        // Retornar 404 ao invés de 403 para não revelar existência do recurso
        return res.status(404).json({ 
          error: 'Recurso não encontrado' 
        });
      }

      // Anexar recurso ao request para evitar query duplicada no controller
      req.tenantResource = resource;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Adiciona automaticamente organizationId aos filtros de query
 * Uso: Aplicar em rotas GET que listam recursos
 */
export const addTenantFilter = (req, res, next) => {
  try {
    // Adiciona organizationId aos query params
    if (!req.query.organizationId) {
      req.query.organizationId = req.user.organizationId;
    } else {
      // Se alguém tentar forçar outra org, sobrescrever
      logger.warn(`Tentativa de query cross-tenant: usuário ${req.user.email} tentou filtrar por org ${req.query.organizationId}`);
      req.query.organizationId = req.user.organizationId;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Adiciona automaticamente organizationId ao body de criação
 * Uso: Aplicar em rotas POST que criam recursos
 */
export const addTenantToBody = (req, res, next) => {
  try {
    // Força organizationId do usuário autenticado
    // Ignora qualquer organizationId vindo do cliente
    if (req.body.organizationId && req.body.organizationId !== req.user.organizationId) {
      logger.warn(`Tentativa de criar recurso em outra org: usuário ${req.user.email} tentou usar org ${req.body.organizationId}`);
    }
    
    req.body.organizationId = req.user.organizationId;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Valida que usuários relacionados (assignee, requester, etc) pertencem à mesma org
 */
export const validateRelatedUsers = (userFields = ['assigneeId', 'requesterId']) => {
  return async (req, res, next) => {
    try {
      const userOrgId = req.user.organizationId;
      const { User } = await import('../modules/models/index.js');

      for (const field of userFields) {
        const userId = req.body[field];
        
        if (userId) {
          const user = await User.findOne({
            where: { 
              id: userId,
              organizationId: userOrgId 
            }
          });

          if (!user) {
            return res.status(400).json({ 
              error: `Usuário especificado em '${field}' não pertence a esta organização` 
            });
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  ensureTenantIsolation,
  addTenantFilter,
  addTenantToBody,
  validateRelatedUsers
};
