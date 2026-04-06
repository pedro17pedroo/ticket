import Type from './typeModel.js';

// GET /api/types - Listar todos os tipos
export const getTypes = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    
    const types = await Type.findAll({
      where: { organizationId },
      order: [['order', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      types,
      total: types.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/types/:id - Obter tipo por ID
export const getTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const type = await Type.findOne({
      where: { id, organizationId },
    });

    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Tipo não encontrado',
      });
    }

    res.json({
      success: true,
      type,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/types - Criar novo tipo
export const createType = async (req, res, next) => {
  try {
    const { name, description, icon, color, order } = req.body;
    const organizationId = req.user.organizationId;

    const type = await Type.create({
      name,
      description,
      icon,
      color,
      order: order || 0,
      organizationId,
    });

    res.status(201).json({
      success: true,
      message: 'Tipo criado com sucesso',
      type,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/types/:id - Atualizar tipo
export const updateType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, order, isActive } = req.body;
    const organizationId = req.user.organizationId;

    const type = await Type.findOne({
      where: { id, organizationId },
    });

    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Tipo não encontrado',
      });
    }

    await type.update({
      name,
      description,
      icon,
      color,
      order,
      isActive,
    });

    res.json({
      success: true,
      message: 'Tipo atualizado com sucesso',
      type,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/types/:id - Eliminar tipo
export const deleteType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const type = await Type.findOne({
      where: { id, organizationId },
    });

    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Tipo não encontrado',
      });
    }

    await type.destroy();

    res.json({
      success: true,
      message: 'Tipo eliminado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};
