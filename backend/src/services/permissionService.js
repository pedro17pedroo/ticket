import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import UserPermission from '../models/UserPermission.js';
import { User } from '../modules/models/index.js';
import logger from '../config/logger.js';

class PermissionService {
  /**
   * Verificar se um utilizador tem uma permissão específica
   * @param {Object} user - Objeto do utilizador
   * @param {String} resource - Recurso (ex: 'tickets')
   * @param {String} action - Ação (ex: 'create')
   * @param {Object} options - Opções adicionais { scope, targetUserId, etc }
   * @returns {Boolean}
   */
  async hasPermission(user, resource, action, options = {}) {
    try {
      // 1. Roles de admin têm todas as permissões (admins base + aliases legados)
      const adminRoles = ['super-admin', 'org-admin', 'client-admin', 'org-admin', 'provider-admin'];
      if (adminRoles.includes(user.role)) {
        return true;
      }

      // 1.1 Permissões implícitas para clients (Knowledge Base é público para eles)
      if (['client-user', 'client-manager'].includes(user.role) && resource === 'knowledge' && action === 'read') {
        return true;
      }

      // 2. Buscar a permissão
      const permission = await Permission.findOne({
        where: { resource, action }
      });

      if (!permission) {
        logger.warn(`Permissão não encontrada: ${resource}.${action}`);
        return false;
      }

      // 3. Verificar permissões específicas do utilizador (override)
      const userPermission = await UserPermission.findOne({
        where: {
          userId: user.id,
          permissionId: permission.id
        }
      });

      if (userPermission) {
        // Verificar expiração
        if (userPermission.expiresAt && new Date() > new Date(userPermission.expiresAt)) {
          return false;
        }
        return userPermission.granted;
      }

      // 4. Verificar permissões do role
      const role = await Role.findOne({
        where: { name: user.role },
        include: [{
          model: Permission,
          as: 'permissions',
          where: { id: permission.id },
          through: { where: { granted: true } },
          required: false
        }]
      });

      if (!role) {
        logger.warn(`Role não encontrado: ${user.role}`);
        return false;
      }

      const hasRolePermission = role.permissions && role.permissions.length > 0;

      if (!hasRolePermission) {
        return false;
      }

      // 5. Verificar scope
      return this.checkScope(user, permission.scope, options);

    } catch (error) {
      // Se erro for de tabela não existir, lançar erro para o middleware detectar
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        throw error;
      }

      logger.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Verificar se o scope da permissão permite o acesso
   */
  checkScope(user, permissionScope, options = {}) {
    switch (permissionScope) {
      case 'global':
        // Acesso global - sempre permitido se tem a permissão
        return true;

      case 'organization':
        // Acesso a recursos da organização
        if (options.targetOrganizationId) {
          return user.organizationId === options.targetOrganizationId;
        }
        return true; // Assume mesma organização

      case 'client':
        // Acesso a recursos do cliente
        if (options.targetClientId) {
          const userClientId = user.clientId || user.id;
          return userClientId === options.targetClientId;
        }
        return true; // Assume mesmo cliente

      case 'own':
        // Acesso apenas aos próprios recursos
        if (options.targetUserId) {
          return user.id === options.targetUserId;
        }
        return true; // Assume próprio recurso

      default:
        return true;
    }
  }

  /**
   * Obter todas as permissões de um utilizador
   */
  async getUserPermissions(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roleObject',
          include: [{
            model: Permission,
            as: 'permissions',
            through: {
              where: { granted: true },
              attributes: []
            }
          }]
        }]
      });

      if (!user) {
        return [];
      }

      const rolePermissions = user.roleObject?.permissions || [];

      // Adicionar permissões específicas do utilizador
      const userPermissions = await UserPermission.findAll({
        where: { userId, granted: true },
        include: [{ model: Permission, as: 'permission' }]
      });

      const allPermissions = [
        ...rolePermissions,
        ...userPermissions.map(up => up.permission)
      ];

      // Remover duplicados
      const uniquePermissions = allPermissions.filter((perm, index, self) =>
        index === self.findIndex(p => p.id === perm.id)
      );

      return uniquePermissions;
    } catch (error) {
      logger.error('Erro ao obter permissões do utilizador:', error);
      return [];
    }
  }

  /**
   * Conceder permissão específica a um utilizador
   */
  async grantPermissionToUser(userId, permissionId, grantedBy, options = {}) {
    try {
      const { expiresAt, reason } = options;

      const [userPermission, created] = await UserPermission.findOrCreate({
        where: { userId, permissionId },
        defaults: {
          userId,
          permissionId,
          granted: true,
          grantedBy,
          expiresAt,
          reason
        }
      });

      if (!created) {
        await userPermission.update({
          granted: true,
          grantedBy,
          expiresAt,
          reason
        });
      }

      logger.info(`Permissão ${permissionId} concedida ao utilizador ${userId} por ${grantedBy}`);
      return userPermission;
    } catch (error) {
      logger.error('Erro ao conceder permissão:', error);
      throw error;
    }
  }

  /**
   * Revogar permissão específica de um utilizador
   */
  async revokePermissionFromUser(userId, permissionId) {
    try {
      await UserPermission.destroy({
        where: { userId, permissionId }
      });

      logger.info(`Permissão ${permissionId} revogada do utilizador ${userId}`);
    } catch (error) {
      logger.error('Erro ao revogar permissão:', error);
      throw error;
    }
  }

  /**
   * Verificar se um utilizador pode executar uma ação em um recurso de outro utilizador
   */
  async canAccessUserResource(currentUser, targetUserId, resource, action) {
    // Admin pode acessar tudo
    const adminRoles = ['super-admin', 'org-admin', 'client-admin', 'org-admin', 'provider-admin'];
    if (adminRoles.includes(currentUser.role)) {
      return true;
    }

    // Próprio recurso
    if (currentUser.id === targetUserId) {
      return this.hasPermission(currentUser, resource, action, { targetUserId });
    }

    // Recurso de outro utilizador - precisa de permissão _all ou organization scope
    const hasAllPermission = await this.hasPermission(
      currentUser,
      resource,
      `${action}_all`
    );

    if (hasAllPermission) {
      return true;
    }

    // Verificar hierarquia (gerente > supervisor > agente)
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return false;
    }

    // Mesma organização?
    if (currentUser.organizationId !== targetUser.organizationId) {
      return false;
    }

    // Verificar prioridade dos roles
    const currentRole = await Role.findOne({ where: { name: currentUser.role } });
    const targetRole = await Role.findOne({ where: { name: targetUser.role } });

    if (!currentRole || !targetRole) {
      return false;
    }

    // Role com maior prioridade pode acessar recursos de roles com menor prioridade
    return currentRole.priority > targetRole.priority;
  }

  /**
   * Obter matriz de permissões de um role
   */
  async getRolePermissions(roleName, organizationId = null) {
    try {
      const role = await Role.findOne({
        where: { name: roleName, organizationId },
        include: [{
          model: Permission,
          as: 'permissions',
          through: {
            attributes: ['granted']
          }
        }]
      });

      return role?.permissions || [];
    } catch (error) {
      logger.error('Erro ao obter permissões do role:', error);
      return [];
    }
  }

  /**
   * Criar role customizado para uma organização
   */
  async createCustomRole(organizationId, roleData, permissions) {
    try {
      const role = await Role.create({
        ...roleData,
        organizationId,
        isSystem: false
      });

      // Associar permissões
      for (const permissionId of permissions) {
        await RolePermission.create({
          roleId: role.id,
          permissionId,
          granted: true
        });
      }

      logger.info(`Role customizado criado: ${role.name} para org ${organizationId}`);
      return role;
    } catch (error) {
      logger.error('Erro ao criar role customizado:', error);
      throw error;
    }
  }
}

export default new PermissionService();
