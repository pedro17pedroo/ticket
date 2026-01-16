import { Section, User, Department } from '../models/index.js';

// GET /api/sections - Listar secções (apenas internas do tenant)
export const getSections = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { departmentId } = req.query;

    const where = {
      organizationId,
      clientId: null // Apenas secções internas, não de clientes
    };
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const sections = await Section.findAll({
      where,
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      sections,
      total: sections.length
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sections/:id - Obter secção por ID
export const getSectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const section = await Section.findOne({
      where: {
        id,
        organizationId,
        clientId: null // Apenas secções internas
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Secção não encontrada'
      });
    }

    res.json({
      success: true,
      section
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sections - Criar secção
export const createSection = async (req, res, next) => {
  try {
    const { name, description, code, departmentId, managerId, isActive } = req.body;
    const organizationId = req.user.organizationId;

    // Apenas admin pode criar secções
    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar secções'
      });
    }

    // Verificar se departamento existe e pertence à organização - apenas internos
    const department = await Department.findOne({
      where: {
        id: departmentId,
        organizationId,
        clientId: null // Apenas departamentos internos
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }

    const section = await Section.create({
      name,
      description: description && description.trim() !== '' ? description : null,
      code: code && code.trim() !== '' ? code : null,
      departmentId,
      managerId: managerId && managerId.trim() !== '' ? managerId : null,
      organizationId,
      clientId: null, // Secção interna do tenant
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Secção criada com sucesso',
      section
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sections/:id - Atualizar secção
export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, code, departmentId, managerId, isActive } = req.body;
    const organizationId = req.user.organizationId;

    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem atualizar secções'
      });
    }

    const section = await Section.findOne({
      where: {
        id,
        organizationId,
        clientId: null // Apenas secções internas
      }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Secção não encontrada'
      });
    }

    // Se mudou departamento, verificar se existe - apenas internos
    if (departmentId && departmentId !== section.departmentId) {
      const department = await Department.findOne({
        where: {
          id: departmentId,
          organizationId,
          clientId: null // Apenas departamentos internos
        }
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          error: 'Departamento não encontrado'
        });
      }
    }

    await section.update({
      name,
      description: description !== undefined ? (description && description.trim() !== '' ? description : null) : undefined,
      code: code !== undefined ? (code && code.trim() !== '' ? code : null) : undefined,
      departmentId,
      managerId: managerId !== undefined ? (managerId && managerId.trim() !== '' ? managerId : null) : undefined,
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

// DELETE /api/sections/:id - Eliminar secção
export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem eliminar secções'
      });
    }

    const section = await Section.findOne({
      where: {
        id,
        organizationId,
        clientId: null // Apenas secções internas
      }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Secção não encontrada'
      });
    }

    await section.destroy();

    res.json({
      success: true,
      message: 'Secção eliminada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
