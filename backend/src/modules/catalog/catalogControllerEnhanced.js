import { CatalogCategory, ServiceRequest } from './catalogModelSimple.js';
import { Ticket, ClientUser, OrganizationUser, User, CatalogItem } from '../models/index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

class CatalogController {
  
  // ===== CATALOG CATEGORIES =====
  
  /**
   * GET /api/catalog/categories
   * Listar categorias do catálogo
   */
  async getCategories(req, res) {
    try {
      const { includeInactive, includeStats } = req.query;
      const { organizationId } = req.user;

      const where = { organizationId };
      if (!includeInactive) {
        where.isActive = true;
      }

      const categories = await CatalogCategory.findAll({
        where,
        order: [['order', 'ASC'], ['name', 'ASC']],
        include: includeStats ? [{
          model: CatalogItem,
          as: 'items',
          attributes: ['id'],
          where: { isActive: true },
          required: false
        }] : []
      });

      res.json({
        success: true,
        data: categories.map(cat => ({
          ...cat.toJSON(),
          itemCount: includeStats ? cat.items?.length || 0 : undefined
        }))
      });
    } catch (error) {
      logger.error('Erro ao buscar categorias:', error);
      res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  }

  /**
   * GET /api/catalog/categories/:id
   * Buscar categoria específica
   */
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const category = await CatalogCategory.findOne({
        where: { id, organizationId },
        include: [{
          model: CatalogItem,
          as: 'items',
          where: { isActive: true },
          required: false,
          order: [['order', 'ASC'], ['name', 'ASC']]
        }]
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      res.json({ success: true, data: category });
    } catch (error) {
      logger.error('Erro ao buscar categoria:', error);
      res.status(500).json({ error: 'Erro ao buscar categoria' });
    }
  }

  /**
   * POST /api/catalog/categories
   * Criar nova categoria
   */
  async createCategory(req, res) {
    try {
      const { organizationId } = req.user;
      const { name, description, icon, color, defaultDirectionId, defaultDepartmentId, order } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const category = await CatalogCategory.create({
        organizationId,
        name,
        description,
        icon: icon || 'FolderOpen',
        color: color || '#6B7280',
        defaultDirectionId,
        defaultDepartmentId,
        order: order || 0
      });

      logger.info(`Categoria criada: ${name}`);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      logger.error('Erro ao criar categoria:', error);
      res.status(500).json({ error: 'Erro ao criar categoria' });
    }
  }

  /**
   * PUT /api/catalog/categories/:id
   * Atualizar categoria
   */
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const category = await CatalogCategory.findOne({
        where: { id, organizationId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      await category.update(req.body);

      logger.info(`Categoria atualizada: ${category.name}`);
      res.json({ success: true, data: category });
    } catch (error) {
      logger.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  }

  /**
   * DELETE /api/catalog/categories/:id
   * Desativar categoria
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const category = await CatalogCategory.findOne({
        where: { id, organizationId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      await category.update({ isActive: false });

      logger.info(`Categoria desativada: ${category.name}`);
      res.json({ success: true, message: 'Categoria desativada' });
    } catch (error) {
      logger.error('Erro ao deletar categoria:', error);
      res.status(500).json({ error: 'Erro ao deletar categoria' });
    }
  }

  // ===== CATALOG ITEMS =====

  /**
   * GET /api/catalog/items
   * Listar itens do catálogo
   */
  async getItems(req, res) {
    try {
      const { categoryId, search, popular } = req.query;
      const { organizationId } = req.user;

      const where = { organizationId, isActive: true };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { shortDescription: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const order = popular ? [['requestCount', 'DESC']] : [['order', 'ASC'], ['name', 'ASC']];

      const items = await CatalogItem.findAll({
        where,
        order,
        include: [{
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }]
      });

      res.json({ success: true, data: items });
    } catch (error) {
      logger.error('Erro ao buscar itens:', error);
      res.status(500).json({ error: 'Erro ao buscar itens' });
    }
  }

  /**
   * GET /api/catalog/items/:id
   * Buscar item específico com schema do formulário
   */
  async getItemById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const item = await CatalogItem.findOne({
        where: { id, organizationId },
        include: [
          {
            model: CatalogCategory,
            as: 'category'
          }
        ]
      });

      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      // Gerar schema do formulário
      const formSchema = customFieldsService.generateFormSchema(item.customFields || []);

      res.json({
        success: true,
        data: {
          ...item.toJSON(),
          formSchema
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar item:', error);
      res.status(500).json({ error: 'Erro ao buscar item' });
    }
  }

  /**
   * POST /api/catalog/items
   * Criar novo item do catálogo
   */
  async createItem(req, res) {
    try {
      const { organizationId } = req.user;
      const itemData = { ...req.body, organizationId };

      // Validar custom fields se fornecidos
      if (itemData.customFields && Array.isArray(itemData.customFields)) {
        for (const field of itemData.customFields) {
          const validation = customFieldsService.validateFieldDefinition(field);
          if (!validation.valid) {
            return res.status(400).json({
              error: 'Definição de campo inválida',
              details: validation.errors
            });
          }
        }
      }

      const item = await CatalogItem.create(itemData);

      logger.info(`Item de catálogo criado: ${item.name}`);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      logger.error('Erro ao criar item:', error);
      res.status(500).json({ error: 'Erro ao criar item' });
    }
  }

  /**
   * PUT /api/catalog/items/:id
   * Atualizar item
   */
  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const item = await CatalogItem.findOne({
        where: { id, organizationId }
      });

      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      // Validar custom fields se fornecidos
      if (req.body.customFields && Array.isArray(req.body.customFields)) {
        for (const field of req.body.customFields) {
          const validation = customFieldsService.validateFieldDefinition(field);
          if (!validation.valid) {
            return res.status(400).json({
              error: 'Definição de campo inválida',
              details: validation.errors
            });
          }
        }
      }

      await item.update(req.body);

      logger.info(`Item atualizado: ${item.name}`);
      res.json({ success: true, data: item });
    } catch (error) {
      logger.error('Erro ao atualizar item:', error);
      res.status(500).json({ error: 'Erro ao atualizar item' });
    }
  }

  /**
   * DELETE /api/catalog/items/:id
   * Desativar item
   */
  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const item = await CatalogItem.findOne({
        where: { id, organizationId }
      });

      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      await item.update({ isActive: false });

      logger.info(`Item desativado: ${item.name}`);
      res.json({ success: true, message: 'Item desativado' });
    } catch (error) {
      logger.error('Erro ao deletar item:', error);
      res.status(500).json({ error: 'Erro ao deletar item' });
    }
  }

  // ===== TICKETS (UNIFICADO) =====

  /**
   * 🆕 POST /api/catalog/items/:id/ticket
   * Criar ticket diretamente do catálogo (sem service_request intermediário)
   */
  async createTicketFromCatalog(req, res) {
    try {
      const { id: catalogItemId } = req.params;
      const { organizationId, id: userId, userType, role } = req.user;
      const { formData } = req.body;

      // Buscar item do catálogo
      const item = await CatalogItem.findOne({
        where: { id: catalogItemId, organizationId, isActive: true },
        include: [{
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name']
        }]
      });

      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      // Validar dados do formulário
      if (item.customFields && item.customFields.length > 0) {
        // Importar serviço de custom fields se existir
        try {
          const customFieldsService = await import('../../services/customFieldsService.js');
          const validation = customFieldsService.default.validateFormData(
            item.customFields, 
            formData
          );
          
          if (!validation.valid) {
            return res.status(400).json({
              error: 'Dados do formulário inválidos',
              errors: validation.errors
            });
          }
        } catch (err) {
          logger.warn('Custom fields service não encontrado, pulando validação');
        }
      }

      // Transformar dados do formulário
      const transformedData = formData || {};

      // Determinar tipo de requester
      let requesterType = 'organization';
      let requesterUserId = null;
      let requesterOrgUserId = null;
      let requesterClientUserId = null;
      let clientId = null;

      if (userType === 'client' || ['client-admin', 'client-user', 'client-manager'].includes(role)) {
        requesterType = 'client';
        requesterClientUserId = userId;
        // Buscar clientId do usuário
        const ClientUser = (await import('../models/index.js')).ClientUser;
        const clientUser = await ClientUser.findByPk(userId, { attributes: ['clientId'] });
        if (clientUser) {
          clientId = clientUser.clientId;
        }
      } else if (userType === 'organization' || ['org-admin', 'org-technician', 'org-manager'].includes(role)) {
        requesterType = 'organization';
        requesterOrgUserId = userId;
      } else {
        requesterType = 'provider';
        requesterUserId = userId;
      }

      // Gerar descrição do ticket
      let description = `**Solicitação de Serviço: ${item.name}**\n\n`;
      if (item.shortDescription) {
        description += `${item.shortDescription}\n\n`;
      }
      if (Object.keys(transformedData).length > 0) {
        description += '**Dados da Solicitação:**\n\n';
        for (const [key, value] of Object.entries(transformedData)) {
          if (value !== undefined && value !== null && value !== '') {
            description += `- **${key}:** ${value}\n`;
          }
        }
      }

      // Criar ticket diretamente
      const ticket = await Ticket.create({
        organizationId,
        clientId,
        requesterType,
        requesterUserId,
        requesterOrgUserId,
        requesterClientUserId,
        catalogItemId: item.id,
        catalogCategoryId: item.categoryId,
        subject: item.name,
        description,
        priority: item.defaultPriority || 'media',
        type: 'service_request',
        source: 'portal',
        status: item.requiresApproval ? 'aguardando_aprovacao' : 'novo',
        // Campos de aprovação
        requiresApproval: item.requiresApproval || false,
        approvalStatus: item.requiresApproval ? 'pending' : null,
        // Dados do formulário
        formData: transformedData,
        estimatedCost: item.estimatedCost,
        estimatedDeliveryDays: item.estimatedDeliveryDays,
        // Roteamento automático
        directionId: item.defaultDirectionId,
        departmentId: item.defaultDepartmentId,
        sectionId: item.defaultSectionId
      });

      // Buscar ticket completo com relações
      const fullTicket = await Ticket.findByPk(ticket.id, {
        include: [
          {
            model: CatalogItem,
            as: 'catalogItem',
            attributes: ['id', 'name', 'icon', 'shortDescription']
          },
          {
            model: CatalogCategory,
            as: 'catalogCategory',
            attributes: ['id', 'name', 'icon', 'color']
          }
        ]
      });

      logger.info(`✅ Ticket de catálogo criado: ${ticket.ticketNumber} (${item.name})`);
      
      res.status(201).json({
        success: true,
        data: fullTicket,
        requiresApproval: item.requiresApproval,
        message: item.requiresApproval 
          ? 'Solicitação criada e aguardando aprovação'
          : 'Ticket criado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar ticket de catálogo:', error);
      res.status(500).json({ 
        error: 'Erro ao criar ticket',
        details: error.message 
      });
    }
  }

  // ===== SERVICE REQUESTS (DEPRECATED) =====

  /**
   * POST /api/catalog/items/:id/request
   * @deprecated Use createTicketFromCatalog instead
   * Criar service request a partir de um item
   */
  async createServiceRequest(req, res) {
    try {
      const { id: catalogItemId } = req.params;
      const { organizationId, id: userId } = req.user;
      const { formData } = req.body;

      // Buscar item do catálogo
      const item = await CatalogItem.findOne({
        where: { id: catalogItemId, organizationId, isActive: true }
      });

      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      // Validar dados do formulário
      if (item.customFields && item.customFields.length > 0) {
        const validation = customFieldsService.validateFormData(item.customFields, formData);
        
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Dados do formulário inválidos',
            errors: validation.errors
          });
        }
      }

      // Transformar dados
      const transformedData = customFieldsService.transformFormData(item.customFields || [], formData);

      // Criar service request
      const serviceRequest = await ServiceRequest.create({
        organizationId,
        catalogItemId,
        requesterId: userId,
        formData: transformedData,
        status: item.requiresApproval ? 'pending_approval' : 'approved'
      });

      // Se não requer aprovação, criar ticket imediatamente
      if (!item.requiresApproval) {
        const ticketData = await this.createTicketFromRequest(serviceRequest, item);
        
        await serviceRequest.update({
          ticketId: ticketData.id,
          status: 'in_progress'
        });
      }

      logger.info(`Service Request criado: ${serviceRequest.id}`);
      
      res.status(201).json({
        success: true,
        data: serviceRequest,
        requiresApproval: item.requiresApproval
      });
    } catch (error) {
      logger.error('Erro ao criar service request:', error);
      res.status(500).json({ error: 'Erro ao criar service request' });
    }
  }

  /**
   * Cria ticket a partir de service request
   */
  async createTicketFromRequest(serviceRequest, catalogItem) {
    // Preparar dados do ticket
    let ticketData = {
      organizationId: serviceRequest.organizationId,
      requesterId: serviceRequest.requesterId,
      catalogItemId: catalogItem.id,
      catalogCategoryId: catalogItem.categoryId,
      title: `${catalogItem.name} - SR#${serviceRequest.id}`,
      description: this.generateDescriptionFromFormData(serviceRequest.formData, catalogItem.customFields),
      type: 'service_request',
      status: 'aberto',
      priority: catalogItem.defaultPriority || 'media'
    };

    // Aplicar roteamento inteligente
    ticketData = await ticketRoutingService.routeTicket(ticketData);

    // Criar ticket
    const Ticket = require('../tickets/ticketModel.js').default;
    const ticket = await Ticket.create(ticketData);

    logger.info(`Ticket criado a partir de SR: ${ticket.id}`);
    
    return ticket;
  }

  /**
   * Gera descrição do ticket a partir dos dados do formulário
   */
  generateDescriptionFromFormData(formData, fieldDefinitions) {
    let description = '**Solicitação de Serviço**\n\n';

    for (const field of fieldDefinitions || []) {
      const value = formData[field.name];
      if (value !== undefined && value !== null && value !== '') {
        description += `**${field.label}:** ${value}\n`;
      }
    }

    return description;
  }

  /**
   * GET /api/catalog/requests
   * Listar minhas service requests E tickets criados diretamente (ex: por email)
   */
  async getMyRequests(req, res) {
    try {
      const { id: userId, organizationId, role } = req.user;
      const { status } = req.query;

      // 1. Buscar service requests (solicitações via catálogo)
      const requestWhere = { organizationId, userId };
      if (status) {
        requestWhere.status = status;
      }

      const serviceRequests = await ServiceRequest.findAll({
        where: requestWhere,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: CatalogItem,
            as: 'catalogItem',
            attributes: ['id', 'name', 'icon']
          },
          {
            model: Ticket,
            as: 'ticket',
            attributes: ['id', 'ticketNumber', 'status'],
            required: false
          }
        ]
      });

      // 2. Buscar tickets criados diretamente (ex: por email) SEM service_request
      const ticketWhere = {
        organizationId,
        [Op.or]: []
      };

      // Identificar se é cliente ou usuário da organização
      if (role === 'client' || role === 'client-user' || role === 'client-admin') {
        ticketWhere[Op.or].push({ requesterClientUserId: userId });
      } else {
        ticketWhere[Op.or].push({ requesterUserId: userId });
        ticketWhere[Op.or].push({ requesterOrgUserId: userId });
      }

      // Buscar tickets que NÃO têm service_request associado
      const directTickets = await Ticket.findAll({
        where: ticketWhere,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: CatalogItem,
            as: 'catalogItem',
            attributes: ['id', 'name', 'icon'],
            required: false // LEFT JOIN - permite tickets sem catalog_item
          },
          {
            model: ClientUser,
            as: 'requesterClientUser',
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
            model: User,
            as: 'requesterUser',
            attributes: ['id', 'name', 'email'],
            required: false
          }
        ]
      });

      // Filtrar apenas tickets que não têm service_request
      const ticketsWithoutRequest = [];
      for (const ticket of directTickets) {
        const hasRequest = await ServiceRequest.findOne({
          where: { ticketId: ticket.id }
        });
        if (!hasRequest) {
          ticketsWithoutRequest.push(ticket);
        }
      }

      // 3. Converter tickets diretos para formato de service_request (para compatibilidade com frontend)
      const directTicketsAsRequests = ticketsWithoutRequest.map(ticket => {
        // Determinar o requester correto baseado no tipo
        const requester = ticket.requesterClientUser || ticket.requesterOrgUser || ticket.requesterUser || {};
        
        return {
          id: ticket.id,
          organizationId: ticket.organizationId,
          catalogItemId: ticket.catalogItemId,
          requesterId: userId,
          status: this.mapTicketStatusToRequestStatus(ticket.status),
          ticketId: ticket.id,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          catalogItem: ticket.catalogItem || {
            id: null,
            name: ticket.subject || 'Ticket sem título',
            icon: 'Mail' // Ícone de email para tickets sem catálogo
          },
          ticket: {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            status: ticket.status
          },
          // Informações adicionais
          requester: {
            name: requester.name || 'Cliente',
            email: requester.email || ''
          },
          // Marcar como ticket direto
          isDirect: true,
          source: ticket.source || 'email'
        };
      });

      // 4. Combinar e ordenar por data
      const allRequests = [...serviceRequests, ...directTicketsAsRequests]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({ success: true, data: allRequests });
    } catch (error) {
      logger.error('Erro ao buscar requests:', error);
      res.status(500).json({ error: 'Erro ao buscar requests' });
    }
  }

  /**
   * Mapear status de ticket para status de request
   */
  mapTicketStatusToRequestStatus(ticketStatus) {
    const statusMap = {
      'novo': 'approved',
      'aguardando_aprovacao': 'pending_approval',
      'em_progresso': 'in_progress',
      'aguardando_cliente': 'in_progress',
      'resolvido': 'completed',
      'fechado': 'completed',
      'cancelado': 'cancelled'
    };
    return statusMap[ticketStatus] || 'in_progress';
  }

  /**
   * GET /api/catalog/requests/:id
   * Detalhes de um service request
   */
  async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const request = await ServiceRequest.findOne({
        where: { id, organizationId },
        include: [
          {
            model: CatalogItem,
            as: 'catalogItem'
          }
        ]
      });

      if (!request) {
        return res.status(404).json({ error: 'Request não encontrado' });
      }

      // Transformar dados para exibição
      const displayData = customFieldsService.transformForDisplay(
        request.catalogItem.customFields || [],
        request.formData
      );

      res.json({
        success: true,
        data: {
          ...request.toJSON(),
          formDataDisplay: displayData
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar request:', error);
      res.status(500).json({ error: 'Erro ao buscar request' });
    }
  }

  // ===== PORTAL PÚBLICO =====

  /**
   * GET /api/catalog/portal
   * Portal público do catálogo (sem autenticação)
   */
  async getPublicPortal(req, res) {
    try {
      const { organizationId } = req.query;

      if (!organizationId) {
        return res.status(400).json({ error: 'organizationId é obrigatório' });
      }

      const categories = await CatalogCategory.findAll({
        where: { organizationId, isActive: true },
        order: [['order', 'ASC']],
        include: [{
          model: CatalogItem,
          as: 'items',
          where: { isActive: true, isPublic: true },
          required: false,
          order: [['order', 'ASC']]
        }]
      });

      res.json({ success: true, data: categories });
    } catch (error) {
      logger.error('Erro ao buscar portal:', error);
      res.status(500).json({ error: 'Erro ao buscar portal' });
    }
  }
}

export default new CatalogController();
