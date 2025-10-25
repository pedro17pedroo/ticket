import { ResponseTemplate } from './templateModel.js';
import { User, Category } from '../models/index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

// Listar templates
export const getTemplates = async (req, res, next) => {
  try {
    const { categoryId } = req.query;

    const where = {
      organizationId: req.user.organizationId
    };

    // Se não é admin, só ver públicos ou próprios
    if (req.user.role !== 'admin-org') {
      where[Op.or] = [
        { isPublic: true },
        { createdBy: req.user.id }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const templates = await ResponseTemplate.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['usageCount', 'DESC'], ['name', 'ASC']]
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
    const { name, subject, content, isPublic, categoryId } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Nome e conteúdo são obrigatórios' });
    }

    const template = await ResponseTemplate.create({
      organizationId: req.user.organizationId,
      name,
      subject,
      content,
      isPublic: isPublic !== undefined ? isPublic : true,
      categoryId: categoryId || null,
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

    const template = await ResponseTemplate.findOne({
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
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    // Incrementar contagem de uso
    await template.increment('usageCount');

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
    const { name, subject, content, isPublic, categoryId } = req.body;

    const template = await ResponseTemplate.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    // Apenas criador ou admin pode atualizar
    if (template.createdBy !== req.user.id && req.user.role !== 'admin-org') {
      return res.status(403).json({ error: 'Sem permissão para atualizar este template' });
    }

    await template.update({
      name,
      subject,
      content,
      isPublic,
      categoryId
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

    const template = await ResponseTemplate.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    // Apenas criador ou admin pode deletar
    if (template.createdBy !== req.user.id && req.user.role !== 'admin-org') {
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
