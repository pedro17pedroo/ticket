import { Op } from 'sequelize';
import { Ticket, User, OrganizationUser, Department, Category, Comment, SLA, Direction, Section, Priority, ClientUser } from '../models/index.js';
import { CatalogItem } from '../catalog/catalogModel.js';
import Attachment from '../attachments/attachmentModel.js';
import TicketRelationship from './ticketRelationshipModel.js';
import TicketHistory from './ticketHistoryModel.js';
import { logTicketChange, trackTicketChanges, getTicketHistory } from './ticketHistoryHelper.js';
import logger from '../../config/logger.js';
// ... (keep existing imports)

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
    if (assigneeId) {
      where.assigneeId = assigneeId === 'null' ? null : assigneeId;
    }
    if (departmentId) where.departmentId = departmentId;

    // Busca por texto
    if (search) {
      where[Op.or] = [
        { ticketNumber: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Clientes só veem seus próprios tickets
    const isClientUser = ['client-user', 'client-admin', 'client-manager'].includes(req.user.role);
    if (isClientUser) {
      where.requesterClientUserId = req.user.id;
    }

    const offset = (page - 1) * limit;

    const { rows: tickets, count } = await Ticket.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        // Requester polimórfico
        {
          model: User,
          as: 'requesterUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'requesterOrgUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: ClientUser,
          as: 'requesterClientUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        // Assignee - sempre organization_user
        {
          model: OrganizationUser,
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
        },
        {
          model: SLA,
          as: 'sla',
          attributes: ['id', 'name', 'responseTimeMinutes', 'resolutionTimeMinutes']
        }
      ]
    });

    // Normalizar retorno - determinar requester baseado no tipo polimórfico
    const normalizedTickets = tickets.map(ticket => {
      const ticketData = ticket.toJSON();

      // Determinar requester baseado no tipo
      let requester = null;
      switch (ticketData.requesterType) {
        case 'provider':
          requester = ticketData.requesterUser;
          break;
        case 'organization':
          requester = ticketData.requesterOrgUser;
          break;
        case 'client':
          requester = ticketData.requesterClientUser;
          break;
      }

      return {
        ...ticketData,
        requester: requester
      };
    });

    res.json({
      tickets: normalizedTickets,
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
        // Requester polimórfico - incluir todas as possibilidades
        {
          model: User,
          as: 'requesterUser',
          attributes: ['id', 'name', 'email', 'avatar', 'phone', 'role'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'requesterOrgUser',
          attributes: ['id', 'name', 'email', 'avatar', 'phone', 'role'],
          required: false
        },
        {
          model: ClientUser,
          as: 'requesterClientUser',
          attributes: ['id', 'name', 'email', 'avatar', 'phone', 'role'],
          required: false
        },
        // Assignee - sempre organization_user
        {
          model: OrganizationUser,
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
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'shortDescription'],
          include: [{
            model: Priority,
            as: 'priority',
            attributes: ['id', 'name', 'order']
          }]
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            // Autor polimórfico
            {
              model: User,
              as: 'authorUser',
              attributes: ['id', 'name', 'avatar', 'email'],
              required: false
            },
            {
              model: OrganizationUser,
              as: 'authorOrgUser',
              attributes: ['id', 'name', 'avatar', 'email'],
              required: false
            },
            {
              model: ClientUser,
              as: 'authorClientUser',
              attributes: ['id', 'name', 'avatar', 'email'],
              required: false
            },
            // Legado
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'avatar', 'email'],
              required: false
            },
            {
              model: Attachment,
              as: 'attachments',
              attributes: ['id', 'filename', 'originalName', 'mimetype', 'size', 'path']
            }
          ],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Clientes só veem seus próprios tickets
    const isClientUser = ['client-user', 'client-admin', 'client-manager'].includes(req.user.role);
    if (isClientUser) {
      // Para clientes, verificar requesterClientUserId em vez de requesterId
      if (ticket.requesterClientUserId !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
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

    // Determinar o requester correto baseado no tipo polimórfico
    const ticketData = ticket.toJSON();
    let requester = null;

    switch (ticketData.requesterType) {
      case 'provider':
        requester = ticketData.requesterUser;
        break;
      case 'organization':
        requester = ticketData.requesterOrgUser;
        break;
      case 'client':
        requester = ticketData.requesterClientUser;
        break;
      default:
        // Fallback para campo legado
        requester = ticketData.requester;
    }

    // Adicionar requester unificado ao ticket
    ticketData.requester = requester;

    // Normalizar autores dos comentários
    if (ticketData.comments) {
      ticketData.comments = ticketData.comments.map(comment => {
        let author = comment.authorOrgUser || comment.authorClientUser || comment.authorUser || comment.user;
        return {
          ...comment,
          author: author,
          user: author // Manter compatibilidade
        };
      });
    }

    res.json({
      ticket: {
        ...ticketData,
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
    const { subject, description, priority, type, categoryId, departmentId, assigneeId, clientId } = req.body;

    // Gerar número do ticket
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${dateStr}-${random}`;

    // Determinar tipo de requester baseado no userType ou role
    let requesterType = 'provider';
    let requesterUserId = null;
    let requesterOrgUserId = null;
    let requesterClientUserId = null;

    if (req.user.userType === 'organization' || ['org-admin', 'org-technician', 'org-manager'].includes(req.user.role)) {
      requesterType = 'organization';
      requesterOrgUserId = req.user.id;
    } else if (req.user.userType === 'client' || ['client-admin', 'client-user', 'client-viewer', 'client-manager'].includes(req.user.role)) {
      requesterType = 'client';
      requesterClientUserId = req.user.id;
    } else {
      requesterType = 'provider';
      requesterUserId = req.user.id;
    }

    const ticket = await Ticket.create({
      organizationId: req.user.organizationId,
      clientId: clientId || req.user.clientId || null,
      // Campos polimórficos
      requesterType,
      requesterUserId,
      requesterOrgUserId,
      requesterClientUserId,
      // Campo legado (manter compatibilidade)
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
        // Requester polimórfico
        { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
        { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
        // Assignee
        { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    // Normalizar requester
    const ticketData = fullTicket.toJSON();
    let requester = null;
    switch (ticketData.requesterType) {
      case 'provider': requester = ticketData.requesterUser; break;
      case 'organization': requester = ticketData.requesterOrgUser; break;
      case 'client': requester = ticketData.requesterClientUser; break;
    }
    ticketData.requester = requester;

    logger.info(`Ticket criado: ${ticket.ticketNumber} por ${req.user.email}`);

    // Notificar criação do ticket (async - não bloqueia a resposta)
    notificationService.notifyTicketCreated(fullTicket, req.user.id, req.user.userType || 'organization')
      .catch(err => logger.error('Erro ao notificar criação de ticket:', err));

    // Se houver responsável atribuído, notificar
    if (fullTicket.assigneeId) {
      notificationService.notifyTicketAssigned(fullTicket, fullTicket.assigneeId, req.user.id, req.user.name)
        .catch(err => logger.error('Erro ao notificar atribuição:', err));
    }

    res.status(201).json({
      message: 'Ticket criado com sucesso',
      ticket: ticketData
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
        // Requester polimórfico
        { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
        { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
        // Assignee
        { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Clientes não podem atualizar tickets (exceto adicionar comentários)
    const isClientUser = ['client-user', 'client-admin'].includes(req.user.role);
    if (isClientUser) {
      return res.status(403).json({ error: 'Clientes não podem atualizar tickets diretamente' });
    }

    // Guardar valores anteriores para histórico
    const oldTicket = { ...ticket.toJSON() };

    // ✅ VALIDAÇÃO: Não pode atribuir ou mesclar tickets concluídos
    const { isTicketClosed } = await import('../../utils/ticketValidations.js');
    if (isTicketClosed(ticket) && (updates.assigneeId !== undefined)) {
      return res.status(403).json({
        error: 'Não é possível atribuir ticket concluído',
        reason: 'ticket_closed',
        status: ticket.status
      });
    }

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

    // ✅ Atribuição: Marcar primeira resposta
    if (updates.assigneeId && !oldTicket.assigneeId && !ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
      logger.info(`Primeira resposta registrada para ticket ${ticket.ticketNumber}`);
    }

    // Atualizar datas conforme status
    if (updates.status === 'resolvido' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (updates.status === 'fechado' && !ticket.closedAt) {
      updateData.closedAt = new Date();
    }

    // ✅ Parar cronômetro automaticamente quando ticket é concluído
    const isBeingClosed = (updates.status === 'fechado' || updates.status === 'resolvido') &&
      oldTicket.status !== updates.status;
    if (isBeingClosed) {
      const TimeEntry = (await import('./timeEntryModel.js')).default;
      const activeTimers = await TimeEntry.findAll({
        where: {
          ticketId: id,
          isActive: true
        }
      });

      for (const timer of activeTimers) {
        const now = new Date();
        const startTime = new Date(timer.startTime);
        const totalElapsed = Math.floor((now - startTime) / 1000);
        const duration = Math.max(1, totalElapsed - (timer.totalPausedTime || 0));

        await timer.update({
          endTime: now,
          duration,
          isActive: false,
          status: 'stopped'
        });

        logger.info(`Cronômetro parado automaticamente no ticket ${ticket.ticketNumber} (status: ${updates.status})`);
      }
    }

    const transaction = await sequelize.transaction();

    try {
      await ticket.update(updateData, { transaction });

      // Registrar mudanças no histórico
      await trackTicketChanges(
        oldTicket,
        { ...oldTicket, ...updateData },
        req.user.id,
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
        { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
        { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    logger.info(`Ticket atualizado: ${ticket.ticketNumber} por ${req.user.email}`);

    // Notificações (async - não bloqueia resposta)
    const oldStatus = oldTicket.status;
    const oldAssigneeId = oldTicket.assigneeId;

    // Notificar mudança de status
    if (updates.status && oldStatus !== updates.status) {
      notificationService.notifyStatusChange(ticket, oldStatus, updates.status, req.user.id, req.user.name)
        .catch(err => logger.error('Erro ao notificar mudança de status:', err));

      // 🔔 NOTIFICAR WATCHERS SOBRE MUDANÇA DE STATUS
      try {
        // Carregar ticket completo com relacionamentos
        const fullTicket = await Ticket.findByPk(ticket.id, {
          include: [
            { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
            { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
            { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
            { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
          ]
        });

        const { notifyTicketWatchers } = await import('../../services/watcherNotificationService.js');
        await notifyTicketWatchers(fullTicket, 'status_changed', {
          oldStatus: oldStatus,
          newStatus: updates.status,
          changedBy: req.user.name
        });
        logger.info(`✅ Watchers notificados sobre mudança de status do ticket ${fullTicket.ticketNumber}: ${oldStatus} → ${updates.status}`);
      } catch (error) {
        logger.error(`❌ Erro ao notificar watchers sobre mudança de status:`, error);
      }

      // Notificações específicas
      if (updates.status === 'resolvido') {
        notificationService.notifyTicketResolved(ticket, req.user.id, req.user.name)
          .catch(err => logger.error('Erro ao notificar resolução:', err));
      } else if (updates.status === 'fechado') {
        notificationService.notifyTicketClosed(ticket, req.user.id, req.user.name)
          .catch(err => logger.error('Erro ao notificar fechamento:', err));
      }
    }

    // Notificar nova atribuição
    if (updates.assigneeId && oldAssigneeId !== updates.assigneeId) {
      notificationService.notifyTicketAssigned(ticket, updates.assigneeId, req.user.id, req.user.name)
        .catch(err => logger.error('Erro ao notificar atribuição:', err));

      // 🔔 NOTIFICAR WATCHERS SOBRE ATRIBUIÇÃO
      try {
        // Carregar ticket completo com relacionamentos
        const fullTicket = await Ticket.findByPk(ticket.id, {
          include: [
            { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
            { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
            { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
            { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
          ]
        });

        const { notifyTicketWatchers } = await import('../../services/watcherNotificationService.js');
        await notifyTicketWatchers(fullTicket, 'assigned', {
          assignedTo: req.user.name,
          previousAssignee: oldAssigneeId
        });
        logger.info(`✅ Watchers notificados sobre atribuição do ticket ${fullTicket.ticketNumber}`);
      } catch (error) {
        logger.error(`❌ Erro ao notificar watchers sobre atribuição:`, error);
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
    const { content, isInternal = false } = req.body;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId },
      include: [
        { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
        { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar permissão
    const isClientUser = ['client-user', 'client-admin'].includes(req.user.role);
    if (isClientUser && ticket.requesterId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // ✅ VALIDAÇÃO: Ticket concluído não pode receber comentários
    const { isTicketClosed, isTicketAssigned } = await import('../../utils/ticketValidations.js');
    if (isTicketClosed(ticket)) {
      return res.status(403).json({
        error: 'Não é possível adicionar comentários em ticket concluído',
        reason: 'ticket_closed',
        status: ticket.status
      });
    }

    // ✅ VALIDAÇÃO: Ticket deve estar atribuído para receber comentários (exceto clientes)
    if (!isClientUser && !isTicketAssigned(ticket)) {
      return res.status(403).json({
        error: 'Ticket deve ser atribuído antes de adicionar comentários',
        reason: 'ticket_not_assigned'
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

    // Clientes não podem criar notas internas
    const commentData = {
      organizationId: req.user.organizationId,
      ticketId,
      userId: req.user.id, // Legado
      content,
      isInternal: !isClientUser ? isInternal : false,
      authorType,
      authorUserId,
      authorOrgUserId,
      authorClientUserId
    };

    const comment = await Comment.create(commentData);

    // Se é a primeira resposta de um agente/admin, registrar o timestamp
    if (!isClientUser && !ticket.firstResponseAt) {
      await ticket.update({ firstResponseAt: new Date() });
      logger.info(`Primeira resposta registrada para o ticket ${ticket.ticketNumber} por ${req.user.email}`);
    }

    // Se o cliente respondeu e o ticket estava aguardando, mudar status automaticamente
    if (isClientUser && ticket.status === 'aguardando_cliente') {
      await ticket.update({ status: 'em_progresso' });
      logger.info(`Status do ticket ${ticket.ticketNumber} alterado automaticamente para 'em_progresso' após resposta do cliente`);
    }

    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'role', 'email']
        },
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'filename', 'originalName', 'mimetype', 'size', 'path']
        }
      ]
    });

    logger.info(`Comentário adicionado ao ticket ${ticket.ticketNumber} por ${req.user.email}`);

    // Enviar notificações (async - não bloqueia resposta)
    notificationService.notifyNewComment(
      ticket,
      comment,
      req.user.id,
      authorType,
      req.user.name
    ).catch(err => logger.error('Erro ao notificar comentário:', err));

    // 🔔 NOTIFICAR WATCHERS SOBRE O COMENTÁRIO
    try {
      const { notifyTicketWatchers } = await import('../../services/watcherNotificationService.js');
      await notifyTicketWatchers(ticket, 'commented', {
        comment: comment.content,
        author: req.user.name
      });
      logger.info(`✅ Watchers notificados sobre comentário no ticket ${ticket.ticketNumber}`);
    } catch (error) {
      logger.error(`❌ Erro ao notificar watchers sobre comentário:`, error);
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
    const isClientUser = ['client-user', 'client-admin'].includes(req.user.role);
    if (isClientUser) {
      where[Op.or] = [
        { requesterId: req.user.id },
        { requesterClientUserId: req.user.id }
      ];
    }

    // Aplicar filtros de data se fornecidos
    const { startDate, endDate } = req.query;
    logger.info(`📊 getStatistics chamada - startDate: ${startDate}, endDate: ${endDate}`, {
      userId: req.user.id,
      organizationId: req.user.organizationId,
      query: req.query
    });

    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate + 'T23:59:59.999Z')
      };
      logger.info(`📅 Aplicando filtro de data:`, {
        startDate: new Date(startDate),
        endDate: new Date(endDate + 'T23:59:59.999Z'),
        where
      });
    }

    let stats;
    try {
      stats = await Promise.all([
        Ticket.count({ where }),
        Ticket.count({ where: { ...where, status: 'novo' } }),
        Ticket.count({ where: { ...where, status: 'em_progresso' } }),
        Ticket.count({ where: { ...where, status: 'aguardando_cliente' } }),
        Ticket.count({ where: { ...where, status: 'resolvido' } }),
        Ticket.count({ where: { ...where, status: 'fechado' } })
      ]);
    } catch (countError) {
      logger.error('Erro ao contar tickets:', { error: countError.message, where });
      throw countError;
    }

    const [total, novo, emProgresso, aguardandoCliente, resolvido, fechado] = stats;

    const result = {
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
    };

    logger.info(`📊 Resultado getStatistics:`, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Upload de anexos
export const uploadAttachments = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { commentId } = req.body; // Opcional: para vincular ao comentário
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

    // Se commentId fornecido, verificar se existe
    if (commentId) {
      const comment = await Comment.findOne({
        where: { id: commentId, ticketId }
      });

      if (!comment) {
        files.forEach(file => {
          fs.unlinkSync(file.path);
        });
        return res.status(404).json({
          success: false,
          error: 'Comentário não encontrado'
        });
      }
    }

    // Criar registos de anexos
    const attachments = await Promise.all(
      files.map(file =>
        Attachment.create({
          ticketId,
          commentId: commentId || null, // Vincular ao comentário se fornecido
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
      // UPLOADER DESATIVADO TEMPORARIAMENTE
      // include: [{
      //   model: User,
      //   as: 'uploader',
      //   attributes: ['id', 'name']
      // }],
      order: [['createdAt', 'DESC']]
    });

    // Separar anexos do ticket e de comentários
    const ticketAttachments = attachments.filter(a => !a.commentId);
    const commentAttachments = attachments.filter(a => a.commentId);

    res.json({
      success: true,
      attachments: attachments, // Todos os anexos
      ticketAttachments,  // Apenas anexos do ticket principal
      commentAttachments  // Apenas anexos de comentários
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

    const history = await getTicketHistory(ticketId, {
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
      {
        action: 'assigned',
        field: 'transfer',
        oldValue: oldValues,
        newValue: updates,
        description
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
      {
        action: 'priority_changed',
        field: 'internalPriority',
        oldValue: oldPriority,
        newValue: internalPriority,
        description: priorityDescription
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
      {
        action: 'status_changed',
        field: 'resolutionStatus',
        oldValue: oldStatus,
        newValue: resolutionStatus,
        description: resolutionDescription
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

/**
 * Atualizar watchers do ticket
 */
export const updateTicketWatchers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orgWatchers, clientWatchers } = req.body;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar permissões
    if (ticket.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Atualizar apenas os campos fornecidos
    const updates = {};
    if (orgWatchers !== undefined) {
      updates.orgWatchers = orgWatchers;
    }
    if (clientWatchers !== undefined) {
      updates.clientWatchers = clientWatchers;
    }

    await ticket.update(updates);

    logger.info(`Watchers atualizados para ticket ${ticket.ticketNumber} por ${req.user.name}`);

    // Registrar no histórico
    await logTicketChange(
      ticket.id,
      req.user.id,
      'watchers_updated',
      null,
      null,
      { orgWatchers, clientWatchers }
    );

    const updatedTicket = await Ticket.findByPk(id, {
      include: [
        { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
        { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Priority, as: 'ticketPriority', attributes: ['id', 'name', 'color'] },
        { model: CatalogItem, as: 'catalogItem', attributes: ['id', 'name', 'description'] }
      ]
    });

    // Normalizar requester
    const ticketData = updatedTicket.toJSON();
    let requester = null;
    switch (ticketData.requesterType) {
      case 'provider': requester = ticketData.requesterUser; break;
      case 'organization': requester = ticketData.requesterOrgUser; break;
      case 'client': requester = ticketData.requesterClientUser; break;
    }
    ticketData.requester = requester;

    res.json({
      success: true,
      ticket: ticketData
    });

  } catch (error) {
    logger.error('Erro ao atualizar watchers do ticket:', error);
    next(error);
  }
};
