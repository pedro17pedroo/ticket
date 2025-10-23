import { Department, Direction, Section, User } from '../models/index.js';

// GET /api/departments - Listar departamentos (apenas internos do tenant)
export const getDepartments = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { directionId } = req.query;

    const where = { 
      organizationId, 
      isActive: true,
      clientId: null // Apenas departamentos internos, não de clientes
    };
    if (directionId) {
      where.directionId = directionId;
    }

    const departments = await Department.findAll({
      where,
      include: [
        { 
          model: Direction, 
          as: 'direction', 
          attributes: ['id', 'name', 'code'] 
        },
        { 
          model: User, 
          as: 'manager', 
          attributes: ['id', 'name', 'email'] 
        },
        {
          model: Section,
          as: 'sections',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      departments,
      total: departments.length
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/departments - Criar departamento
export const createDepartment = async (req, res, next) => {
  try {
    const { name, description, code, email, directionId, managerId, isActive } = req.body;
    const organizationId = req.user.organizationId;

    // Verificar se direção existe (se fornecida) - apenas internas
    if (directionId) {
      const direction = await Direction.findOne({
        where: { 
          id: directionId, 
          organizationId,
          clientId: null // Apenas direções internas
        }
      });

      if (!direction) {
        return res.status(404).json({
          success: false,
          error: 'Direção não encontrada'
        });
      }
    }

    const department = await Department.create({
      organizationId,
      directionId,
      name,
      description,
      code,
      email,
      managerId,
      clientId: null, // Departamento interno do tenant
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Departamento criado com sucesso',
      department
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/departments/:id - Atualizar departamento
export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, code, email, directionId, managerId, isActive } = req.body;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      where: { 
        id, 
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

    // Verificar se direção existe (se fornecida) - apenas internas
    if (directionId && directionId !== department.directionId) {
      const direction = await Direction.findOne({
        where: { 
          id: directionId, 
          organizationId,
          clientId: null
        }
      });

      if (!direction) {
        return res.status(404).json({
          success: false,
          error: 'Direção não encontrada'
        });
      }
    }

    await department.update({
      name,
      description,
      code,
      email,
      directionId,
      managerId,
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

// DELETE /api/departments/:id - Eliminar departamento (soft delete)
export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      where: { 
        id, 
        organizationId,
        clientId: null // Apenas departamentos internos
      },
      include: [{ model: Section, as: 'sections' }]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }

    // Verificar se tem secções
    if (department.sections && department.sections.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível eliminar um departamento com secções associadas'
      });
    }

    await department.update({ isActive: false });

    res.json({
      success: true,
      message: 'Departamento removido com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/departments/:id - Obter departamento por ID
export const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      where: { id, organizationId },
      include: [
        { 
          model: Direction, 
          as: 'direction', 
          attributes: ['id', 'name', 'code'] 
        },
        { 
          model: User, 
          as: 'manager', 
          attributes: ['id', 'name', 'email'] 
        },
        {
          model: Section,
          as: 'sections',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }

    res.json({
      success: true,
      department
    });
  } catch (error) {
    next(error);
  }
};
