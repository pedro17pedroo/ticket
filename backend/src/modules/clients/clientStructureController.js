import { Direction, Department, Section, Client, ClientUser, User, OrganizationUser } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';

// ==================== DIRECTIONS ====================

// GET /api/client/directions - Listar direções do cliente
export const getDirections = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId;

    const directions = await Direction.findAll({
      where: {
        organizationId,
        clientId
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      directions
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/client/directions - Criar direção
export const createDirection = async (req, res, next) => {
  try {
    const { name, description, code, managerId } = req.body;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem criar direções'
      });
    }

    const direction = await Direction.create({
      name,
      description,
      code,
      managerId,
      organizationId,
      clientId
    });

    logger.info(`Direção criada por cliente: ${direction.name} (${clientId})`);

    res.status(201).json({
      success: true,
      message: 'Direção criada com sucesso',
      direction
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/client/directions/:id - Atualizar direção
export const updateDirection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, code, managerId, isActive } = req.body;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem atualizar direções'
      });
    }

    const direction = await Direction.findOne({
      where: { id, organizationId, clientId }
    });

    if (!direction) {
      return res.status(404).json({
        success: false,
        error: 'Direção não encontrada'
      });
    }

    await direction.update({
      name,
      description,
      code,
      managerId,
      isActive
    });

    res.json({
      success: true,
      message: 'Direção atualizada com sucesso',
      direction
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/client/directions/:id - Desativar direção
export const deleteDirection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem desativar direções'
      });
    }

    const direction = await Direction.findOne({
      where: { id, organizationId, clientId }
    });

    if (!direction) {
      return res.status(404).json({
        success: false,
        error: 'Direção não encontrada'
      });
    }

    await direction.update({ isActive: false });

    res.json({
      success: true,
      message: 'Direção desativada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DEPARTMENTS ====================

// GET /api/client/departments - Listar departamentos do cliente
export const getDepartments = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    const departments = await Department.findAll({
      where: {
        organizationId,
        clientId
      },
      attributes: ['id', 'name', 'code', 'description', 'email', 'directionId', 'isActive'],
      include: [
        {
          model: Direction,
          as: 'direction',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      departments
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/client/departments - Criar departamento
export const createDepartment = async (req, res, next) => {
  try {
    const { name, description, code, directionId, managerId, email } = req.body;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem criar departamentos'
      });
    }

    const department = await Department.create({
      name,
      description,
      code,
      directionId,
      managerId,
      email,
      organizationId,
      clientId
    });

    logger.info(`Departamento criado por cliente: ${department.name} (${clientId})`);

    res.status(201).json({
      success: true,
      message: 'Departamento criado com sucesso',
      department
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/client/departments/:id - Atualizar departamento
export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, code, directionId, managerId, email, isActive } = req.body;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem atualizar departamentos'
      });
    }

    const department = await Department.findOne({
      where: { id, organizationId, clientId }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }

    await department.update({
      name,
      description,
      code,
      directionId,
      managerId,
      email,
      isActive
    });

    res.json({
      success: true,
      message: 'Departamento atualizado com sucesso',
      department
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/client/departments/:id - Desativar departamento
export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem desativar departamentos'
      });
    }

    const department = await Department.findOne({
      where: { id, organizationId, clientId }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }

    await department.update({ isActive: false });

    res.json({
      success: true,
      message: 'Departamento desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SECTIONS ====================

// GET /api/client/sections - Listar secções do cliente
export const getSections = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    const sections = await Section.findAll({
      where: {
        organizationId,
        clientId
      },
      attributes: ['id', 'name', 'code', 'description', 'departmentId', 'isActive'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
          include: [
            {
              model: Direction,
              as: 'direction',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      sections
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/client/sections - Criar secção
export const createSection = async (req, res, next) => {
  try {
    const { name, description, code, departmentId, managerId } = req.body;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem criar secções'
      });
    }

    const section = await Section.create({
      name,
      description,
      code,
      departmentId,
      managerId,
      organizationId,
      clientId
    });

    logger.info(`Secção criada por cliente: ${section.name} (${clientId})`);

    res.status(201).json({
      success: true,
      message: 'Secção criada com sucesso',
      section
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/client/sections/:id - Atualizar secção
export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, code, departmentId, managerId, isActive } = req.body;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem atualizar secções'
      });
    }

    const section = await Section.findOne({
      where: { id, organizationId, clientId }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Secção não encontrada'
      });
    }

    await section.update({
      name,
      description,
      code,
      departmentId,
      managerId,
      isActive
    });

    res.json({
      success: true,
      message: 'Secção atualizada com sucesso',
      section
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/client/sections/:id - Desativar secção
export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId || req.user.id;

    if (req.user.role !== 'client-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores do cliente podem desativar secções'
      });
    }

    const section = await Section.findOne({
      where: { id, organizationId, clientId }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Secção não encontrada'
      });
    }

    await section.update({ isActive: false });

    res.json({
      success: true,
      message: 'Secção desativada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== USERS ====================

// GET /api/client/users - Listar usuários do cliente
export const getClientUsers = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId;

    const users = await ClientUser.findAll({
      where: {
        organizationId,
        clientId,
        isActive: true
      },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'tradeName']
        }
      ],
      attributes: { exclude: ['password'] },
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

// POST /api/client/users - Criar usuário cliente
export const createClientUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, directionId, departmentId, sectionId } = req.body;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId;

    // Verificar se email já existe
    const existingUser = await ClientUser.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);

    const user = await ClientUser.create({
      name,
      email,
      phone,
      password: tempPassword,
      role: role || 'client-user',
      organizationId,
      clientId,
      position: req.body.position || null,
      departmentName: req.body.departmentName || null,
      isActive: true,
      settings: {
        ...ClientUser.rawAttributes.settings.defaultValue,
        mustChangePassword: true
      }
    });

    logger.info(`Usuário cliente criado: ${user.email} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        ...user.toJSON(),
        tempPassword // Enviar senha temporária apenas na criação
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/client/users/:id - Atualizar usuário cliente
export const updateClientUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, role, position, departmentName, isActive } = req.body;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId;

    const user = await ClientUser.findOne({
      where: {
        id,
        organizationId,
        clientId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Não permitir que usuário mude seu próprio role
    if (user.id === req.user.id && role && role !== user.role) {
      return res.status(403).json({
        success: false,
        error: 'Não pode alterar seu próprio perfil de acesso'
      });
    }

    await user.update({
      name: name || user.name,
      phone: phone !== undefined ? phone : user.phone,
      role: role || user.role,
      position: position !== undefined ? position : user.position,
      departmentName: departmentName !== undefined ? departmentName : user.departmentName,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/client/users/:id - Desativar usuário cliente
export const deleteClientUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const clientId = req.user.clientId;

    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Não pode desativar sua própria conta'
      });
    }

    const user = await ClientUser.findOne({
      where: {
        id,
        organizationId,
        clientId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    await user.update({ isActive: false });

    logger.info(`Usuário cliente desativado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
