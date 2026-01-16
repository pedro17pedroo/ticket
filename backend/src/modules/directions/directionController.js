import { Direction, User, Department } from '../models/index.js';

// GET /api/directions - Listar direções (apenas internas do tenant, não de clientes)
export const getDirections = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    const directions = await Direction.findAll({
      where: {
        organizationId,
        clientId: null // Apenas direções internas, não das empresas clientes
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      directions,
      total: directions.length
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/directions/:id - Obter direção por ID (apenas internas)
export const getDirectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const direction = await Direction.findOne({
      where: {
        id,
        organizationId,
        clientId: null // Apenas direções internas
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!direction) {
      return res.status(404).json({
        success: false,
        error: 'Direção não encontrada'
      });
    }

    res.json({
      success: true,
      direction
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/directions - Criar direção
export const createDirection = async (req, res, next) => {
  try {
    const { name, description, code, managerId, isActive } = req.body;
    const organizationId = req.user.organizationId;

    // Apenas admin pode criar direções
    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem criar direções'
      });
    }

    const direction = await Direction.create({
      name,
      description: description && description.trim() !== '' ? description : null,
      code: code && code.trim() !== '' ? code : null,
      managerId: managerId && managerId.trim() !== '' ? managerId : null, // Converter string vazia para null
      organizationId,
      clientId: null, // Direção interna do tenant, não de cliente
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Direção criada com sucesso',
      direction
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/directions/:id - Atualizar direção
export const updateDirection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, code, managerId, isActive } = req.body;
    const organizationId = req.user.organizationId;

    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem atualizar direções'
      });
    }

    const direction = await Direction.findOne({
      where: {
        id,
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

    await direction.update({
      name,
      description: description !== undefined ? (description && description.trim() !== '' ? description : null) : undefined,
      code: code !== undefined ? (code && code.trim() !== '' ? code : null) : undefined,
      managerId: managerId !== undefined ? (managerId && managerId.trim() !== '' ? managerId : null) : undefined,
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

// DELETE /api/directions/:id - Eliminar direção
export const deleteDirection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (req.user.role !== 'org-admin') {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores podem eliminar direções'
      });
    }

    const direction = await Direction.findOne({
      where: {
        id,
        organizationId,
        clientId: null // Apenas direções internas
      },
      include: [{ model: Department, as: 'departments' }]
    });

    if (!direction) {
      return res.status(404).json({
        success: false,
        error: 'Direção não encontrada'
      });
    }

    // Verificar se tem departamentos
    if (direction.departments && direction.departments.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível eliminar uma direção com departamentos associados'
      });
    }

    await direction.destroy();

    res.json({
      success: true,
      message: 'Direção eliminada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
