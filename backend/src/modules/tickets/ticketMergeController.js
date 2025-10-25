import { Ticket, Comment, Attachment, User } from '../models/index.js';
import { TicketTag } from '../tags/tagModel.js';
import { TimeTracking } from '../timeTracking/timeTrackingModel.js';
import { HoursTransaction } from '../hours/hoursBankModel.js';
import logger from '../../config/logger.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';

// Fusão de tickets duplicados
export const mergeTickets = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { targetTicketId, sourceTicketIds } = req.body;

    if (!targetTicketId || !sourceTicketIds || sourceTicketIds.length === 0) {
      return res.status(400).json({ 
        error: 'targetTicketId e sourceTicketIds são obrigatórios' 
      });
    }

    // Buscar ticket de destino
    const targetTicket = await Ticket.findOne({
      where: {
        id: targetTicketId,
        organizationId: req.user.organizationId
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] }
      ],
      transaction
    });

    if (!targetTicket) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Ticket de destino não encontrado' });
    }

    // Buscar tickets de origem
    const sourceTickets = await Ticket.findAll({
      where: {
        id: sourceTicketIds,
        organizationId: req.user.organizationId
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name'] }
      ],
      transaction
    });

    if (sourceTickets.length !== sourceTicketIds.length) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Alguns tickets de origem não foram encontrados' });
    }

    const mergedInfo = {
      targetTicket: targetTicket.ticketNumber,
      mergedTickets: [],
      movedComments: 0,
      movedAttachments: 0,
      movedTags: 0,
      movedTimeTracking: 0,
      movedTransactions: 0
    };

    // Processar cada ticket de origem
    for (const sourceTicket of sourceTickets) {
      mergedInfo.mergedTickets.push(sourceTicket.ticketNumber);

      // Mover comentários
      const comments = await Comment.findAll({
        where: { ticketId: sourceTicket.id },
        transaction
      });
      for (const comment of comments) {
        await comment.update({ ticketId: targetTicket.id }, { transaction });
        mergedInfo.movedComments++;
      }

      // Mover anexos
      const attachments = await Attachment.findAll({
        where: { ticketId: sourceTicket.id },
        transaction
      });
      for (const attachment of attachments) {
        await attachment.update({ ticketId: targetTicket.id }, { transaction });
        mergedInfo.movedAttachments++;
      }

      // Mover tags (evitar duplicatas)
      const sourceTags = await TicketTag.findAll({
        where: { ticketId: sourceTicket.id },
        transaction
      });
      for (const sourceTag of sourceTags) {
        const existing = await TicketTag.findOne({
          where: {
            ticketId: targetTicket.id,
            tagId: sourceTag.tagId
          },
          transaction
        });
        if (!existing) {
          await TicketTag.create({
            ticketId: targetTicket.id,
            tagId: sourceTag.tagId
          }, { transaction });
          mergedInfo.movedTags++;
        }
        await sourceTag.destroy({ transaction });
      }

      // Mover time tracking
      const timeTrackings = await TimeTracking.findAll({
        where: { ticketId: sourceTicket.id },
        transaction
      });
      for (const tt of timeTrackings) {
        await tt.update({ ticketId: targetTicket.id }, { transaction });
        mergedInfo.movedTimeTracking++;
      }

      // Mover transações de horas
      const hoursTransactions = await HoursTransaction.findAll({
        where: { ticketId: sourceTicket.id },
        transaction
      });
      for (const ht of hoursTransactions) {
        await ht.update({ ticketId: targetTicket.id }, { transaction });
        mergedInfo.movedTransactions++;
      }

      // Adicionar comentário de fusão no ticket de origem
      await Comment.create({
        ticketId: sourceTicket.id,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        content: `🔀 Este ticket foi mesclado com #${targetTicket.ticketNumber}`,
        isInternal: true,
        isPrivate: false
      }, { transaction });

      // Fechar ticket de origem
      await sourceTicket.update({
        status: 'fechado',
        closedAt: new Date()
      }, { transaction });
    }

    // Adicionar comentário no ticket de destino
    const mergedList = mergedInfo.mergedTickets.map(num => `#${num}`).join(', ');
    await Comment.create({
      ticketId: targetTicket.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      content: `🔀 Tickets mesclados: ${mergedList}\n\n` +
               `📊 Resumo da fusão:\n` +
               `- ${mergedInfo.movedComments} comentário(s)\n` +
               `- ${mergedInfo.movedAttachments} anexo(s)\n` +
               `- ${mergedInfo.movedTags} tag(s)\n` +
               `- ${mergedInfo.movedTimeTracking} registro(s) de tempo\n` +
               `- ${mergedInfo.movedTransactions} transação(ões) de horas`,
      isInternal: true,
      isPrivate: false
    }, { transaction });

    await transaction.commit();

    logger.info(`Tickets mesclados: ${mergedList} -> #${targetTicket.ticketNumber} por ${req.user.name}`);

    res.json({
      success: true,
      message: `${sourceTickets.length} ticket(s) mesclado(s) com sucesso`,
      mergeInfo: mergedInfo
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erro ao mesclar tickets:', error);
    next(error);
  }
};

// Listar possíveis duplicatas (baseado em similaridade)
export const findDuplicates = async (req, res, next) => {
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

    // Buscar tickets similares (mesmo cliente, categoria, período próximo)
    const similarTickets = await Ticket.findAll({
      where: {
        organizationId: req.user.organizationId,
        id: { [Op.ne]: ticketId },
        requesterId: ticket.requesterId,
        status: { [Op.notIn]: ['fechado', 'cancelado'] },
        createdAt: {
          [Op.gte]: new Date(ticket.createdAt.getTime() - 7 * 24 * 60 * 60 * 1000), // últimos 7 dias
          [Op.lte]: new Date(ticket.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] }
      ],
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      possibleDuplicates: similarTickets
    });

  } catch (error) {
    next(error);
  }
};

export default {
  mergeTickets,
  findDuplicates
};
