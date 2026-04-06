import { ResponseTemplate as Template, User, OrganizationUser, CatalogCategory } from '../models/index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

// Listar templates
export const getTemplates = async (req, res, next) => {
  try {
    const { categoryId, catalogCategoryId } = req.query;
    // Suportar tanto categoryId (legado) quanto catalogCategoryId (novo)
    const finalCategoryId = catalogCategoryId || categoryId;

    const where = {
      organizationId: req.user.organizationId
    };

    // Filtrar apenas templates ativos
    where.isActive = true;

    if (finalCategoryId) {
      where.catalogCategoryId = finalCategoryId;
    }

    const templates = await Template.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: OrganizationUser,
          as: 'creatorOrgUser',
          attributes: ['id', 'name']
        },
        {
          model: CatalogCategory,
          as: 'catalogCategory',
          attributes: ['id', 'name', 'color']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    next(error);
  }
};

// Criar template
export const createTemplate = async (req, res, next) => {
  try {
    const { name, description, type, subject, content, categoryId, catalogCategoryId, priorityId, typeId } = req.body;
    // Suportar tanto categoryId (legado) quanto catalogCategoryId (novo)
    const finalCategoryId = catalogCategoryId || categoryId;

    if (!name || !content) {
      return res.status(400).json({ error: 'Nome e conteúdo são obrigatórios' });
    }

    const template = await Template.create({
      organizationId: req.user.organizationId,
      name,
      description,
      type: type || 'ticket',
      subject,
      content,
      catalogCategoryId: finalCategoryId || null,
      priorityId: priorityId || null,
      typeId: typeId || null,
      createdBy: req.user.id
    });

    logger.info(`Template criado: ${name} por ${req.user.name}`);

    res.json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

// Obter template por ID
export const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await Template.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: OrganizationUser,
          as: 'creatorOrgUser',
          attributes: ['id', 'name']
        },
        {
          model: CatalogCategory,
          as: 'catalogCategory',
          attributes: ['id', 'name', 'color']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar template
export const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, type, subject, content, categoryId, catalogCategoryId, priorityId, typeId, isActive } = req.body;
    // Suportar tanto categoryId (legado) quanto catalogCategoryId (novo)
    const finalCategoryId = catalogCategoryId !== undefined ? catalogCategoryId : categoryId;

    const template = await Template.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    // Apenas criador ou admin pode atualizar
    if (template.createdBy !== req.user.id && req.user.role !== 'org-admin') {
      return res.status(403).json({ error: 'Sem permissão para atualizar este template' });
    }

    await template.update({
      name,
      description,
      type,
      subject,
      content,
      catalogCategoryId: finalCategoryId,
      priorityId,
      typeId,
      isActive
    });

    res.json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

// Deletar template
export const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await Template.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    // Apenas criador ou admin pode deletar
    if (template.createdBy !== req.user.id && req.user.role !== 'org-admin') {
      return res.status(403).json({ error: 'Sem permissão para deletar este template' });
    }

    await template.destroy();

    logger.info(`Template deletado: ${template.name}`);

    res.json({
      success: true,
      message: 'Template deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate
};
