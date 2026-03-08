import { Op } from 'sequelize';
import { User, Role, Permission, RolePermission, UserPermission } from '../modules/models/index.js';
import logger from '../config/logger.js';

class PermissionService {
  /**
   * Verificar se um utilizador tem uma permissão específica (com suporte multi-nível)
   * @param {Object} user - Objeto do utilizador
   * @param {String} resource - Recurso (ex: 'tickets')
   * @param {String} action - Ação (ex: 'create')
   * @param {Object} options - Opções adicionais { scope, targetUserId, etc }
   * @returns {Boolean}
   */
  async hasPermission(user, resource, action, options = {}) {
    try {
      // 1. Determinar nível do usuário
      const userLevel = this.getUserLevel(user);
      
      // 2. Roles de admin do seu nível têm todas as permissões do seu escopo
      if (userLevel === 'system' && ['super-admin', 'provider-admin'].includes(user.role)) {
        return true; // Provider admin tem TODAS as permissões
      }
      
      if (userLevel === 'organization' && user.role === 'org-admin') {
        // Org admin tem todas as permissões de organization e client
        return true;
      }
      
      if (userLevel === 'client' && user.role === 'client-admin') {
        // Client admin tem todas as permissões de client
        // Mas precisa verificar se a permissão é aplicável a client
        const permission = await Permission.findOne({
          where: { resource, action }
        });
        
        if (!permission) {
          return false;
        }
        
        // Verificar se permissão é aplicável a client
        if (permission.applicableTo) {
          try {
            const applicableTo = typeof permission.applicableTo === 'string' 
              ? JSON.parse(permission.applicableTo) 
              : permission.applicableTo;
            
            if (!applicableTo.includes('client')) {
              return false; // Permissão não aplicável a client
            }
          } catch (error) {
            logger.warn(`Erro ao parsear applicableTo: ${permission.id}`);
          }
        }
        
        return true;
      }

      // 2.1 Permissões implícitas para clients (Knowledge Base é público para eles)
      if (['client-user', 'client-manager'].includes(user.role) && resource === 'knowledge' && action === 'read') {
        return true;
      }

      // 3. Buscar a permissão
      const permission = await Permission.findOne({
        where: { resource, action }
      });

      if (!permission) {
        logger.warn(`Permissão não encontrada: ${resource}.${action}`);
        return false;
      }
      
      // 4. Verificar se permissão é aplicável ao nível do usuário
      if (permission.applicableTo) {
        try {
          const applicableTo = typeof permission.applicableTo === 'string' 
            ? JSON.parse(permission.applicableTo) 
            : permission.applicableTo;
          
          if (!applicableTo.includes(userLevel)) {
            logger.warn(`Permissão ${resource}.${action} não aplicável ao nível ${userLevel}`);
            return false;
          }
        } catch (error) {
          logger.warn(`Erro ao parsear applicableTo: ${permission.id}`);
        }
      }

      // 5. Verificar permissões específicas do utilizador (override)
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

      // 6. Buscar role seguindo hierarquia (client → org → global)
      const role = await this.findRoleByHierarchy(
        user.role,
        user.organizationId,
        user.clientId
      );

      if (!role) {
        logger.warn(`Role não encontrado: ${user.role}`);
        return false;
      }

      // 7. Verificar se role tem a permissão
      const hasRolePermission = role.permissions && role.permissions.some(p => p.id === permission.id);

      if (!hasRolePermission) {
        return false;
      }

      // 8. Verificar scope
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
   * Determinar o nível hierárquico do usuário
   * @param {Object} user - Objeto do usuário
   * @returns {String} 'system', 'organization', ou 'client'
   */
  getUserLevel(user) {
    // Provider/System level
    if (['super-admin', 'provider-admin'].includes(user.role)) {
      return 'system';
    }
    
    // Client level
    if (user.userType === 'client' || ['client-admin', 'client-manager', 'client-user'].includes(user.role)) {
      return 'client';
    }
    
    // Organization level (default)
    return 'organization';
  }

  /**
   * Buscar role correto seguindo hierarquia: client → organization → global
   * @param {String} roleName - Nome do role
   * @param {String} organizationId - ID da organização
   * @param {String} clientId - ID do cliente (opcional)
   * @returns {Object} Role encontrado
   */
  async findRoleByHierarchy(roleName, organizationId, clientId = null) {
    // 1. Tentar buscar role customizado do cliente
    if (clientId) {
      const clientRole = await Role.findOne({
        where: {
          name: roleName,
          organizationId,
          clientId,
          isActive: true
        },
        include: [{
          model: Permission,
          as: 'permissions',
          through: {
            where: { granted: true },
            attributes: []
          }
        }]
      });
      
      if (clientRole) {
        logger.info(`✅ Role customizado do cliente encontrado: ${roleName} (client: ${clientId})`);
        return clientRole;
      }
    }
    
    // 2. Tentar buscar role customizado da organização
    if (organizationId) {
      const orgRole = await Role.findOne({
        where: {
          name: roleName,
          organizationId,
          clientId: null,
          isActive: true
        },
        include: [{
          model: Permission,
          as: 'permissions',
          through: {
            where: { granted: true },
            attributes: []
          }
        }]
      });
      
      if (orgRole) {
        logger.info(`✅ Role customizado da organização encontrado: ${roleName} (org: ${organizationId})`);
        return orgRole;
      }
    }
    
    // 3. Buscar role global (system)
    const globalRole = await Role.findOne({
      where: {
        name: roleName,
        organizationId: null,
        clientId: null,
        isActive: true
      },
      include: [{
        model: Permission,
        as: 'permissions',
        through: {
          where: { granted: true },
          attributes: []
        }
      }]
    });
    
    if (globalRole) {
      logger.info(`✅ Role global encontrado: ${roleName}`);
      return globalRole;
    }
    
    logger.warn(`❌ Role não encontrado: ${roleName}`);
    return null;
  }

  /**
   * Obter todas as permissões de um utilizador (com suporte multi-nível)
   */
  async getUserPermissions(userId) {
    try {
      logger.debug(`🔍 getUserPermissions: Buscando usuário: ${userId}`);
      
      let user = null;
      let userType = null;
      
      // Tentar buscar em User primeiro (Provider)
      user = await User.findByPk(userId);
      if (user) {
        userType = 'provider';
        logger.debug(`✅ getUserPermissions: Usuário encontrado em User (provider)`);
      }
      
      // Se não encontrou, buscar em OrganizationUser
      if (!user) {
        const { OrganizationUser } = await import('../modules/models/index.js');
        user = await OrganizationUser.findByPk(userId);
        if (user) {
          userType = 'organization';
          logger.debug(`✅ getUserPermissions: Usuário encontrado em OrganizationUser`);
        }
      }
      
      // Se não encontrou, buscar em ClientUser
      if (!user) {
        const { ClientUser } = await import('../modules/models/index.js');
        user = await ClientUser.findByPk(userId);
        if (user) {
          userType = 'client';
          logger.debug(`✅ getUserPermissions: Usuário encontrado em ClientUser`);
        }
      }
      
      if (!user) {
        logger.error(`❌ getUserPermissions: Usuário não encontrado: ${userId}`);
        return [];
      }
      
      logger.debug(`✅ getUserPermissions: Dados do usuário:`, {
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        clientId: user.clientId,
        userType
      });
      
      // Buscar role seguindo hierarquia (client → org → global)
      const role = await this.findRoleByHierarchy(
        user.role,
        user.organizationId,
        user.clientId
      );
      
      if (!role) {
        logger.error(`❌ getUserPermissions: Role não encontrado para usuário: ${user.role}`);
        return [];
      }
      
      logger.debug(`✅ getUserPermissions: Role encontrado:`, {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        permissionsCount: role.permissions?.length || 0
      });
      
      if (!role.permissions || role.permissions.length === 0) {
        logger.warn(`⚠️ getUserPermissions: Role "${role.name}" sem permissões associadas`);
        return [];
      }
      
      const rolePermissions = role.permissions || [];
      
      // Determinar nível do usuário
      const userLevel = this.getUserLevel({ ...user.toJSON(), userType });
      
      // Filtrar permissões aplicáveis ao nível do usuário
      const applicablePermissions = rolePermissions.filter(perm => {
        if (!perm.applicableTo) {
          return true; // Se não tem applicableTo, assume que é aplicável
        }
        
        try {
          const applicableTo = typeof perm.applicableTo === 'string' 
            ? JSON.parse(perm.applicableTo) 
            : perm.applicableTo;
          
          return applicableTo.includes(userLevel);
        } catch (error) {
          logger.warn(`Erro ao parsear applicableTo: ${perm.id}`);
          return true; // Em caso de erro, permite a permissão
        }
      });
      
      // Adicionar permissões específicas do utilizador
      const userPermissions = await UserPermission.findAll({
        where: { userId, granted: true },
        include: [{ 
          model: Permission, 
          as: 'permission',
          required: false
        }]
      });

      // Filtrar permissões específicas por applicable_to
      const filteredUserPermissions = userPermissions
        .map(up => up.permission)
        .filter(p => {
          if (!p || !p.applicableTo) return true;
          
          try {
            const applicableTo = typeof p.applicableTo === 'string' 
              ? JSON.parse(p.applicableTo) 
              : p.applicableTo;
            
            return applicableTo.includes(userLevel);
          } catch (error) {
            return true;
          }
        });

      const allPermissions = [
        ...applicablePermissions,
        ...filteredUserPermissions
      ];

      // Remover duplicados e formatar
      const uniquePermissions = allPermissions.filter((perm, index, self) =>
        index === self.findIndex(p => p && p.id === perm.id)
      );

      logger.info(`✅ Permissões carregadas para ${user.email}: ${uniquePermissions.length} permissões (nível: ${userLevel})`);
      
      return uniquePermissions.map(p => `${p.resource}.${p.action}`);
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
