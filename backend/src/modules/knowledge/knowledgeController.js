import KnowledgeArticle from './knowledgeModel.js';

import User from '../users/userModel.js';
import OrganizationUser from '../../models/OrganizationUser.js';
import { CatalogCategory } from '../catalog/catalogModel.js';
import { Op } from 'sequelize';

// Função para gerar slug a partir do título
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
};

// GET /api/knowledge - Listar artigos (públicos ou todos)
export const getArticles = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, categoryId, isPublished } = req.query;
    const isClient = ['client-user', 'client-admin', 'client-manager', 'client'].includes(req.user.role);

    const where = { organizationId };

    // Clientes só veem publicados
    if (isClient) {
      where.isPublished = true;
    } else if (isPublished !== undefined) {
      where.isPublished = isPublished === 'true';
    }

    if (categoryId) {
      where.catalogCategoryId = categoryId;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const articles = await KnowledgeArticle.findAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: OrganizationUser, as: 'authorOrgUser', attributes: ['id', 'name', 'email'] },
        { model: CatalogCategory, as: 'catalogCategory', attributes: ['id', 'name', 'icon', 'color'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      articles,
      total: articles.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/knowledge/:id - Obter artigo por ID
export const getArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const isClient = ['client-user', 'client-admin', 'client-manager', 'client'].includes(req.user.role);

    const where = { id, organizationId };
    if (isClient) {
      where.isPublished = true;
    }

    const article = await KnowledgeArticle.findOne({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: OrganizationUser, as: 'authorOrgUser', attributes: ['id', 'name', 'email'] },
        { model: CatalogCategory, as: 'catalogCategory', attributes: ['id', 'name', 'icon', 'color'] },
      ],
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Artigo não encontrado',
      });
    }

    // Incrementar visualizações
    await article.increment('viewCount');

    res.json({
      success: true,
      article,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/knowledge - Criar novo artigo
export const createArticle = async (req, res, next) => {
  try {
    const { title, content, categoryId, catalogCategoryId, isPublished } = req.body;
    // Suportar tanto categoryId (legado) quanto catalogCategoryId (novo)
    const finalCategoryId = catalogCategoryId || categoryId;
    const organizationId = req.user.organizationId;
    const authorId = req.user.id;

    // Apenas admin-org e agentes podem criar artigos
    if (req.user.role === 'cliente-org') {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para criar artigos',
      });
    }

    // Gerar slug a partir do título
    let slug = generateSlug(title);

    // Verificar se slug já existe e adicionar sufixo se necessário
    let slugExists = await KnowledgeArticle.findOne({ where: { slug, organizationId } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(title)}-${counter}`;
      slugExists = await KnowledgeArticle.findOne({ where: { slug, organizationId } });
      counter++;
    }

    const article = await KnowledgeArticle.create({
      title,
      slug,
      content,
      catalogCategoryId: finalCategoryId && finalCategoryId.trim() !== '' ? finalCategoryId : null,
      isPublished: isPublished || false,
      publishedAt: isPublished ? new Date() : null,
      authorId,
      organizationId,
    });


    res.status(201).json({
      success: true,
      message: 'Artigo criado com sucesso',
      article,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/knowledge/:id - Atualizar artigo
export const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, catalogCategoryId, isPublished } = req.body;
    // Suportar tanto categoryId (legado) quanto catalogCategoryId (novo)
    const finalCategoryId = catalogCategoryId !== undefined ? catalogCategoryId : categoryId;
    const organizationId = req.user.organizationId;

    if (req.user.role === 'cliente-org') {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para atualizar artigos',
      });
    }

    const article = await KnowledgeArticle.findOne({
      where: { id, organizationId },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Artigo não encontrado',
      });
    }

    const oldData = { ...article.toJSON() };

    // Se o título mudou, gerar novo slug
    let slug = article.slug;
    if (title && title !== article.title) {
      slug = generateSlug(title);

      // Verificar se slug já existe
      let slugExists = await KnowledgeArticle.findOne({
        where: {
          slug,
          organizationId,
          id: { [Op.ne]: id } // Excluir o próprio artigo
        }
      });
      let counter = 1;
      while (slugExists) {
        slug = `${generateSlug(title)}-${counter}`;
        slugExists = await KnowledgeArticle.findOne({
          where: {
            slug,
            organizationId,
            id: { [Op.ne]: id }
          }
        });
        counter++;
      }
    }

    await article.update({
      title,
      slug,
      content,
      catalogCategoryId: finalCategoryId !== undefined ? (finalCategoryId && finalCategoryId.trim() !== '' ? finalCategoryId : null) : undefined,
      isPublished,
      publishedAt: isPublished && !oldData.isPublished ? new Date() : article.publishedAt,
    });


    res.json({
      success: true,
      message: 'Artigo atualizado com sucesso',
      article,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/knowledge/:id - Eliminar artigo
export const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (req.user.role === 'cliente-org') {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para eliminar artigos',
      });
    }

    const article = await KnowledgeArticle.findOne({
      where: { id, organizationId },
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Artigo não encontrado',
      });
    }

    const articleData = { ...article.toJSON() };
    await article.destroy();


    res.json({
      success: true,
      message: 'Artigo eliminado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};
