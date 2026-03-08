import Role from '../../models/Role.js';
import Permission from '../../models/Permission.js';
import RolePermission from '../../models/RolePermission.js';
import UserPermission from '../../models/UserPermission.js';
import { User } from '../models/index.js';
import permissionService from '../../services/permissionService.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';

// ==================== PUBLIC ROUTES ====================

// GET /api/rbac/system-roles - Listar apenas roles do sistema (para formulários)
// Esta rota é acessível a todos os usuários autenticados
export const getSystemRoles = async (req, res, next) => {
  try {
    const { organizationId, role: userRole } = req.user;

    // Buscar apenas roles do sistema (isSystem: true) de nível organization
    const roles = await Role.findAll({
      where: {
        isSystem: true,
        level: 'organization',
        organizationId: null
      },
      attributes: ['id', 'name', 'displayName', 'description', 'priority', 'level'],
      order: [['priority', 'DESC']]
    });

    res.json({
      success: true,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        priority: role.priority,
        level: role.level
      }))
    });
  } catch (error) {
    logger.error('Erro ao listar roles do sistema:', error);
    next(error);
  }
};

// ==================== ROLES ====================

// GET /api/rbac/roles - Listar todos os roles
export const getRoles = async (req, res, next) => {
  try {
    const { organizationId, role: userRole, clientId } = req.user;

    let where = {};

    // admin-org vê TODOS os roles da organização (EXCETO super-admin e provider-admin)
    if (userRole === 'org-admin') {
      where = {
        [Op.or]: [
          { 
            organizationId: null, 
            isSystem: true,
            name: { [Op.notIn]: ['super-admin', 'provider-admin'] } // Filtrar roles de sistema
          },
          { organizationId }, // Roles da organização
          { organizationId, clientId: { [Op.ne]: null } } // Roles dos clientes da org
        ]
      };
    } 
    // Roles de ORGANIZAÇÃO (gerente, supervisor, agente)
    // Veem: roles do sistema (EXCETO super-admin e provider-admin) + roles da sua org + roles dos clientes da org
    else if (['gerente', 'supervisor', 'agente'].includes(userRole)) {
      where = {
        [Op.or]: [
          { 
            organizationId: null, 
            isSystem: true,
            name: { [Op.notIn]: ['super-admin', 'provider-admin'] } // Filtrar roles de sistema
          },
          { organizationId, clientId: null }, // Roles da organização
          { organizationId, clientId: { [Op.ne]: null } } // Roles dos clientes da org
        ]
      };
    }
    // client-admin vê apenas roles do sistema (EXCETO super-admin e provider-admin) + roles do seu cliente
    else if (userRole === 'client-admin') {
      where = {
        [Op.or]: [
          { 
            organizationId: null, 
            isSystem: true,
            name: { [Op.notIn]: ['super-admin', 'provider-admin'] } // Filtrar roles de sistema
          },
          { clientId } // Roles do seu cliente
        ]
      };
    }
    // Outros roles não devem ter acesso (mas o middleware já bloqueia)
    else {
      where = {
        [Op.or]: [
          { 
            organizationId: null, 
            isSystem: true,
            name: { [Op.notIn]: ['super-admin', 'provider-admin'] } // Filtrar roles de sistema
          },
          { organizationId },
          { clientId }
        ]
      };
    }

    const roles = await Role.findAll({
      where,
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: ['granted'] }
      }],
      order: [['priority', 'DESC']]
    });

    // Determinar permissões de edição/eliminação
    const canEditRole = (role) => {
      // Roles do sistema podem ter permissões editadas (mas não outros campos)
      if (role.isSystem) {
        // Apenas org-admin pode editar permissões de roles do sistema
        return userRole === 'org-admin';
      }
      if (userRole === 'org-admin') return true;
      if (['gerente', 'supervisor'].includes(userRole) && role.organizationId === organizationId) return true;
      if (userRole === 'client-admin' && role.clientId === clientId) return true;
      return false;
    };

    const canDeleteRole = (role) => {
      if (role.isSystem) return false;
      if (userRole === 'org-admin') return true;
      if (userRole === 'gerente' && role.organizationId === organizationId) return true;
      if (userRole === 'client-admin' && role.clientId === clientId) return true;
      return false;
    };

    res.json({
      success: true,
      roles: roles.map(role => ({
        ...role.toJSON(),
        permissionCount: role.permissions?.length || 0,
        canEdit: canEditRole(role),
        canDelete: canDeleteRole(role),
        scope: role.clientId ? 'client' : (role.organizationId ? 'organization' : 'system')
      })),
      userRole,
      canCreateCustomRole: ['org-admin', 'gerente', 'client-admin'].includes(userRole),
      canCreateForClients: ['org-admin', 'gerente'].includes(userRole)
    });
  } catch (error) {
    logger.error('Erro ao listar roles:', error);
    next(error);
  }
};

// GET /api/rbac/roles/:id - Obter role por ID
export const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: ['granted'] }
      }]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role não encontrado'
      });
    }

    // Verificar se pode acessar este role
    if (role.organizationId && role.organizationId !== req.user.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este role'
      });
    }

    res.json({
      success: true,
      role
    });
  } catch (error) {
    logger.error('Erro ao obter role:', error);
    next(error);
  }
};

// POST /api/rbac/roles - Criar role customizado
export const createRole = async (req, res, next) => {
  try {
    const { name, displayName, description, level, priority, permissions } = req.body;
    const { organizationId } = req.user;

    // Verificar se já existe role com este nome na organização
    const existing = await Role.findOne({
      where: { name, organizationId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um role com este nome'
      });
    }

    // Criar role
    const role = await Role.create({
      name,
      displayName,
      description,
      level,
      priority: priority || 500,
      organizationId,
      isSystem: false,
      isActive: true
    });

    // Associar permissões
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await RolePermission.create({
          roleId: role.id,
          permissionId,
          granted: true
        });
      }
    }

    logger.info(`Role customizado criado: ${role.name} por ${req.user.email}`);

    // Recarregar com permissões
    const roleWithPermissions = await Role.findByPk(role.id, {
      include: [{
        model: Permission,
        as: 'permissions'
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Role criado com sucesso',
      role: roleWithPermissions
    });
  } catch (error) {
    logger.error('Erro ao criar role:', error);
    next(error);
  }
};

// PUT /api/rbac/roles/:id - Atualizar role
export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { displayName, description, priority, permissions } = req.body;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role não encontrado'
      });
    }

    // Para roles do sistema, apenas org-admin pode editar permissões
    if (role.isSystem) {
      if (req.user.role !== 'org-admin') {
        return res.status(403).json({
          success: false,
          error: 'Apenas org-admin pode editar permissões de roles do sistema'
        });
      }

      // Para roles do sistema, apenas atualizar permissões (não outros campos)
      if (permissions) {
        // Remover permissões antigas
        await RolePermission.destroy({
          where: { roleId: role.id }
        });

        // Adicionar novas
        for (const permissionId of permissions) {
          await RolePermission.create({
            roleId: role.id,
            permissionId,
            granted: true
          });
        }
      }

      logger.info(`Permissões do role do sistema atualizadas: ${role.name} por ${req.user.email}`);

      // Recarregar com permissões
      const updatedRole = await Role.findByPk(role.id, {
        include: [{
          model: Permission,
          as: 'permissions'
        }]
      });

      return res.json({
        success: true,
        message: 'Permissões do role atualizadas com sucesso',
        role: updatedRole
      });
    }

    // Verificar ownership para roles customizados
    if (role.organizationId !== req.user.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para editar este role'
      });
    }

    // Atualizar role customizado
    await role.update({
      displayName,
      description,
      priority
    });

    // Atualizar permissões se fornecidas
    if (permissions) {
      // Remover permissões antigas
      await RolePermission.destroy({
        where: { roleId: role.id }
      });

      // Adicionar novas
      for (const permissionId of permissions) {
        await RolePermission.create({
          roleId: role.id,
          permissionId,
          granted: true
        });
      }
    }

    logger.info(`Role atualizado: ${role.name} por ${req.user.email}`);

    // Recarregar com permissões
    const updatedRole = await Role.findByPk(role.id, {
      include: [{
        model: Permission,
        as: 'permissions'
      }]
    });

    res.json({
      success: true,
      message: 'Role atualizado com sucesso',
      role: updatedRole
    });
  } catch (error) {
    logger.error('Erro ao atualizar role:', error);
    next(error);
  }
};

// DELETE /api/rbac/roles/:id - Eliminar role
export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role não encontrado'
      });
    }

    // Não pode eliminar roles do sistema
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível eliminar roles do sistema'
      });
    }

    // Verificar ownership
    if (role.organizationId !== req.user.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para eliminar este role'
      });
    }

    // Verificar se há utilizadores usando este role
    const usersCount = await User.count({
      where: { role: role.name }
    });

    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Não é possível eliminar. ${usersCount} utilizador(es) têm este role.`
      });
    }

    await role.destroy();

    logger.info(`Role eliminado: ${role.name} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Role eliminado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao eliminar role:', error);
    next(error);
  }
};

// ==================== PERMISSIONS ====================

// GET /api/rbac/permissions - Listar todas as permissões
export const getPermissions = async (req, res, next) => {
  try {
    const { category } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }

    const permissions = await Permission.findAll({
      where,
      order: [['category', 'ASC'], ['resource', 'ASC'], ['action', 'ASC']]
    });

    // Agrupar por categoria
    const grouped = permissions.reduce((acc, perm) => {
      const cat = perm.category || 'Outros';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      permissions,
      grouped,
      categories: Object.keys(grouped)
    });
  } catch (error) {
    logger.error('Erro ao listar permissões:', error);
    next(error);
  }
};

// ==================== USER PERMISSIONS ====================

// GET /api/rbac/users/:userId/permissions - Obter permissões de um utilizador
export const getUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verificar se pode acessar este utilizador
    if (userId !== req.user.id && req.user.role !== 'org-admin') {
      const canAccess = await permissionService.canAccessUserResource(
        req.user,
        userId,
        'users',
        'read'
      );

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para ver permissões deste utilizador'
        });
      }
    }

    const permissions = await permissionService.getUserPermissions(userId);

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role']
    });

    res.json({
      success: true,
      user,
      permissions,
      total: permissions.length
    });
  } catch (error) {
    logger.error('Erro ao obter permissões do utilizador:', error);
    next(error);
  }
};

// POST /api/rbac/users/:userId/permissions - Conceder permissão a utilizador
export const grantUserPermission = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissionId, expiresAt, reason } = req.body;

    const userPermission = await permissionService.grantPermissionToUser(
      userId,
      permissionId,
      req.user.id,
      { expiresAt, reason }
    );

    logger.info(`Permissão ${permissionId} concedida a ${userId} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Permissão concedida com sucesso',
      userPermission
    });
  } catch (error) {
    logger.error('Erro ao conceder permissão:', error);
    next(error);
  }
};

// DELETE /api/rbac/users/:userId/permissions/:permissionId - Revogar permissão
export const revokeUserPermission = async (req, res, next) => {
  try {
    const { userId, permissionId } = req.params;

    await permissionService.revokePermissionFromUser(userId, permissionId);

    logger.info(`Permissão ${permissionId} revogada de ${userId} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Permissão revogada com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao revogar permissão:', error);
    next(error);
  }
};

// ==================== STATISTICS ====================

// GET /api/rbac/statistics - Estatísticas do sistema RBAC
export const getStatistics = async (req, res, next) => {
  try {
    const [
      totalRoles,
      customRoles,
      totalPermissions,
      totalUserPermissions,
      usersByRole
    ] = await Promise.all([
      Role.count(),
      Role.count({ where: { isSystem: false } }),
      Permission.count(),
      UserPermission.count(),
      User.findAll({
        attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: { organizationId: req.user.organizationId },
        group: ['role'],
        raw: true
      })
    ]);

    res.json({
      success: true,
      statistics: {
        totalRoles,
        systemRoles: totalRoles - customRoles,
        customRoles,
        totalPermissions,
        totalUserPermissions,
        usersByRole
      }
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error);
    next(error);
  }
};
