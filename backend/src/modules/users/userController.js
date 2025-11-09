import { User, Organization, Direction, Department, Section } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';

// GET /api/users - Listar usuários da organização (apenas internos, não clientes)
export const getUsers = async (req, res, next) => {
  try {
    const { search, role, isActive } = req.query;
    const organizationId = req.user.organizationId;

    // Excluir utilizadores de clientes - mostrar apenas utilizadores internos do tenant
    const where = { 
      organizationId,
      role: { [Op.ne]: 'cliente-org' } // Excluir clientes
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

    const users = await User.findAll({
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
          attributes: ['id', 'name']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name']
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

// GET /api/users/:id - Buscar usuário por ID (apenas internos, não clientes)
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const user = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: { [Op.ne]: 'cliente-org' } // Excluir clientes
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

    // Apenas admin pode criar usuários
    if (req.user.role !== 'admin-org' && req.user.role !== 'super-admin' && req.user.role !== 'tenant-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar usuários'
      });
    }

    // Não permitir criar utilizadores cliente-org por este endpoint
    if (role === 'cliente-org') {
      return res.status(400).json({
        success: false,
        error: 'Utilize o endpoint /api/clients para criar utilizadores de clientes'
      });
    }

    // Verificar se email já existe na organização
    const existingUser = await User.findOne({
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

    const user = await User.create({
      name,
      email,
      phone,
      password, // Será hasheado pelo hook do modelo
      role: role || 'agent', // Default: agent (suporte)
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

    if (req.user.role !== 'admin-org' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem atualizar usuários'
      });
    }

    const user = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: { [Op.ne]: 'cliente-org' } // Apenas utilizadores internos
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado ou é um utilizador de cliente'
      });
    }

    // Não permitir mudar role para cliente-org
    if (role === 'cliente-org') {
      return res.status(400).json({
        success: false,
        error: 'Não é possível alterar role para cliente-org através deste endpoint'
      });
    }

    // Verificar se email já existe em outro usuário
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
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

    if (req.user.role !== 'admin-org' && req.user.role !== 'super-admin') {
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

    const user = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: { [Op.ne]: 'cliente-org' } // Apenas utilizadores internos
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado ou é um utilizador de cliente'
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

    if (req.user.role !== 'admin-org' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem reativar usuários'
      });
    }

    const user = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: { [Op.ne]: 'cliente-org' } // Apenas utilizadores internos
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado ou é um utilizador de cliente'
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

    if (req.user.role !== 'admin-org' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem redefinir senhas'
      });
    }

    const user = await User.findOne({
      where: { 
        id, 
        organizationId,
        role: { [Op.ne]: 'cliente-org' } // Apenas utilizadores internos
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilizador não encontrado ou é um utilizador de cliente'
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
