import { Ticket, User, Department, Category, Comment, SLA, Direction, Section } from '../models/index.js';
import Attachment from '../attachments/attachmentModel.js';
import TicketRelationship from './ticketRelationshipModel.js';
import TicketHistory from './ticketHistoryModel.js';
import { logTicketChange, trackTicketChanges, getTicketHistory } from './ticketHistoryHelper.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import logger from '../../config/logger.js';
import emailService from '../../services/emailService.js';
import notificationService from '../../services/notificationService.js';
import { emitNotification, emitTicketUpdate } from '../../socket/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Listar tickets (com filtros e paginação)
export const getTickets = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority, 
      type,
      assigneeId,
      departmentId,
      search 
    } = req.query;

    const where = { organizationId: req.user.organizationId };

    // Filtros
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (assigneeId) where.assigneeId = assigneeId;
    if (departmentId) where.departmentId = departmentId;

    // Busca por texto
    if (search) {
      where[Op.or] = [
        { ticketNumber: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Clientes só veem seus próprios tickets
    if (req.user.role === 'cliente-org') {
      where.requesterId = req.user.id;
    }

    const offset = (page - 1) * limit;

    const { rows: tickets, count } = await Ticket.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon']
        }
      ]
    });

    // Buscar SLAs para todos os tickets
    const ticketsWithSLA = await Promise.all(
      tickets.map(async (ticket) => {
        let sla = null;
        if (ticket.priority) {
          sla = await SLA.findOne({
            where: {
              organizationId: req.user.organizationId,
              priority: ticket.priority,
              isActive: true
            },
            attributes: ['id', 'name', 'responseTimeMinutes', 'resolutionTimeMinutes']
          });
        }
        
        return {
          ...ticket.toJSON(),
          sla: sla || null
        };
      })
    );

    res.json({
      tickets: ticketsWithSLA,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obter ticket por ID
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOne({
      where: { id, organizationId: req.user.organizationId },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatar', 'phone']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: Direction,
          as: 'direction',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon']
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          }],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Clientes só veem seus próprios tickets
    if (req.user.role === 'cliente-org' && ticket.requesterId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar SLA baseado na prioridade do ticket
    let sla = null;
    if (ticket.priority) {
      sla = await SLA.findOne({
        where: {
          organizationId: req.user.organizationId,
          priority: ticket.priority,
          isActive: true
        },
        attributes: ['id', 'name', 'responseTimeMinutes', 'resolutionTimeMinutes']
      });
    }

    res.json({ 
      ticket: {
        ...ticket.toJSON(),
        sla: sla || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Criar ticket
export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority, type, categoryId, departmentId, assigneeId } = req.body;

    // Gerar número do ticket
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${dateStr}-${random}`;

    const ticket = await Ticket.create({
      organizationId: req.user.organizationId,
      requesterId: req.user.id,
      assigneeId: assigneeId || null,
      ticketNumber,
      subject,
      description,
      priority,
      type,
      categoryId,
      departmentId,
      source: 'portal'
    });

    // Buscar ticket com relações
    const fullTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    logger.info(`Ticket criado: ${ticket.ticketNumber} por ${req.user.email}`);

    // Enviar notificação por email (async - não bloqueia a resposta)
    if (fullTicket.assignee) {
      emailService.notifyNewTicket(fullTicket, fullTicket.requester, fullTicket.assignee)
        .catch(err => logger.error('Erro ao enviar notificação de novo ticket:', err));
      
      // Notificação in-app e WebSocket
      notificationService.notifyNewTicket(fullTicket, fullTicket.assignee.id)
        .then(notification => {
          if (notification) {
            emitNotification(fullTicket.assignee.id, notification);
          }
        })
        .catch(err => logger.error('Erro ao criar notificação in-app:', err));
    }

    res.status(201).json({
      message: 'Ticket criado com sucesso',
      ticket: fullTicket
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar ticket
export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await Ticket.findOne({
      where: { id, organizationId: req.user.organizationId },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Clientes não podem atualizar tickets (exceto adicionar comentários)
    if (req.user.role === 'cliente-org') {
      return res.status(403).json({ error: 'Clientes não podem atualizar tickets diretamente' });
    }

    // Guardar valores anteriores para histórico
    const oldTicket = { ...ticket.toJSON() };

    // Atualizar campos permitidos
    const allowedFields = [
      'subject', 
      'description', 
      'status', 
      'priority', 
      'internalPriority',
      'resolutionStatus',
      'assigneeId', 
      'directionId',
      'departmentId',
      'sectionId',
      'categoryId',
      'type'
    ];
    
    // Campos UUID que precisam converter string vazia para null
    const uuidFields = ['assigneeId', 'directionId', 'departmentId', 'sectionId', 'categoryId'];
    
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        // Converter strings vazias em null para campos UUID
        if (uuidFields.includes(field) && updates[field] === '') {
          updateData[field] = null;
        } else {
          updateData[field] = updates[field];
        }
      }
    });

    // Atualizar datas conforme status
    if (updates.status === 'resolvido' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (updates.status === 'fechado' && !ticket.closedAt) {
      updateData.closedAt = new Date();
    }

    const transaction = await sequelize.transaction();
    
    try {
      await ticket.update(updateData, { transaction });

      // Registrar mudanças no histórico
      await trackTicketChanges(
        oldTicket,
        { ...oldTicket, ...updateData },
        req.user.id,
        req.user.organizationId,
        transaction
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Recarregar ticket com relações atualizadas
    await ticket.reload({
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    logger.info(`Ticket atualizado: ${ticket.ticketNumber} por ${req.user.email}`);

    // Notificações (async - não bloqueia resposta)
    const currentUser = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email'] });

    // Notificar mudança de status
    if (updates.status && oldStatus !== updates.status) {
      const recipients = [];
      const userIds = [];
      
      if (ticket.requester?.email) recipients.push(ticket.requester.email);
      if (ticket.requester?.id) userIds.push(ticket.requester.id);
      
      if (ticket.assignee?.email && ticket.assignee.email !== req.user.email) {
        recipients.push(ticket.assignee.email);
        userIds.push(ticket.assignee.id);
      }
      
      if (recipients.length > 0) {
        // Email
        emailService.notifyStatusChange(ticket, oldStatus, updates.status, currentUser, recipients)
          .catch(err => logger.error('Erro ao enviar notificação de mudança de status:', err));
        
        // In-app e WebSocket
        notificationService.notifyStatusChange(ticket, oldStatus, updates.status, userIds)
          .then(notifications => {
            notifications.forEach(notif => {
              emitNotification(notif.userId, notif);
            });
          })
          .catch(err => logger.error('Erro ao criar notificações in-app:', err));
      }
    }

    // Notificar nova atribuição
    if (updates.assigneeId && oldAssigneeId !== updates.assigneeId) {
      const newAssignee = await User.findByPk(updates.assigneeId, { attributes: ['id', 'name', 'email'] });
      if (newAssignee) {
        // Email
        emailService.notifyTicketAssignment(ticket, newAssignee, currentUser)
          .catch(err => logger.error('Erro ao enviar notificação de atribuição:', err));
        
        // In-app e WebSocket
        notificationService.notifyTicketAssigned(ticket, newAssignee.id, currentUser.id)
          .then(notification => {
            if (notification) {
              emitNotification(newAssignee.id, notification);
            }
          })
          .catch(err => logger.error('Erro ao criar notificação in-app:', err));
      }
    }

    // Auto-consumir tempo rastreado ao concluir ticket
    let autoConsumeResult = null;
    if (updates.status === 'concluido' && oldStatus !== 'concluido') {
      const { autoConsumeOnTicketComplete } = await import('../timeTracking/timeTrackingController.js');
      autoConsumeResult = await autoConsumeOnTicketComplete(
        ticket.id,
        req.user.id,
        req.user.organizationId
      );
      
      if (autoConsumeResult.success) {
        logger.info(`Auto-consumo executado: ${autoConsumeResult.consumedHours}h`);
      } else {
        logger.info(`Auto-consumo não executado: ${autoConsumeResult.message}`);
      }
    }

    res.json({
      message: 'Ticket atualizado com sucesso',
      ticket,
      autoConsumeResult
    });
  } catch (error) {
    next(error);
  }
};

// Adicionar comentário
export const addComment = async (req, res, next) => {
  try {
    const { id: ticketId } = req.params;
    const { content, isPrivate, isInternal } = req.body;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar permissão
    if (req.user.role === 'cliente-org' && ticket.requesterId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Clientes não podem criar notas internas
    const commentData = {
      organizationId: req.user.organizationId,
      ticketId,
      userId: req.user.id,
      content,
      isPrivate: req.user.role !== 'cliente-org' ? isPrivate : false,
      isInternal: req.user.role !== 'cliente-org' ? isInternal : false
    };

    const comment = await Comment.create(commentData);

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar', 'role', 'email']
      }]
    });

    logger.info(`Comentário adicionado ao ticket ${ticket.ticketNumber} por ${req.user.email}`);

    // Enviar notificações (async - não bloqueia resposta)
    const recipients = [];
    const userIds = [];
    
    // Se for comentário interno, notificar apenas agentes
    if (comment.isInternal) {
      if (ticket.assignee?.email && ticket.assignee.email !== req.user.email) {
        recipients.push(ticket.assignee.email);
        userIds.push(ticket.assignee.id);
      }
      // TODO: Adicionar outros agentes/admins se necessário
    } else {
      // Comentário público: notificar solicitante e agente
      if (req.user.role !== 'cliente-org' && ticket.requester?.email) {
        // Agente comentou - notificar cliente
        emailService.notifyRequesterResponse(ticket, comment, fullComment.user)
          .catch(err => logger.error('Erro ao notificar solicitante:', err));
      }
      
      if (ticket.assignee?.email && ticket.assignee.email !== req.user.email) {
        recipients.push(ticket.assignee.email);
        userIds.push(ticket.assignee.id);
      }
      if (ticket.requester?.email && ticket.requester.email !== req.user.email && req.user.role === 'cliente-org') {
        recipients.push(ticket.requester.email);
        userIds.push(ticket.requester.id);
      }
    }
    
    if (recipients.length > 0) {
      // Email
      emailService.notifyNewComment(ticket, comment, fullComment.user, recipients)
        .catch(err => logger.error('Erro ao enviar notificação de comentário:', err));
      
      // In-app e WebSocket
      notificationService.notifyNewComment(ticket, comment, req.user.id, userIds)
        .then(notifications => {
          notifications.forEach(notif => {
            emitNotification(notif.userId, notif);
          });
        })
        .catch(err => logger.error('Erro ao criar notificações in-app:', err));
    }

    res.status(201).json({
      message: 'Comentário adicionado com sucesso',
      comment: fullComment
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard de estatísticas
export const getStatistics = async (req, res, next) => {
  try {
    const where = { organizationId: req.user.organizationId };

    // Clientes veem apenas suas estatísticas
    if (req.user.role === 'cliente-org') {
      where.requesterId = req.user.id;
    }

    const [total, novo, emProgresso, aguardandoCliente, resolvido, fechado] = await Promise.all([
      Ticket.count({ where }),
      Ticket.count({ where: { ...where, status: 'novo' } }),
      Ticket.count({ where: { ...where, status: 'em_progresso' } }),
      Ticket.count({ where: { ...where, status: 'aguardando_cliente' } }),
      Ticket.count({ where: { ...where, status: 'resolvido' } }),
      Ticket.count({ where: { ...where, status: 'fechado' } })
    ]);

    res.json({
      statistics: {
        total,
        byStatus: {
          novo,
          emProgresso,
          aguardandoCliente,
          resolvido,
          fechado
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Upload de anexos
export const uploadAttachments = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    // Verificar se ticket existe e se usuário tem acesso
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!ticket) {
      // Deletar arquivos enviados se ticket não existe
      files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado'
      });
    }

    // Criar registos de anexos
    const attachments = await Promise.all(
      files.map(file => 
        Attachment.create({
          ticketId,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedBy: req.user.id
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Arquivos enviados com sucesso',
      attachments: attachments.map(att => ({
        id: att.id,
        filename: att.filename,
        originalName: att.originalName,
        mimetype: att.mimetype,
        size: att.size,
        createdAt: att.createdAt
      }))
    });
  } catch (error) {
    // Limpar arquivos em caso de erro
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};

// Listar anexos de um ticket
export const getAttachments = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    // Verificar acesso ao ticket
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado'
      });
    }

    const attachments = await Attachment.findAll({
      where: { ticketId },
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      attachments
    });
  } catch (error) {
    next(error);
  }
};

// Download de anexo
export const downloadAttachment = async (req, res, next) => {
  try {
    const { ticketId, attachmentId } = req.params;

    const attachment = await Attachment.findOne({
      where: { id: attachmentId, ticketId },
      include: [{
        model: Ticket,
        as: 'ticket',
        where: { organizationId: req.user.organizationId }
      }]
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Anexo não encontrado'
      });
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    next(error);
  }
};

// Deletar anexo
export const deleteAttachment = async (req, res, next) => {
  try {
    const { ticketId, attachmentId } = req.params;

    const attachment = await Attachment.findOne({
      where: { id: attachmentId, ticketId },
      include: [{
        model: Ticket,
        as: 'ticket',
        where: { organizationId: req.user.organizationId }
      }]
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Anexo não encontrado'
      });
    }

    // Deletar arquivo físico
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    // Deletar registo
    await attachment.destroy();

    res.json({
      success: true,
      message: 'Anexo eliminado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Obter histórico de tickets de um cliente
export const getClientHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10, excludeTicketId } = req.query;

    const where = {
      organizationId: req.user.organizationId,
      requesterId: userId
    };

    // Excluir ticket atual
    if (excludeTicketId) {
      where.id = { [Op.ne]: excludeTicketId };
    }

    const tickets = await Ticket.findAll({
      where,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      tickets,
      total: tickets.length
    });
  } catch (error) {
    next(error);
  }
};

// Adicionar relacionamento entre tickets
export const addRelationship = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { relatedTicketId, relationshipType, notes } = req.body;

    // Verificar se ambos os tickets existem
    const [ticket, relatedTicket] = await Promise.all([
      Ticket.findOne({ where: { id: ticketId, organizationId: req.user.organizationId } }),
      Ticket.findOne({ where: { id: relatedTicketId, organizationId: req.user.organizationId } })
    ]);

    if (!ticket || !relatedTicket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar se já existe relacionamento
    const existing = await TicketRelationship.findOne({
      where: {
        [Op.or]: [
          { ticketId, relatedTicketId },
          { ticketId: relatedTicketId, relatedTicketId: ticketId }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Relacionamento já existe' });
    }

    // Criar relacionamento
    const relationship = await TicketRelationship.create({
      ticketId,
      relatedTicketId,
      relationshipType: relationshipType || 'related',
      notes
    });

    logger.info(`Relacionamento criado entre tickets ${ticketId} e ${relatedTicketId}`);

    res.json({
      success: true,
      relationship
    });
  } catch (error) {
    next(error);
  }
};

// Obter tickets relacionados
export const getRelatedTickets = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const relationships = await TicketRelationship.findAll({
      where: {
        [Op.or]: [
          { ticketId },
          { relatedTicketId: ticketId }
        ]
      }
    });

    // Buscar detalhes dos tickets relacionados
    const relatedTicketIds = relationships.map(r => 
      r.ticketId === ticketId ? r.relatedTicketId : r.ticketId
    );

    const tickets = await Ticket.findAll({
      where: {
        id: relatedTicketIds,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    // Mapear com tipo de relacionamento
    const result = tickets.map(ticket => {
      const rel = relationships.find(r => 
        r.ticketId === ticket.id || r.relatedTicketId === ticket.id
      );
      return {
        ...ticket.toJSON(),
        relationshipType: rel.relationshipType,
        relationshipNotes: rel.notes,
        relationshipId: rel.id
      };
    });

    res.json({
      success: true,
      tickets: result
    });
  } catch (error) {
    next(error);
  }
};

// Remover relacionamento
export const removeRelationship = async (req, res, next) => {
  try {
    const { relationshipId } = req.params;

    const relationship = await TicketRelationship.findByPk(relationshipId);

    if (!relationship) {
      return res.status(404).json({ error: 'Relacionamento não encontrado' });
    }

    await relationship.destroy();

    res.json({
      success: true,
      message: 'Relacionamento removido'
    });
  } catch (error) {
    next(error);
  }
};

// Obter histórico de um ticket
export const getHistory = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { limit = 100, offset = 0, action } = req.query;

    // Verificar se ticket existe e pertence à organização
    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const history = await getTicketHistory(ticketId, req.user.organizationId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      action
    });

    res.json({
      success: true,
      history,
      total: history.length
    });
  } catch (error) {
    next(error);
  }
};

// Transferir ticket para outra área
export const transferTicket = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ticketId } = req.params;
    const { 
      directionId, 
      departmentId, 
      sectionId, 
      assigneeId, 
      reason,
      categoryId,
      type
    } = req.body;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId },
      transaction
    });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Salvar valores antigos
    const oldValues = {
      directionId: ticket.directionId,
      departmentId: ticket.departmentId,
      sectionId: ticket.sectionId,
      assigneeId: ticket.assigneeId,
      categoryId: ticket.categoryId,
      type: ticket.type
    };

    // Atualizar ticket (converter strings vazias em null para campos UUID)
    const updates = {};
    if (directionId !== undefined) updates.directionId = directionId || null;
    if (departmentId !== undefined) updates.departmentId = departmentId || null;
    if (sectionId !== undefined) updates.sectionId = sectionId || null;
    if (assigneeId !== undefined) updates.assigneeId = assigneeId || null;
    if (categoryId !== undefined) updates.categoryId = categoryId || null;
    if (type !== undefined) updates.type = type || null;

    await ticket.update(updates, { transaction });

    // Registrar transferência no histórico
    let description = 'Ticket transferido';
    if (reason) description += `: ${reason}`;

    await logTicketChange(
      ticketId,
      req.user.id,
      req.user.organizationId,
      {
        action: 'transferred',
        field: 'transfer',
        oldValue: oldValues,
        newValue: updates,
        description,
        metadata: { reason }
      },
      transaction
    );

    // Adicionar comentário sobre a transferência
    await Comment.create({
      ticketId,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      content: `🔄 Ticket transferido${reason ? ': ' + reason : ''}`,
      isInternal: true,
      isPrivate: false
    }, { transaction });

    await transaction.commit();

    logger.info(`Ticket ${ticket.ticketNumber} transferido por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Ticket transferido com sucesso',
      ticket
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Atualizar prioridade interna
export const updateInternalPriority = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ticketId } = req.params;
    const { internalPriority, reason } = req.body;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId },
      transaction
    });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const oldPriority = ticket.internalPriority;

    await ticket.update({ internalPriority }, { transaction });

    // Registrar no histórico
    const priorityDescription = `Prioridade interna alterada de "${oldPriority || 'Não definida'}" para "${internalPriority}"` + (reason ? ': ' + reason : '');
    
    await logTicketChange(
      ticketId,
      req.user.id,
      req.user.organizationId,
      {
        action: 'priority_updated',
        field: 'internalPriority',
        oldValue: oldPriority,
        newValue: internalPriority,
        description: priorityDescription,
        metadata: { reason }
      },
      transaction
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Prioridade interna atualizada',
      ticket
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Atualizar estado de resolução
export const updateResolutionStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ticketId } = req.params;
    const { resolutionStatus, notes } = req.body;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId },
      transaction
    });

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const oldStatus = ticket.resolutionStatus;

    await ticket.update({ resolutionStatus }, { transaction });

    // Registrar no histórico
    const statusLabels = {
      pendente: 'Pendente',
      em_analise: 'Em Análise',
      aguardando_terceiro: 'Aguardando Terceiro',
      solucao_proposta: 'Solução Proposta',
      resolvido: 'Resolvido',
      nao_resolvido: 'Não Resolvido',
      workaround: 'Workaround Aplicado'
    };

    const resolutionDescription = `Estado de resolução alterado para "${statusLabels[resolutionStatus] || resolutionStatus}"` + (notes ? ': ' + notes : '');
    
    await logTicketChange(
      ticketId,
      req.user.id,
      req.user.organizationId,
      {
        action: 'resolution_updated',
        field: 'resolutionStatus',
        oldValue: oldStatus,
        newValue: resolutionStatus,
        description: resolutionDescription,
        metadata: { notes }
      },
      transaction
    );

    // Adicionar comentário se houver notas
    if (notes) {
      await Comment.create({
        ticketId,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        content: `📝 Estado de resolução: ${statusLabels[resolutionStatus]}\n${notes}`,
        isInternal: true,
        isPrivate: false
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Estado de resolução atualizado',
      ticket
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
