import permissionService from '../services/permissionService.js';
import logger from '../config/logger.js';
import Project from '../modules/projects/projectModel.js';

/**
 * Middleware para verificar permissões de projetos
 * Verifica permissões globais E permite acesso ao criador do projeto
 * 
 * Requirements: 9.4, 9.5
 * - 9.4: WHEN a user lacks permission THEN THE System SHALL hide or disable the corresponding features
 * - 9.5: THE Permission_System SHALL allow project managers to manage their own projects regardless of global permissions
 * 
 * @param {String} resource - Recurso (ex: 'projects', 'project_tasks', 'project_stakeholders')
 * @param {String} action - Ação (ex: 'view', 'create', 'update', 'delete', 'manage')
 * @returns {Function} Middleware
 */
export const requireProjectPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      // Admin roles always have access
      const adminRoles = ['super-admin', 'org-admin', 'client-admin', 'provider-admin'];
      if (adminRoles.includes(req.user.role)) {
        return next();
      }

      // Get project ID from params (could be :id or :projectId)
      const projectId = req.params.id || req.params.projectId;

      // If we have a project ID, check if user is the project creator (Requirement 9.5)
      if (projectId) {
        const project = await Project.findOne({
          where: { 
            id: projectId,
            organizationId: req.user.organizationId
          },
          attributes: ['id', 'createdBy']
        });

        if (project && project.createdBy === req.user.id) {
          // Project creator has full access to their own projects
          logger.debug(`Project creator access granted: ${req.user.email} for project ${projectId}`);
          return next();
        }
      }

      // Check global permission (Requirement 9.4)
      const hasPermission = await permissionService.hasPermission(
        req.user,
        resource,
        action,
        { targetOrganizationId: req.user.organizationId }
      );

      if (!hasPermission) {
        logger.warn(`Permissão negada: ${req.user.email} tentou ${action} em ${resource}`);
        
        return res.status(403).json({
          success: false,
          error: 'Não tem permissão para executar esta ação',
          code: 'PERMISSION_DENIED',
          required: `${resource}.${action}`
        });
      }

      next();
    } catch (error) {
      // If error is because RBAC tables don't exist, allow access (fallback)
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        logger.warn('Tabelas RBAC não existem ainda - usando fallback');
        return next();
      }
      
      logger.error('Erro ao verificar permissão de projeto:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Middleware para verificar se o utilizador é o criador do projeto ou tem permissão
 * Útil para operações que só o criador ou admin pode fazer
 * 
 * @param {String} resource - Recurso
 * @param {String} action - Ação
 * @returns {Function} Middleware
 */
export const requireProjectOwnerOrPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      // Admin roles always have access
      const adminRoles = ['super-admin', 'org-admin', 'client-admin', 'provider-admin'];
      if (adminRoles.includes(req.user.role)) {
        return next();
      }

      // Get project ID from params
      const projectId = req.params.id || req.params.projectId;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'ID do projeto não fornecido'
        });
      }

      // Check if user is the project creator
      const project = await Project.findOne({
        where: { 
          id: projectId,
          organizationId: req.user.organizationId
        },
        attributes: ['id', 'createdBy']
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Projeto não encontrado',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Project creator has full access
      if (project.createdBy === req.user.id) {
        logger.debug(`Project owner access granted: ${req.user.email} for project ${projectId}`);
        return next();
      }

      // Check global permission
      const hasPermission = await permissionService.hasPermission(
        req.user,
        resource,
        action,
        { targetOrganizationId: req.user.organizationId }
      );

      if (!hasPermission) {
        logger.warn(`Permissão negada: ${req.user.email} tentou ${action} em ${resource} (projeto ${projectId})`);
        
        return res.status(403).json({
          success: false,
          error: 'Não tem permissão para executar esta ação',
          code: 'PERMISSION_DENIED',
          required: `${resource}.${action}`
        });
      }

      next();
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        logger.warn('Tabelas RBAC não existem ainda - usando fallback');
        return next();
      }
      
      logger.error('Erro ao verificar permissão de projeto:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Middleware para verificar múltiplas permissões de projeto (OR - qualquer uma)
 * 
 * @param {...Array} permissions - Array de [resource, action] pairs
 * @returns {Function} Middleware
 */
export const requireAnyProjectPermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      // Admin roles always have access
      const adminRoles = ['super-admin', 'org-admin', 'client-admin', 'provider-admin'];
      if (adminRoles.includes(req.user.role)) {
        return next();
      }

      // Get project ID from params
      const projectId = req.params.id || req.params.projectId;

      // Check if user is the project creator
      if (projectId) {
        const project = await Project.findOne({
          where: { 
            id: projectId,
            organizationId: req.user.organizationId
          },
          attributes: ['id', 'createdBy']
        });

        if (project && project.createdBy === req.user.id) {
          return next();
        }
      }

      // Check if has any of the permissions
      for (const [resource, action] of permissions) {
        const hasPermission = await permissionService.hasPermission(
          req.user,
          resource,
          action,
          { targetOrganizationId: req.user.organizationId }
        );

        if (hasPermission) {
          return next();
        }
      }

      logger.warn(`Permissão negada: ${req.user.email} não tem nenhuma das permissões necessárias`);
      
      return res.status(403).json({
        success: false,
        error: 'Não tem permissão para executar esta ação',
        code: 'PERMISSION_DENIED'
      });
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        logger.warn('Tabelas RBAC não existem ainda - usando fallback');
        return next();
      }
      
      logger.error('Erro ao verificar permissões de projeto:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

export default {
  requireProjectPermission,
  requireProjectOwnerOrPermission,
  requireAnyProjectPermission
};
