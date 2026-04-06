import Priority from './priorityModel.js';

// GET /api/priorities - Listar todas as prioridades
export const getPriorities = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    
    const priorities = await Priority.findAll({
      where: { organizationId },
      order: [['order', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      priorities,
      total: priorities.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/priorities/:id - Obter prioridade por ID
export const getPriorityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const priority = await Priority.findOne({
      where: { id, organizationId },
    });

    if (!priority) {
      return res.status(404).json({
        success: false,
        error: 'Prioridade não encontrada',
      });
    }

    res.json({
      success: true,
      priority,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/priorities - Criar nova prioridade
export const createPriority = async (req, res, next) => {
  try {
    const { name, color, order } = req.body;
    const organizationId = req.user.organizationId;

    const priority = await Priority.create({
      name,
      color,
      order: order || 0,
      organizationId,
    });

    res.status(201).json({
      success: true,
      message: 'Prioridade criada com sucesso',
      priority,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/priorities/:id - Atualizar prioridade
export const updatePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, order, isActive } = req.body;
    const organizationId = req.user.organizationId;

    const priority = await Priority.findOne({
      where: { id, organizationId },
    });

    if (!priority) {
      return res.status(404).json({
        success: false,
        error: 'Prioridade não encontrada',
      });
    }

    await priority.update({
      name,
      color,
      order,
      isActive,
    });

    res.json({
      success: true,
      message: 'Prioridade atualizada com sucesso',
      priority,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/priorities/:id - Eliminar prioridade
export const deletePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const priority = await Priority.findOne({
      where: { id, organizationId },
    });

    if (!priority) {
      return res.status(404).json({
        success: false,
        error: 'Prioridade não encontrada',
      });
    }

    await priority.destroy();

    res.json({
      success: true,
      message: 'Prioridade eliminada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};
