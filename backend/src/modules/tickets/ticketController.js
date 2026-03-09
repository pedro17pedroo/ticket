import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Ticket, User, OrganizationUser, Department, CatalogCategory, Comment, SLA, Direction, Section, Priority, ClientUser } from '../models/index.js';
import { CatalogItem } from '../catalog/catalogModel.js';
import Attachment from '../attachments/attachmentModel.js';
import TicketRelationship from './ticketRelationshipModel.js';
import TicketHistory from './ticketHistoryModel.js';
import { logTicketChange, trackTicketChanges, getTicketHistory } from './ticketHistoryHelper.js';
import logger from '../../config/logger.js';
import * as notificationService from '../notifications/notificationService.js';
import fs from 'fs';
import { ProjectTicket, Project, ProjectTask } from '../projects/index.js';
import ticketVisibilityService from '../../services/ticketVisibilityService.js';
import clientTicketVisibilityService from '../../services/clientTicketVisibilityService.js';

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
      requesterOrgUserId,
      departmentId,
      directionId,
      sectionId,
      clientId,
      source,
      hasCatalogItem,
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
    if (requesterOrgUserId) {
      where.requesterType = 'organization';
      where.requesterOrgUserId = requesterOrgUserId;
    }
    if (directionId) where.directionId = directionId;
    if (departmentId) where.departmentId = departmentId;
    if (sectionId) where.sectionId = sectionId;
    if (clientId) where.clientId = clientId;
    if (source) where.source = source;
    
    // Filtrar tickets que vieram de solicitações do catálogo
    if (hasCatalogItem === 'true') {
      where.catalogItemId = { [Op.ne]: null };
    } else if (hasCatalogItem === 'false') {
      where.catalogItemId = null;
    }

    // Busca por texto
    if (search) {
      where[Op.or] = [
        { ticketNumber: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Clientes - aplicar filtro de visibilidade estrutural
    const isClientUser = ['client-user', 'client-admin', 'client-manager'].includes(req.user.role);
    if (isClientUser) {
      logger.info(`Usuário cliente detectado: ${req.user.email} (${req.user.id}) com role: ${req.user.role}`);
      const visibilityFilter = await clientTicketVisibilityService.buildVisibilityFilter(req.user);
      logger.info(`Filtro de visibilidade gerado:`, JSON.stringify(visibilityFilter));
      if (visibilityFilter[Op.or]) {
        // Combinar filtro de visibilidade com outros filtros
        if (where[Op.or]) {
          // Se já tem Op.or (busca), criar um Op.and
          const searchCondition = where[Op.or];
          delete where[Op.or];
          where[Op.and] = [
            { [Op.or]: searchCondition },
            visibilityFilter
          ];
        } else {
          Object.assign(where, visibilityFilter);
        }
      } else {
        // Se não retornou Op.or, aplicar filtro direto
        Object.assign(where, visibilityFilter);
      }
      logger.info(`Filtro WHERE final:`, JSON.stringify(where));
    }
    // Usuários da organização - aplicar filtro de visibilidade estrutural
    else {
      logger.info(`🔍 Usuário organização detectado: ${req.user.email} (${req.user.id}) com role: ${req.user.role}`);
      logger.info(`📊 Dados do usuário:`, JSON.stringify({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        organizationId: req.user.organizationId,
        directionId: req.user.directionId,
        departmentId: req.user.departmentId,
        sectionId: req.user.sectionId
      }));
      
      const visibilityFilter = ticketVisibilityService.buildVisibilityFilter(req.user);
      logger.info(`🎯 Filtro de visibilidade gerado:`, JSON.stringify(visibilityFilter, null, 2));
      
      if (visibilityFilter[Op.or]) {
        // Combinar filtro de visibilidade com outros filtros
        if (where[Op.or]) {
          // Se já tem Op.or (busca), criar um Op.and
          const searchCondition = where[Op.or];
          delete where[Op.or];
          where[Op.and] = [
            { [Op.or]: searchCondition },
            visibilityFilter
          ];
        } else {
          Object.assign(where, visibilityFilter);
        }
      }
      logger.info(`📋 Filtro WHERE final para query:`, JSON.stringify(where, null, 2));
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
          attributes: ['id', 'name', 'email', 'avatar', 'directionId', 'departmentId', 'sectionId'],
          include: [
            {
              model: Direction,
              as: 'direction',
              attributes: ['id', 'name'],
              required: false
            },
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name'],
              required: false
            },
            {
              model: Section,
              as: 'section',
              attributes: ['id', 'name'],
              required: false
            }
          ],
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
          model: CatalogCategory,
          as: 'catalogCategory',
          attributes: ['id', 'name', 'color', 'icon']
        },
        {
          model: SLA,
          as: 'sla',
          attributes: ['id', 'name', 'responseTimeMinutes', 'resolutionTimeMinutes']
        }
      ]
    });

    logger.info(`✅ Query executada: ${count} tickets encontrados, retornando ${tickets.length} tickets`);
    if (tickets.length > 0) {
      logger.info(`📝 Primeiros tickets:`, tickets.slice(0, 3).map(t => ({
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        requesterType: t.requesterType,
        requesterOrgUserId: t.requesterOrgUserId,
        assigneeId: t.assigneeId
      })));
    }

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
    
    // 🔍 LOGS DE DIAGNÓSTICO
    console.log('🔍 [getTicketById] Buscando ticket:', id);
    console.log('👤 [getTicketById] Usuário:', {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
      clientId: req.user.clientId
    });

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
          attributes: ['id', 'name', 'email', 'avatar', 'phone', 'role', 'directionId', 'departmentId', 'sectionId'],
          include: [
            {
              model: Direction,
              as: 'direction',
              attributes: ['id', 'name'],
              required: false
            },
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name'],
              required: false
            },
            {
              model: Section,
              as: 'section',
              attributes: ['id', 'name'],
              required: false
            }
          ],
          required: false
        },
        // Assignee - sempre organization_user
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: Direction,
          as: 'direction',
          attributes: ['id', 'name', 'description'],
          required: false
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name', 'description'],
          required: false
        },
        {
          model: CatalogCategory,
          as: 'catalogCategory',
          attributes: ['id', 'name', 'color', 'icon'],
          required: false
        },
        {
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'shortDescription', 'priorityId'],
          required: false
        },
        {
          model: Comment,
          as: 'comments',
          separate: true,
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

    console.log('🎫 [getTicketById] Ticket encontrado:', ticket ? 'SIM' : 'NÃO');
    if (ticket) {
      console.log('📋 [getTicketById] Dados do ticket:', {
        id: ticket.id,
        title: ticket.title,
        requesterType: ticket.requesterType,
        requesterId: ticket.requesterId,
        clientId: ticket.clientId,
        status: ticket.status
      });
    }

    if (!ticket) {
      console.log('❌ [getTicketById] Ticket não encontrado no banco');
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Clientes - verificar visibilidade estrutural (usar versão assíncrona para tickets sem clientId)
    const isClientUser = ['client-user', 'client-admin', 'client-manager'].includes(req.user.role);
    console.log('🔐 [getTicketById] É usuário cliente?', isClientUser);
    
    if (isClientUser) {
      console.log('🔍 [getTicketById] Verificando visibilidade para cliente...');
      console.log('🔍 [getTicketById] Dados do usuário:', {
        id: req.user.id,
        role: req.user.role,
        clientId: req.user.clientId,
        directionId: req.user.directionId,
        departmentId: req.user.departmentId,
        sectionId: req.user.sectionId
      });
      console.log('🔍 [getTicketById] Dados do ticket:', {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        clientId: ticket.clientId,
        requesterType: ticket.requesterType,
        requesterClientUserId: ticket.requesterClientUserId,
        hasRequesterClientUser: !!ticket.requesterClientUser
      });
      
      const canView = await clientTicketVisibilityService.canViewTicketAsync(req.user, ticket);
      console.log('✅ [getTicketById] Pode visualizar?', canView);
      if (!canView) {
        console.log('❌ [getTicketById] Acesso negado - usuário não tem permissão');
        return res.status(403).json({ 
          error: 'Acesso negado',
          message: 'Não tem permissão para ver este ticket.'
        });
      }
      console.log('✅ [getTicketById] Acesso permitido');
    }
    // Usuários da organização - verificar visibilidade estrutural
    else {
      if (!ticketVisibilityService.canViewTicket(req.user, ticket)) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          message: 'Não tem permissão para ver este ticket. O ticket pertence a outra estrutura organizacional.'
        });
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

    // Buscar associação com projeto/tarefa (Requirements: 5.6)
    let projectInfo = null;
    try {
      const projectTicket = await ProjectTicket.findOne({
        where: { ticketId: id },
        include: [
          {
            model: ProjectTask,
            as: 'task',
            attributes: ['id', 'title', 'status'],
            required: false
          }
        ]
      });

      if (projectTicket) {
        const project = await Project.findByPk(projectTicket.projectId, {
          attributes: ['id', 'code', 'name', 'status', 'methodology']
        });

        if (project) {
          projectInfo = {
            project: {
              id: project.id,
              code: project.code,
              name: project.name,
              status: project.status,
              methodology: project.methodology
            },
            task: projectTicket.task ? {
              id: projectTicket.task.id,
              title: projectTicket.task.title,
              status: projectTicket.task.status
            } : null,
            linkedAt: projectTicket.linkedAt
          };
        }
      }
    } catch (projectError) {
      // Ignorar erro de projeto - não deve impedir visualização do ticket
      console.warn('Erro ao buscar informações de projeto:', projectError.message);
    }

    res.json({
      ticket: {
        ...ticketData,
        sla: sla || null,
        projectInfo: projectInfo
      }
    });
  } catch (error) {
    console.error('❌ [getTicketById] Erro ao buscar ticket:', {
      message: error.message,
      stack: error.stack,
      ticketId: req.params.id,
      userId: req.user?.id,
      userRole: req.user?.role
    });
    next(error);
  }
};

// Criar ticket
export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority, type, categoryId, catalogCategoryId, departmentId, assigneeId, clientId } = req.body;
    // Suportar tanto categoryId (legado) quanto catalogCategoryId (novo)
    const finalCategoryId = catalogCategoryId || categoryId;

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

    if (req.user.userType === 'organization' || ['org-admin', 'org-manager', 'agent', 'technician', 'supervisor', 'agente', 'tecnico', 'gerente'].includes(req.user.role)) {
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
      catalogCategoryId: finalCategoryId,
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
        { model: CatalogCategory, as: 'catalogCategory', attributes: ['id', 'name'] },
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

    // Verificar permissão de visualização do ticket
    if (!ticketVisibilityService.canViewTicket(req.user, ticket)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Não tem permissão para atualizar este ticket.'
      });
    }

    // Verificar permissão de atribuição se estiver tentando atribuir
    if (updates.assigneeId !== undefined && updates.assigneeId !== ticket.assigneeId) {
      if (!ticketVisibilityService.canAssignTicket(req.user, ticket)) {
        return res.status(403).json({ 
          error: 'Sem permissão para atribuir',
          message: 'Apenas responsáveis da estrutura organizacional podem atribuir tickets.'
        });
      }
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
      'catalogCategoryId',
      'type'
    ];

    // Campos UUID que precisam converter string vazia para null
    const uuidFields = ['assigneeId', 'directionId', 'departmentId', 'sectionId', 'catalogCategoryId'];

    const updateData = {};

    // Suportar tanto categoryId (legado) quanto catalogCategoryId (novo)
    if (updates.categoryId !== undefined && updates.catalogCategoryId === undefined) {
      updates.catalogCategoryId = updates.categoryId;
    }

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

    // Validação: Status aguardando_aprovacao só para tickets de solicitação com aprovação
    if (updates.status === 'aguardando_aprovacao') {
      if (!ticket.catalogItemId) {
        return res.status(400).json({
          error: 'Status inválido',
          message: 'Apenas solicitações de serviço podem ter status "Aguardando Aprovação"'
        });
      }
      // Verificar se o item do catálogo requer aprovação
      const catalogItem = await CatalogItem.findByPk(ticket.catalogItemId);
      if (catalogItem && !catalogItem.requiresApproval) {
        return res.status(400).json({
          error: 'Aprovação não necessária',
          message: 'Este serviço não requer aprovação. Use status "Novo" ou "Em Progresso".'
        });
      }
    }

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
    if (['fechado', 'resolvido'].includes(updates.status) && !['fechado', 'resolvido'].includes(oldStatus)) {
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

    // ✅ VALIDAÇÃO: Deve ter comentário OU anexos (será verificado após upload)
    // Nota: Anexos são enviados separadamente, então aqui só validamos se há conteúdo
    // Se não houver conteúdo, assumimos que haverá anexos

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
    let authorType = 'organization'; // Default para usuários da organização
    let authorUserId = req.user.id;
    let authorOrgUserId = null;
    let authorClientUserId = null;

    // Roles da organização (novos e legados)
    if (['org-admin', 'org-manager', 'agent', 'gerente', 'supervisor', 'agente'].includes(req.user.role)) {
      authorType = 'organization';
      authorOrgUserId = req.user.id;
      authorUserId = null;
    } 
    // Roles de cliente
    else if (['client-admin', 'client-user', 'client-viewer'].includes(req.user.role)) {
      authorType = 'client';
      authorClientUserId = req.user.id;
      authorUserId = null;
    }

    // Clientes não podem criar notas internas
    const commentData = {
      organizationId: req.user.organizationId,
      ticketId,
      userId: req.user.id, // Legado
      content: content || '', // Permitir vazio quando há apenas anexos
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

    // ✅ TRANSIÇÃO AUTOMÁTICA DE STATUS
    const { applyStatusTransition } = await import('../../utils/ticketStatusTransitions.js');
    const statusTransition = await applyStatusTransition(ticket, req.user, 'comment');
    
    if (statusTransition.updated) {
      logger.info(
        `Status do ticket ${ticket.ticketNumber} alterado: ${statusTransition.oldStatus} → ${statusTransition.newStatus}`
      );
    }

    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'role', 'email']
        },
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

    // Aplicar filtro de visibilidade baseado no tipo de usuário
    const isClientUser = ['client-user', 'client-admin', 'client-manager'].includes(req.user.role);
    
    if (isClientUser) {
      // Clientes - aplicar filtro de visibilidade estrutural
      logger.info(`📊 Usuário cliente detectado: ${req.user.email} (${req.user.id}) com role: ${req.user.role}`);
      const visibilityFilter = await clientTicketVisibilityService.buildVisibilityFilter(req.user);
      logger.info(`📊 Filtro de visibilidade gerado:`, JSON.stringify(visibilityFilter));
      
      if (visibilityFilter[Op.or]) {
        Object.assign(where, visibilityFilter);
      } else {
        Object.assign(where, visibilityFilter);
      }
    } else {
      // Usuários da organização - aplicar filtro de visibilidade estrutural
      logger.info(`📊 Usuário organização detectado: ${req.user.email} (${req.user.id}) com role: ${req.user.role}`);
      
      const visibilityFilter = ticketVisibilityService.buildVisibilityFilter(req.user);
      logger.info(`📊 Filtro de visibilidade gerado:`, JSON.stringify(visibilityFilter, null, 2));
      
      if (visibilityFilter[Op.or]) {
        Object.assign(where, visibilityFilter);
      }
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

    logger.info(`📋 Filtro WHERE final para estatísticas:`, JSON.stringify(where, null, 2));

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

    console.log('📎 [getAttachments] Buscando anexos do ticket:', ticketId);
    console.log('👤 [getAttachments] Usuário:', {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
      clientId: req.user.clientId
    });

    // Verificar acesso ao ticket (suporta utilizadores da organização e clientes)
    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId }
    });

    if (!ticket) {
      console.log('❌ [getAttachments] Ticket não encontrado');
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado'
      });
    }

    console.log('🎫 [getAttachments] Ticket encontrado:', {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      clientId: ticket.clientId,
      requesterType: ticket.requesterType,
      requesterId: ticket.requesterId,
      requesterClientUserId: ticket.requesterClientUserId
    });

    // Verificar permissão de acesso
    const isOrgUser = req.user.organizationId && ticket.organizationId === req.user.organizationId;
    const isClientUser = req.user.clientId && ticket.clientId === req.user.clientId;
    const isRequester = ticket.requesterId === req.user.id || 
                        ticket.requesterClientUserId === req.user.id ||
                        ticket.requesterOrgUserId === req.user.id ||
                        ticket.requesterUserId === req.user.id;

    console.log('🔐 [getAttachments] Verificação de permissões:', {
      isOrgUser,
      isClientUser,
      isRequester
    });

    // Para usuários clientes, usar o serviço de visibilidade
    const isClientRole = ['client-user', 'client-admin', 'client-manager'].includes(req.user.role);
    if (isClientRole) {
      const canView = await clientTicketVisibilityService.canViewTicketAsync(req.user, ticket);
      console.log('✅ [getAttachments] Cliente pode visualizar?', canView);
      if (!canView) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para aceder aos anexos deste ticket'
        });
      }
    } else if (!isOrgUser && !isRequester) {
      console.log('❌ [getAttachments] Sem permissão');
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para aceder aos anexos deste ticket'
      });
    }

    const attachments = await Attachment.findAll({
      where: { ticketId },
      order: [['createdAt', 'DESC']]
    });

    console.log('📎 [getAttachments] Anexos encontrados:', attachments.length);

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
    console.error('❌ [getAttachments] Erro:', {
      message: error.message,
      stack: error.stack,
      ticketId: req.params.ticketId,
      userId: req.user?.id
    });
    next(error);
  }
};

// Download de anexo
export const downloadAttachment = async (req, res, next) => {
  try {
    const { ticketId, attachmentId } = req.params;

    logger.info(`Download solicitado - ticketId: ${ticketId}, attachmentId: ${attachmentId}, userId: ${req.user.id}`);

    // Primeiro, buscar o anexo
    const attachment = await Attachment.findOne({
      where: { id: attachmentId, ticketId },
      include: [{
        model: Ticket,
        as: 'ticket'
      }]
    });

    if (!attachment) {
      logger.warn(`Anexo não encontrado - attachmentId: ${attachmentId}, ticketId: ${ticketId}`);
      return res.status(404).json({
        success: false,
        error: 'Anexo não encontrado'
      });
    }

    logger.info(`Anexo encontrado - path: ${attachment.path}, originalName: ${attachment.originalName}`);

    // Verificar permissão de acesso ao ticket
    const ticket = attachment.ticket;
    const isOrgUser = req.user.organizationId && ticket.organizationId === req.user.organizationId;
    const isClientUser = req.user.clientId && ticket.clientId === req.user.clientId;
    const isRequester = ticket.requesterId === req.user.id || 
                        ticket.requesterClientUserId === req.user.id ||
                        ticket.requesterUserId === req.user.id;

    logger.info(`Verificação de permissão - isOrgUser: ${isOrgUser}, isClientUser: ${isClientUser}, isRequester: ${isRequester}`);

    if (!isOrgUser && !isClientUser && !isRequester) {
      logger.warn(`Acesso negado ao anexo - userId: ${req.user.id}, ticketId: ${ticketId}`);
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para aceder a este anexo'
      });
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(attachment.path)) {
      logger.error(`Arquivo não encontrado no disco - path: ${attachment.path}`);
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    logger.info(`Enviando arquivo para download - path: ${attachment.path}`);
    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    logger.error(`Erro no download de anexo:`, error);
    next(error);
  }
};

// Visualizar anexo (inline no navegador)
export const viewAttachment = async (req, res, next) => {
  try {
    const { ticketId, attachmentId } = req.params;

    logger.info(`Visualização solicitada - ticketId: ${ticketId}, attachmentId: ${attachmentId}, userId: ${req.user.id}`);

    // Buscar o anexo
    const attachment = await Attachment.findOne({
      where: { id: attachmentId, ticketId },
      include: [{
        model: Ticket,
        as: 'ticket'
      }]
    });

    if (!attachment) {
      logger.warn(`Anexo não encontrado - attachmentId: ${attachmentId}, ticketId: ${ticketId}`);
      return res.status(404).json({
        success: false,
        error: 'Anexo não encontrado'
      });
    }

    logger.info(`Anexo encontrado - path: ${attachment.path}, mimeType: ${attachment.mimeType}`);

    // Verificar permissão de acesso ao ticket
    const ticket = attachment.ticket;
    const isOrgUser = req.user.organizationId && ticket.organizationId === req.user.organizationId;
    const isClientUser = req.user.clientId && ticket.clientId === req.user.clientId;
    const isRequester = ticket.requesterId === req.user.id || 
                        ticket.requesterClientUserId === req.user.id ||
                        ticket.requesterUserId === req.user.id;

    logger.info(`Verificação de permissão - isOrgUser: ${isOrgUser}, isClientUser: ${isClientUser}, isRequester: ${isRequester}`);

    if (!isOrgUser && !isClientUser && !isRequester) {
      logger.warn(`Acesso negado ao anexo - userId: ${req.user.id}, ticketId: ${ticketId}`);
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para aceder a este anexo'
      });
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(attachment.path)) {
      logger.error(`Arquivo não encontrado no disco - path: ${attachment.path}`);
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    // Definir headers para visualização inline
    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    
    logger.info(`Enviando arquivo para visualização - path: ${attachment.path}`);
    
    // Enviar arquivo
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
  } catch (error) {
    logger.error(`Erro na visualização de anexo:`, error);
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
      [Op.or]: [
        { requesterUserId: userId },
        { requesterOrgUserId: userId },
        { requesterClientUserId: userId },
        { requesterId: userId } // Legado
      ]
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
          as: 'requesterUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'requesterOrgUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: ClientUser,
          as: 'requesterClientUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: CatalogCategory,
          as: 'catalogCategory',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Normalizar requester para cada ticket
    const normalizedTickets = tickets.map(t => {
      const ticketData = t.toJSON();
      ticketData.requester = ticketData.requesterUser || ticketData.requesterOrgUser || ticketData.requesterClientUser || null;
      return ticketData;
    });

    res.json({
      success: true,
      tickets: normalizedTickets,
      total: normalizedTickets.length
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
          model: CatalogCategory,
          as: 'catalogCategory',
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

// Obter assignees elegíveis para um ticket
export const getEligibleAssignees = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar se usuário pode atribuir este ticket
    if (!ticketVisibilityService.canAssignTicket(req.user, ticket)) {
      return res.status(403).json({ 
        error: 'Sem permissão',
        message: 'Não tem permissão para atribuir este ticket.'
      });
    }

    // Obter lista de assignees elegíveis
    const assignees = await ticketVisibilityService.getEligibleAssignees(req.user, ticket);

    res.json({
      success: true,
      assignees,
      total: assignees.length
    });
  } catch (error) {
    next(error);
  }
};

// Obter permissões do usuário sobre um ticket
export const getTicketPermissions = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId: req.user.organizationId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const permissions = ticketVisibilityService.getTicketPermissions(req.user, ticket);

    res.json({
      success: true,
      permissions
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
      catalogCategoryId,
      type
    } = req.body;
    // Suportar tanto categoryId (legado) quanto catalogCategoryId (novo)
    const finalCategoryId = catalogCategoryId !== undefined ? catalogCategoryId : categoryId;

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
      catalogCategoryId: ticket.catalogCategoryId,
      type: ticket.type
    };

    // Atualizar ticket (converter strings vazias em null para campos UUID)
    const updates = {};
    if (directionId !== undefined) updates.directionId = directionId || null;
    if (departmentId !== undefined) updates.departmentId = departmentId || null;
    if (sectionId !== undefined) updates.sectionId = sectionId || null;
    if (assigneeId !== undefined) updates.assigneeId = assigneeId || null;
    if (finalCategoryId !== undefined) updates.catalogCategoryId = finalCategoryId || null;
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

    // Buscar ticket com includes mínimos para verificação
    const ticket = await Ticket.findByPk(id, {
      attributes: ['id', 'ticketNumber', 'organizationId']
    });
    
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
      {
        action: 'update',
        field: 'watchers',
        oldValue: null,
        newValue: JSON.stringify({ orgWatchers, clientWatchers }),
        description: 'Observadores atualizados'
      }
    );

    // Buscar ticket atualizado com todos os includes
    const updatedTicket = await Ticket.findByPk(id, {
      include: [
        { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
        { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'], required: false },
        { model: Department, as: 'department', attributes: ['id', 'name'], required: false },
        { model: CatalogCategory, as: 'catalogCategory', attributes: ['id', 'name'], required: false },
        { model: Priority, as: 'priorityConfig', attributes: ['id', 'name', 'color'], required: false },
        { model: CatalogItem, as: 'catalogItem', attributes: ['id', 'name'], required: false }
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

// ============================================================================
// 🆕 UNIFICAÇÃO DE TICKETS - Aprovação/Rejeição
// ============================================================================

/**
 * PATCH /api/tickets/:id/approve
 * Aprovar ticket de catálogo
 */
export const approveTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const { id: userId, organizationId, role } = req.user;

    // Buscar ticket
    const ticket = await Ticket.findOne({
      where: { id, organizationId },
      include: [
        { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
        { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
        { model: CatalogItem, as: 'catalogItem', attributes: ['id', 'name'], required: false }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Validar permissões - apenas usuários da organização podem aprovar
    const isOrgUser = ['org-admin', 'org-manager', 'agent', 'technician', 'supervisor', 'agente', 'tecnico', 'gerente'].includes(role);
    if (!isOrgUser) {
      return res.status(403).json({ 
        error: 'Sem permissão',
        message: 'Apenas usuários da organização podem aprovar tickets'
      });
    }

    // Validar se ticket requer aprovação
    if (!ticket.requiresApproval) {
      return res.status(400).json({
        error: 'Ticket não requer aprovação',
        message: 'Este ticket não está configurado para requerer aprovação'
      });
    }

    // Validar se já foi aprovado/rejeitado
    if (ticket.approvalStatus === 'approved') {
      return res.status(400).json({
        error: 'Ticket já aprovado',
        message: 'Este ticket já foi aprovado anteriormente'
      });
    }

    if (ticket.approvalStatus === 'rejected') {
      return res.status(400).json({
        error: 'Ticket rejeitado',
        message: 'Este ticket foi rejeitado e não pode ser aprovado'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Atualizar ticket
      await ticket.update({
        approvalStatus: 'approved',
        approvalComments: comments,
        approvedBy: userId,
        approvedAt: new Date(),
        status: 'novo' // Mudar de aguardando_aprovacao para novo
      }, { transaction });

      // Registrar no histórico
      await logTicketChange(
        ticket.id,
        userId,
        {
          action: 'approval',
          field: 'approvalStatus',
          oldValue: 'pending',
          newValue: 'approved',
          description: `Ticket aprovado${comments ? ': ' + comments : ''}`
        },
        transaction
      );

      await transaction.commit();

      // Recarregar ticket com relações
      await ticket.reload({
        include: [
          { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
          { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
          { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
          { model: OrganizationUser, as: 'approvedByUser', attributes: ['id', 'name', 'email'], required: false },
          { model: CatalogItem, as: 'catalogItem', attributes: ['id', 'name'], required: false }
        ]
      });

      logger.info(`✅ Ticket aprovado: ${ticket.ticketNumber} por ${req.user.name || req.user.email}`);

      // Notificar requester (async)
      try {
        const requester = ticket.requesterClientUser || ticket.requesterOrgUser || ticket.requesterUser;
        if (requester) {
          await notificationService.notifyTicketApproved(ticket, requester.id, userId, req.user.name);
        }
      } catch (notifError) {
        logger.error('Erro ao enviar notificação de aprovação:', notifError);
      }

      res.json({
        success: true,
        message: 'Ticket aprovado com sucesso',
        data: ticket
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    logger.error('Erro ao aprovar ticket:', error);
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/reject
 * Rejeitar ticket de catálogo
 */
export const rejectTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { id: userId, organizationId, role } = req.user;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        error: 'Motivo obrigatório',
        message: 'É necessário informar o motivo da rejeição'
      });
    }

    // Buscar ticket
    const ticket = await Ticket.findOne({
      where: { id, organizationId },
      include: [
        { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
        { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
        { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
        { model: CatalogItem, as: 'catalogItem', attributes: ['id', 'name'], required: false }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Validar permissões - apenas usuários da organização podem rejeitar
    const isOrgUser = ['org-admin', 'org-manager', 'agent', 'technician', 'supervisor', 'agente', 'tecnico', 'gerente'].includes(role);
    if (!isOrgUser) {
      return res.status(403).json({ 
        error: 'Sem permissão',
        message: 'Apenas usuários da organização podem rejeitar tickets'
      });
    }

    // Validar se ticket requer aprovação
    if (!ticket.requiresApproval) {
      return res.status(400).json({
        error: 'Ticket não requer aprovação',
        message: 'Este ticket não está configurado para requerer aprovação'
      });
    }

    // Validar se já foi aprovado/rejeitado
    if (ticket.approvalStatus === 'approved') {
      return res.status(400).json({
        error: 'Ticket já aprovado',
        message: 'Este ticket já foi aprovado e não pode ser rejeitado'
      });
    }

    if (ticket.approvalStatus === 'rejected') {
      return res.status(400).json({
        error: 'Ticket já rejeitado',
        message: 'Este ticket já foi rejeitado anteriormente'
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Atualizar ticket
      await ticket.update({
        approvalStatus: 'rejected',
        rejectionReason: reason,
        rejectedBy: userId,
        rejectedAt: new Date(),
        status: 'fechado' // Fechar ticket rejeitado
      }, { transaction });

      // Registrar no histórico
      await logTicketChange(
        ticket.id,
        userId,
        {
          action: 'rejection',
          field: 'approvalStatus',
          oldValue: 'pending',
          newValue: 'rejected',
          description: `Ticket rejeitado: ${reason}`
        },
        transaction
      );

      await transaction.commit();

      // Recarregar ticket com relações
      await ticket.reload({
        include: [
          { model: User, as: 'requesterUser', attributes: ['id', 'name', 'email'], required: false },
          { model: OrganizationUser, as: 'requesterOrgUser', attributes: ['id', 'name', 'email'], required: false },
          { model: ClientUser, as: 'requesterClientUser', attributes: ['id', 'name', 'email'], required: false },
          { model: OrganizationUser, as: 'rejectedByUser', attributes: ['id', 'name', 'email'], required: false },
          { model: CatalogItem, as: 'catalogItem', attributes: ['id', 'name'], required: false }
        ]
      });

      logger.info(`❌ Ticket rejeitado: ${ticket.ticketNumber} por ${req.user.name || req.user.email}`);

      // Notificar requester (async)
      try {
        const requester = ticket.requesterClientUser || ticket.requesterOrgUser || ticket.requesterUser;
        if (requester) {
          await notificationService.notifyTicketRejected(ticket, requester.id, userId, req.user.name, reason);
        }
      } catch (notifError) {
        logger.error('Erro ao enviar notificação de rejeição:', notifError);
      }

      res.json({
        success: true,
        message: 'Ticket rejeitado',
        data: ticket
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    logger.error('Erro ao rejeitar ticket:', error);
    next(error);
  }
};

/**
 * 🆕 GET /api/tickets/my-tickets
 * Listar tickets do usuário (unificado - substitui /api/catalog/requests)
 */
export const getMyTickets = async (req, res, next) => {
  try {
    const { id: userId, organizationId, role, userType } = req.user;
    const { 
      status, 
      source, 
      approvalStatus,
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const where = { organizationId };

    // Filtrar por requester baseado no tipo de usuário
    if (userType === 'client' || ['client-user', 'client-admin', 'client-manager'].includes(role)) {
      where.requesterClientUserId = userId;
    } else if (userType === 'organization' || ['org-admin', 'org-manager', 'agent', 'technician', 'supervisor', 'agente', 'tecnico', 'gerente'].includes(role)) {
      where[Op.or] = [
        { requesterOrgUserId: userId },
        { requesterUserId: userId }
      ];
    } else {
      where.requesterUserId = userId;
    }

    // Filtros opcionais
    if (status) where.status = status;
    if (source) where.source = source;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    // Busca por texto
    if (search) {
      where[Op.or] = [
        { ticketNumber: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { rows: tickets, count } = await Ticket.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'icon', 'shortDescription'],
          required: false
        },
        {
          model: CatalogCategory,
          as: 'catalogCategory',
          attributes: ['id', 'name', 'icon', 'color'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'approvedByUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'rejectedByUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        // 🆕 Incluir dados do solicitante (polimórfico)
        {
          model: User,
          as: 'requester',
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
        }
      ]
    });

    logger.info(`📋 Listando ${tickets.length} tickets para usuário ${userId}`);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar meus tickets:', error);
    next(error);
  }
};
