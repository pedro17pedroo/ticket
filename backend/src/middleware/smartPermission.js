import permissionService from '../services/permissionService.js';
import logger from '../config/logger.js';

/**
 * Middleware inteligente para verificar permissões hierárquicas
 * Verifica se o usuário tem a permissão solicitada OU uma superior
 * 
 * Hierarquia de permissões:
 * - read_all > read (quem tem read_all pode fazer read)
 * - update_all > update (quem tem update_all pode fazer update)
 * - delete_all > delete (quem tem delete_all pode fazer delete)
 */

const PERMISSION_HIERARCHY = {
  'read': ['read_all'],
  'update': ['update_all'],
  'delete': ['delete_all'],
  'create': ['create_all'],
  'assign': ['assign_all']
};

/**
 * Middleware inteligente para verificar permissões
 * @param {String} resource - Recurso (ex: 'tickets')
 * @param {String} action - Ação (ex: 'read')
 * @param {Object} options - Opções adicionais
 * @returns {Function} Middleware
 */
export const requireSmartPermission = (resource, action, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticação necessária'
        });
      }

      // Lista de permissões para verificar (ação solicitada + superiores)
      const permissionsToCheck = [action];
      if (PERMISSION_HIERARCHY[action]) {
        permissionsToCheck.push(...PERMISSION_HIERARCHY[action]);
      }

      // Preparar opções de scope
      const scopeOptions = {
        ...options,
        targetUserId: req.params.userId || req.body.userId || options.targetUserId,
        targetClientId: req.params.clientId || req.body.clientId || options.targetClientId,
        targetOrganizationId: req.params.organizationId || options.targetOrganizationId
      };

      // Verificar cada permissão na hierarquia
      let hasPermission = false;
      let grantedPermission = null;

      for (const permissionAction of permissionsToCheck) {
        const allowed = await permissionService.hasPermission(
          req.user,
          resource,
          permissionAction,
          scopeOptions
        );

        if (allowed) {
          hasPermission = true;
          grantedPermission = `${resource}.${permissionAction}`;
          break;
        }
      }

      if (!hasPermission) {
        logger.warn(`Permissão negada: ${req.user.email} tentou ${action} em ${resource}`, {
          userId: req.user.id,
          role: req.user.role,
          resource,
          action,
          permissionsChecked: permissionsToCheck.map(a => `${resource}.${a}`)
        });

        return res.status(403).json({
          success: false,
          error: 'Não tem permissão para executar esta ação',
          required: `${resource}.${action}`,
          checked: permissionsToCheck.map(a => `${resource}.${a}`)
        });
      }

      // Log da permissão concedida
      logger.info(`Permissão concedida: ${req.user.email} acessou ${resource}.${action} via ${grantedPermission}`, {
        userId: req.user.id,
        role: req.user.role,
        resource,
        action,
        grantedVia: grantedPermission
      });

      next();
    } catch (error) {
      logger.error('Erro na verificação de permissão:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };
};

export default requireSmartPermission;
