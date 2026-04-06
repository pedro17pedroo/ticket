import permissionService from '../services/permissionService.js';
import logger from '../config/logger.js';

/**
 * Middleware para verificar permissões
 * @param {String} resource - Recurso (ex: 'tickets')
 * @param {String} action - Ação (ex: 'create')
 * @param {Object} options - Opções adicionais
 * @returns {Function} Middleware
 */
export const requirePermission = (resource, action, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      // Preparar opções de scope
      const scopeOptions = {
        ...options,
        targetUserId: req.params.userId || req.body.userId || options.targetUserId,
        targetClientId: req.params.clientId || req.body.clientId || options.targetClientId,
        targetOrganizationId: req.params.organizationId || options.targetOrganizationId
      };

      // Verificar permissão
      const hasPermission = await permissionService.hasPermission(
        req.user,
        resource,
        action,
        scopeOptions
      );

      if (!hasPermission) {
        logger.warn(`Permissão negada: ${req.user.email} tentou ${action} em ${resource}`);
        
        return res.status(403).json({
          success: false,
          error: 'Não tem permissão para executar esta ação',
          required: `${resource}.${action}`
        });
      }

      next();
    } catch (error) {
      // Se erro for porque tabelas RBAC não existem, permitir acesso (fallback)
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        logger.warn('Tabelas RBAC não existem ainda - usando fallback');
        return next();
      }
      
      logger.error('Erro ao verificar permissão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Middleware para verificar múltiplas permissões (OR - qualquer uma)
 */
export const requireAnyPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      // Verificar se tem pelo menos uma permissão
      for (const [resource, action] of permissions) {
        const hasPermission = await permissionService.hasPermission(
          req.user,
          resource,
          action
        );

        if (hasPermission) {
          return next();
        }
      }

      logger.warn(`Permissão negada: ${req.user.email} não tem nenhuma das permissões necessárias`);
      
      return res.status(403).json({
        success: false,
        error: 'Não tem permissão para executar esta ação'
      });
    } catch (error) {
      logger.error('Erro ao verificar permissões:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Middleware para verificar múltiplas permissões (AND - todas)
 */
export const requireAllPermissions = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      // Verificar se tem todas as permissões
      for (const [resource, action] of permissions) {
        const hasPermission = await permissionService.hasPermission(
          req.user,
          resource,
          action
        );

        if (!hasPermission) {
          logger.warn(`Permissão negada: ${req.user.email} não tem ${resource}.${action}`);
          
          return res.status(403).json({
            success: false,
            error: 'Não tem permissão para executar esta ação',
            required: `${resource}.${action}`
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Erro ao verificar permissões:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Middleware para verificar se pode acessar recursos de outro utilizador
 */
export const canAccessUserResource = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      const targetUserId = req.params.userId || req.params.id;

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          error: 'ID do utilizador não fornecido'
        });
      }

      const canAccess = await permissionService.canAccessUserResource(
        req.user,
        targetUserId,
        resource,
        action
      );

      if (!canAccess) {
        logger.warn(`Acesso negado: ${req.user.email} tentou acessar ${resource} de ${targetUserId}`);
        
        return res.status(403).json({
          success: false,
          error: 'Não tem permissão para acessar este recurso'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro ao verificar acesso:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Middleware para verificar se pertence ao nível correto da hierarquia
 */
export const requireLevel = (...levels) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      // Mapear roles para níveis
      const roleLevelMap = {
        'org-admin': 'organization',
        'gerente': 'organization',
        'supervisor': 'organization',
        'agente': 'organization',
        'client-admin': 'client',
        'client-manager': 'client',
        'client-user': 'user',
        'client-viewer': 'user'
      };

      const userLevel = roleLevelMap[req.user.role];

      if (!levels.includes(userLevel)) {
        return res.status(403).json({
          success: false,
          error: 'Nível de acesso insuficiente'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro ao verificar nível:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Helper para adicionar permissões ao objeto req para uso no controller
 */
export const attachPermissions = async (req, res, next) => {
  try {
    if (req.user) {
      req.user.permissions = await permissionService.getUserPermissions(req.user.id);
      req.user.can = (resource, action, options) => {
        return permissionService.hasPermission(req.user, resource, action, options);
      };
    }
    next();
  } catch (error) {
    logger.error('Erro ao anexar permissões:', error);
    next();
  }
};
