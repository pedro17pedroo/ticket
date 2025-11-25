import Comment from './commentModel.js';
import { User } from '../models/index.js';
import OrganizationUser from '../../models/OrganizationUser.js';
import ClientUser from '../../models/ClientUser.js';
import Attachment from '../attachments/attachmentModel.js';
import logger from '../../config/logger.js';

/**
 * Listar comentários de um ticket
 * GET /api/tickets/:ticketId/comments
 */
export const getTicketComments = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const comments = await Comment.findAll({
      where: { 
        ticketId,
        organizationId: req.user.organizationId 
      },
      include: [
        {
          model: User,
          as: 'authorUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'authorOrgUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: ClientUser,
          as: 'authorClientUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'filename', 'originalName', 'mimetype', 'size', 'path'],
          required: false
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Formatar comentários com author unificado
    const formattedComments = comments.map(comment => {
      const commentData = comment.toJSON();
      
      // Determinar author baseado no tipo
      let author = null;
      if (comment.authorType === 'provider' && comment.authorUser) {
        author = {
          ...comment.authorUser,
          type: 'provider'
        };
      } else if (comment.authorType === 'organization' && comment.authorOrgUser) {
        author = {
          ...comment.authorOrgUser,
          type: 'organization'
        };
      } else if (comment.authorType === 'client' && comment.authorClientUser) {
        author = {
          ...comment.authorClientUser,
          type: 'client'
        };
      }

      // Remover campos polimórficos do retorno
      delete commentData.authorUser;
      delete commentData.authorOrgUser;
      delete commentData.authorClientUser;
      delete commentData.authorUserId;
      delete commentData.authorOrgUserId;
      delete commentData.authorClientUserId;

      return {
        ...commentData,
        author
      };
    });

    res.json({
      success: true,
      comments: formattedComments
    });
  } catch (error) {
    logger.error('Erro ao listar comentários:', error);
    next(error);
  }
};

/**
 * Criar comentário em um ticket
 * POST /api/tickets/:ticketId/comments
 */
export const createComment = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { content, isInternal = false } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo do comentário é obrigatório'
      });
    }

    // Determinar tipo de autor baseado no role
    let authorType = 'provider';
    let authorUserId = req.user.id;
    let authorOrgUserId = null;
    let authorClientUserId = null;

    if (['gerente', 'supervisor', 'agente'].includes(req.user.role)) {
      authorType = 'organization';
      authorOrgUserId = req.user.id;
      authorUserId = null;
    } else if (['client-admin', 'client-user', 'client-viewer'].includes(req.user.role)) {
      authorType = 'client';
      authorClientUserId = req.user.id;
      authorUserId = null;
    }

    const comment = await Comment.create({
      ticketId,
      organizationId: req.user.organizationId,
      content: content.trim(),
      isInternal,
      authorType,
      authorUserId,
      authorOrgUserId,
      authorClientUserId,
      // Manter userId para compatibilidade
      userId: req.user.id
    });

    // Buscar comentário com author
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'authorUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'authorOrgUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: ClientUser,
          as: 'authorClientUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        }
      ]
    });

    // Formatar resposta
    const commentData = commentWithAuthor.toJSON();
    let author = null;
    
    if (authorType === 'provider' && commentWithAuthor.authorUser) {
      author = { ...commentWithAuthor.authorUser, type: 'provider' };
    } else if (authorType === 'organization' && commentWithAuthor.authorOrgUser) {
      author = { ...commentWithAuthor.authorOrgUser, type: 'organization' };
    } else if (authorType === 'client' && commentWithAuthor.authorClientUser) {
      author = { ...commentWithAuthor.authorClientUser, type: 'client' };
    }

    delete commentData.authorUser;
    delete commentData.authorOrgUser;
    delete commentData.authorClientUser;

    res.status(201).json({
      success: true,
      comment: {
        ...commentData,
        author
      }
    });
  } catch (error) {
    logger.error('Erro ao criar comentário:', error);
    next(error);
  }
};

/**
 * Atualizar comentário
 * PUT /api/tickets/:ticketId/comments/:commentId
 */
export const updateComment = async (req, res, next) => {
  try {
    const { ticketId, commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findOne({
      where: {
        id: commentId,
        ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comentário não encontrado'
      });
    }

    // Verificar se é o autor
    const isAuthor = comment.userId === req.user.id ||
                     comment.authorUserId === req.user.id ||
                     comment.authorOrgUserId === req.user.id ||
                     comment.authorClientUserId === req.user.id;

    if (!isAuthor && !['org-admin', 'gerente'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o autor ou administrador pode editar este comentário'
      });
    }

    await comment.update({
      content: content.trim()
    });

    res.json({
      success: true,
      comment
    });
  } catch (error) {
    logger.error('Erro ao atualizar comentário:', error);
    next(error);
  }
};

/**
 * Eliminar comentário
 * DELETE /api/tickets/:ticketId/comments/:commentId
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { ticketId, commentId } = req.params;

    const comment = await Comment.findOne({
      where: {
        id: commentId,
        ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comentário não encontrado'
      });
    }

    // Verificar se é o autor ou admin
    const isAuthor = comment.userId === req.user.id ||
                     comment.authorUserId === req.user.id ||
                     comment.authorOrgUserId === req.user.id ||
                     comment.authorClientUserId === req.user.id;

    if (!isAuthor && !['org-admin', 'gerente'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o autor ou administrador pode eliminar este comentário'
      });
    }

    await comment.destroy();

    res.json({
      success: true,
      message: 'Comentário eliminado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao eliminar comentário:', error);
    next(error);
  }
};
