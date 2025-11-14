import { OrganizationUser, Organization, Direction, Department, Section } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';

// GET /api/users - Listar usuários da organização tenant (organization_users)
export const getUsers = async (req, res, next) => {
  try {
    const { search, role, isActive } = req.query;
    const organizationId = req.user.organizationId;

    // Filtrar apenas usuários da tabela organization_users
    const where = { 
      organizationId
    };

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await OrganizationUser.findAll({
      where,
      attributes: [
        'id', 'name', 'email', 'phone', 'role',
        'isActive', 'createdAt', 'lastLogin',
        'directionId', 'departmentId', 'sectionId'
      ],
      include: [
        {
          model: Direction,
          as: 'direction',
          attributes: ['id', 'name']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'directionId'],
          include: [{
            model: Direction,
            as: 'direction',
            attributes: ['id', 'name']
          }]
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'directionId'],
            include: [{
              model: Direction,
              as: 'direction',
              attributes: ['id', 'name']
            }]
          }]
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id - Buscar usuário por ID (organization_users)
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const user = await OrganizationUser.findOne({
      where: { 
        id, 
        organizationId
      },
      attributes: [
        'id', 'name', 'email', 'phone', 'role',
        'isActive', 'createdAt', 'lastLogin',
        'directionId', 'departmentId', 'sectionId'
      ],
      include: [
        {
          model: Direction,
          as: 'direction',
          attributes: ['id', 'name']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users - Criar usuário
export const createUser = async (req, res, next) => {
  try {
    console.log('📥 POST /api/users - Body:', JSON.stringify(req.body, null, 2));
    
    const { name, email, phone, password, role, directionId, departmentId, sectionId } = req.body;
    const organizationId = req.user.organizationId;

    // Apenas admin pode criar usuários (org-admin é o admin principal da organização)
    const allowedAdminRoles = ['org-admin', 'super-admin', 'admin-org', 'provider-admin'];
    if (!allowedAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar usuários'
      });
    }

    // Validar role permitido (roles da tabela organization_users)
    const validRoles = ['org-admin', 'org-manager', 'agent', 'technician'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role inválido. Utilize: ${validRoles.join(', ')}`
      });
    }

    // Verificar se email já existe na organização
    const existingUser = await OrganizationUser.findOne({
      where: {
        email,
        organizationId
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso nesta organização'
      });
    }

    const user = await OrganizationUser.create({
      name,
      email,
      phone,
      password, // Será hasheado pelo hook do modelo
      role: role || 'agent', // Default: agent
      organizationId,
      directionId: directionId || null,
      departmentId: departmentId || null,
      sectionId: sectionId || null,
      isActive: true
    });

    // Remover senha da resposta
    const userData = user.toJSON();
    delete userData.password;

    logger.info(`Usuário criado: ${user.email} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id - Atualizar usuário
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, directionId, departmentId, sectionId, isActive } = req.body;
    const organizationId = req.user.organizationId;

    const allowedAdminRoles = ['org-admin', 'super-admin', 'admin-org', 'provider-admin'];
    if (!allowedAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem atualizar usuários'
      });
    }

    const user = await OrganizationUser.findOne({
      where: { 
        id, 
        organizationId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado'
      });
    }

    // Validar role se estiver sendo alterado
    const validRoles = ['org-admin', 'org-manager', 'agent', 'technician'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role inválido. Utilize: ${validRoles.join(', ')}`
      });
    }

    // Verificar se email já existe em outro usuário
    if (email && email !== user.email) {
      const existingUser = await OrganizationUser.findOne({
        where: {
          email,
          organizationId,
          id: { [Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso nesta organização'
        });
      }
    }

    await user.update({
      name,
      email,
      phone,
      role,
      directionId: directionId !== undefined ? (directionId || null) : user.directionId,
      departmentId: departmentId !== undefined ? (departmentId || null) : user.departmentId,
      sectionId: sectionId !== undefined ? (sectionId || null) : user.sectionId,
      isActive
    });

    const userData = user.toJSON();
    delete userData.password;

    logger.info(`Usuário atualizado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id - Desativar usuário (soft delete)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const allowedAdminRoles = ['org-admin', 'super-admin', 'admin-org', 'provider-admin'];
    if (!allowedAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem desativar usuários'
      });
    }

    // Não pode desativar a si mesmo
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode desativar sua própria conta'
      });
    }

    const user = await OrganizationUser.findOne({
      where: { 
        id, 
        organizationId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado'
      });
    }

    await user.update({ isActive: false });

    logger.info(`Usuário desativado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/activate - Reativar usuário
export const activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const allowedAdminRoles = ['org-admin', 'super-admin', 'admin-org', 'provider-admin'];
    if (!allowedAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem reativar usuários'
      });
    }

    const user = await OrganizationUser.findOne({
      where: { 
        id, 
        organizationId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado'
      });
    }

    await user.update({ isActive: true });

    logger.info(`Usuário reativado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Usuário reativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/reset-password - Redefinir senha
export const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const organizationId = req.user.organizationId;

    const allowedAdminRoles = ['org-admin', 'super-admin', 'admin-org', 'provider-admin'];
    if (!allowedAdminRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem redefinir senhas'
      });
    }

    const user = await OrganizationUser.scope('withPassword').findOne({
      where: { 
        id, 
        organizationId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado'
      });
    }

    await user.update({ password: newPassword }); // Será hasheado pelo hook

    logger.info(`Senha redefinida para: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
