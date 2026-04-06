import Category from './categoryModel.js';

// GET /api/categories - Listar todas as categorias
export const getCategories = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    
    const categories = await Category.findAll({
      where: { organizationId },
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id - Obter categoria por ID
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const category = await Category.findOne({
      where: { id, organizationId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories - Criar nova categoria
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;
    const organizationId = req.user.organizationId;

    const category = await Category.create({
      name,
      description,
      icon,
      color,
      organizationId,
    });

    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id - Atualizar categoria
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;
    const organizationId = req.user.organizationId;

    const category = await Category.findOne({
      where: { id, organizationId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    const oldData = { ...category.toJSON() };

    await category.update({
      name,
      description,
      icon,
      color,
    });

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id - Eliminar categoria
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const category = await Category.findOne({
      where: { id, organizationId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    const categoryData = { ...category.toJSON() };
    await category.destroy();

    res.json({
      success: true,
      message: 'Categoria eliminada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};
