import { Tag, TicketTag } from './tagModel.js';
import { Ticket } from '../models/index.js';
import logger from '../../config/logger.js';

// Listar todas as tags da organização
export const getTags = async (req, res, next) => {
  try {
    const tags = await Tag.findAll({
      where: { organizationId: req.user.organizationId },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      tags
    });
  } catch (error) {
    next(error);
  }
};

// Criar nova tag
export const createTag = async (req, res, next) => {
  try {
    const { name, color, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da tag é obrigatório' });
    }

    // Verificar se já existe
    const existing = await Tag.findOne({
      where: {
        organizationId: req.user.organizationId,
        name
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Já existe uma tag com este nome' });
    }

    const tag = await Tag.create({
      organizationId: req.user.organizationId,
      name,
      color: color || '#3B82F6',
      description
    });

    logger.info(`Tag criada: ${name}`);

    res.json({
      success: true,
      tag
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar tag
export const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;

    const tag = await Tag.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    await tag.update({ name, color, description });

    res.json({
      success: true,
      tag
    });
  } catch (error) {
    next(error);
  }
};

// Deletar tag
export const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    // Remover associações com tickets
    await TicketTag.destroy({ where: { tagId: id } });

    await tag.destroy();

    logger.info(`Tag deletada: ${tag.name}`);

    res.json({
      success: true,
      message: 'Tag deletada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Adicionar tag a um ticket
export const addTagToTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { tagId } = req.body;

    // Verificar se ticket existe
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar se tag existe
    const tag = await Tag.findOne({
      where: {
        id: tagId,
        organizationId: req.user.organizationId
      }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    // Verificar se já está associada
    const existing = await TicketTag.findOne({
      where: { ticketId, tagId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Tag já adicionada a este ticket' });
    }

    await TicketTag.create({ ticketId, tagId });

    res.json({
      success: true,
      message: 'Tag adicionada ao ticket'
    });
  } catch (error) {
    next(error);
  }
};

// Remover tag de um ticket
export const removeTagFromTicket = async (req, res, next) => {
  try {
    const { ticketId, tagId } = req.params;

    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    await TicketTag.destroy({
      where: { ticketId, tagId }
    });

    res.json({
      success: true,
      message: 'Tag removida do ticket'
    });
  } catch (error) {
    next(error);
  }
};

// Listar tags de um ticket
export const getTicketTags = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const ticketTags = await TicketTag.findAll({
      where: { ticketId },
      include: [{
        model: Tag,
        as: 'tag'
      }]
    });

    const tags = ticketTags.map(tt => tt.tag);

    res.json({
      success: true,
      tags
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  addTagToTicket,
  removeTagFromTicket,
  getTicketTags
};
