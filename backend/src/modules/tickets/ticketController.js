import { Ticket, User, Department, Category, Comment } from '../models/index.js';
import Attachment from '../attachments/attachmentModel.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';
import emailService from '../../services/emailService.js';
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

    res.json({
      tickets,
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
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'email']
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

    res.json({ ticket });
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

    // Guardar valores anteriores para notificações
    const oldStatus = ticket.status;
    const oldAssigneeId = ticket.assigneeId;

    // Atualizar campos permitidos
    const allowedFields = ['subject', 'description', 'status', 'priority', 'assigneeId', 'departmentId'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Atualizar datas conforme status
    if (updates.status === 'resolvido' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (updates.status === 'fechado' && !ticket.closedAt) {
      updateData.closedAt = new Date();
    }

    await ticket.update(updateData);

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
      if (ticket.requester?.email) recipients.push(ticket.requester.email);
      if (ticket.assignee?.email && ticket.assignee.email !== req.user.email) {
        recipients.push(ticket.assignee.email);
      }
      
      if (recipients.length > 0) {
        emailService.notifyStatusChange(ticket, oldStatus, updates.status, currentUser, recipients)
          .catch(err => logger.error('Erro ao enviar notificação de mudança de status:', err));
      }
    }

    // Notificar nova atribuição
    if (updates.assigneeId && oldAssigneeId !== updates.assigneeId) {
      const newAssignee = await User.findByPk(updates.assigneeId, { attributes: ['id', 'name', 'email'] });
      if (newAssignee) {
        emailService.notifyTicketAssignment(ticket, newAssignee, currentUser)
          .catch(err => logger.error('Erro ao enviar notificação de atribuição:', err));
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
    
    // Se for comentário interno, notificar apenas agentes
    if (comment.isInternal) {
      if (ticket.assignee?.email && ticket.assignee.email !== req.user.email) {
        recipients.push(ticket.assignee.email);
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
      }
      if (ticket.requester?.email && ticket.requester.email !== req.user.email && req.user.role === 'cliente-org') {
        recipients.push(ticket.requester.email);
      }
    }
    
    if (recipients.length > 0) {
      emailService.notifyNewComment(ticket, comment, fullComment.user, recipients)
        .catch(err => logger.error('Erro ao enviar notificação de comentário:', err));
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
