import { CatalogCategory, CatalogItem, ServiceRequest } from './catalogModel.js';
import { Ticket, User, Category, Department, SLA } from '../models/index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

// ==================== CATEGORIAS DO CATÁLOGO ====================

// Listar categorias
export const getCatalogCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;

    const where = { organizationId: req.user.organizationId };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await CatalogCategory.findAll({
      where,
      order: [['order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// Criar categoria
export const createCatalogCategory = async (req, res, next) => {
  try {
    const { name, description, icon, order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const category = await CatalogCategory.create({
      organizationId: req.user.organizationId,
      name,
      description,
      icon: icon || 'FolderOpen',
      order: order || 0
    });

    logger.info(`Categoria de catálogo criada: ${name}`);

    res.json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar categoria
export const updateCatalogCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, order, isActive } = req.body;

    const category = await CatalogCategory.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await category.update({ name, description, icon, order, isActive });

    res.json({
      success: true,
      category
    });
  } catch (error) {
    next(error);
  }
};

// Deletar categoria
export const deleteCatalogCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await CatalogCategory.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar se tem itens associados
    const itemsCount = await CatalogItem.count({
      where: { categoryId: id }
    });

    if (itemsCount > 0) {
      return res.status(400).json({ 
        error: `Não é possível deletar. Existem ${itemsCount} item(ns) associado(s)` 
      });
    }

    await category.destroy();

    logger.info(`Categoria de catálogo deletada: ${category.name}`);

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ITENS DO CATÁLOGO ====================

// Listar itens do catálogo
export const getCatalogItems = async (req, res, next) => {
  try {
    const { categoryId, includeInactive, search } = req.query;

    const where = { organizationId: req.user.organizationId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    // Para clientes, mostrar apenas públicos
    if (req.user.role === 'cliente-org') {
      where.isPublic = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { shortDescription: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const items = await CatalogItem.findAll({
      where,
      include: [
        {
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        },
        {
          model: SLA,
          as: 'sla',
          attributes: ['id', 'name', 'responseTimeMinutes', 'resolutionTimeMinutes']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['order', 'ASC'], ['requestCount', 'DESC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      items
    });
  } catch (error) {
    next(error);
  }
};

// Obter item específico
export const getCatalogItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await CatalogItem.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        },
        {
          model: SLA,
          as: 'sla',
          attributes: ['id', 'name', 'responseTimeMinutes', 'resolutionTimeMinutes']
        },
        {
          model: Category,
          as: 'ticketCategory',
          attributes: ['id', 'name']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Cliente só pode ver itens públicos
    if (req.user.role === 'cliente-org' && !item.isPublic) {
      return res.status(403).json({ error: 'Item não disponível' });
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

// Criar item do catálogo
export const createCatalogItem = async (req, res, next) => {
  try {
    const {
      categoryId,
      name,
      shortDescription,
      fullDescription,
      icon,
      slaId,
      defaultTicketCategoryId,
      defaultPriority,
      requiresApproval,
      defaultApproverId,
      assignedDepartmentId,
      estimatedCost,
      costCurrency,
      estimatedDeliveryTime,
      customFields,
      isPublic,
      order
    } = req.body;

    if (!categoryId || !name) {
      return res.status(400).json({ error: 'Categoria e nome são obrigatórios' });
    }

    // Validar customFields
    if (customFields) {
      if (!Array.isArray(customFields)) {
        return res.status(400).json({ error: 'customFields deve ser um array' });
      }
      
      // Validar estrutura dos campos
      for (const field of customFields) {
        if (!field.name || !field.type || !field.label) {
          return res.status(400).json({ 
            error: 'Cada campo deve ter: name, type e label' 
          });
        }
      }
    }

    const item = await CatalogItem.create({
      organizationId: req.user.organizationId,
      categoryId,
      name,
      shortDescription,
      fullDescription,
      icon: icon || 'Box',
      slaId,
      defaultTicketCategoryId,
      defaultPriority: defaultPriority || 'media',
      requiresApproval: requiresApproval || false,
      defaultApproverId,
      assignedDepartmentId,
      estimatedCost,
      costCurrency: costCurrency || 'EUR',
      estimatedDeliveryTime,
      customFields: customFields || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      order: order || 0
    });

    logger.info(`Item de catálogo criado: ${name}`);

    res.json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar item
export const updateCatalogItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await CatalogItem.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Validar customFields se fornecido
    if (updates.customFields) {
      if (!Array.isArray(updates.customFields)) {
        return res.status(400).json({ error: 'customFields deve ser um array' });
      }
      
      for (const field of updates.customFields) {
        if (!field.name || !field.type || !field.label) {
          return res.status(400).json({ 
            error: 'Cada campo deve ter: name, type e label' 
          });
        }
      }
    }

    await item.update(updates);

    res.json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

// Deletar item
export const deleteCatalogItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await CatalogItem.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Verificar se tem solicitações associadas
    const requestsCount = await ServiceRequest.count({
      where: { catalogItemId: id }
    });

    if (requestsCount > 0) {
      // Apenas desativar, não deletar
      await item.update({ isActive: false });
      return res.json({
        success: true,
        message: 'Item desativado (existem solicitações associadas)'
      });
    }

    await item.destroy();

    logger.info(`Item de catálogo deletado: ${item.name}`);

    res.json({
      success: true,
      message: 'Item deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SERVICE REQUESTS ====================

// Criar solicitação de serviço
export const createServiceRequest = async (req, res, next) => {
  try {
    const { catalogItemId, formData } = req.body;

    if (!catalogItemId || !formData) {
      return res.status(400).json({ error: 'Item do catálogo e dados do formulário são obrigatórios' });
    }

    // Buscar item do catálogo
    const item = await CatalogItem.findOne({
      where: {
        id: catalogItemId,
        organizationId: req.user.organizationId,
        isActive: true
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item do catálogo não encontrado' });
    }

    // Validar campos obrigatórios do formulário
    if (item.customFields && item.customFields.length > 0) {
      for (const field of item.customFields) {
        if (field.required && !formData[field.name]) {
          return res.status(400).json({ 
            error: `Campo obrigatório não preenchido: ${field.label}` 
          });
        }
      }
    }

    // Criar service request
    const serviceRequest = await ServiceRequest.create({
      organizationId: req.user.organizationId,
      catalogItemId,
      requesterId: req.user.id,
      formData,
      status: item.requiresApproval ? 'pending_approval' : 'approved',
      approverId: item.requiresApproval ? item.defaultApproverId : null
    });

    // Incrementar contador de popularidade
    await item.increment('requestCount');

    // Se não requer aprovação, criar ticket automaticamente
    if (!item.requiresApproval) {
      const ticket = await createTicketFromRequest(serviceRequest, item, req.user);
      await serviceRequest.update({ 
        ticketId: ticket.id,
        status: 'in_progress'
      });
    }

    logger.info(`Service request criado: ${item.name} por ${req.user.name}`);

    res.json({
      success: true,
      serviceRequest,
      requiresApproval: item.requiresApproval
    });
  } catch (error) {
    next(error);
  }
};

// Listar service requests
export const getServiceRequests = async (req, res, next) => {
  try {
    const { status, catalogItemId } = req.query;

    const where = { organizationId: req.user.organizationId };

    // Clientes só veem suas próprias solicitações
    if (req.user.role === 'cliente-org') {
      where.requesterId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (catalogItemId) {
      where.catalogItemId = catalogItemId;
    }

    const requests = await ServiceRequest.findAll({
      where,
      include: [
        {
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'icon', 'estimatedCost', 'estimatedDeliveryTime']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'ticketNumber', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// Aprovar/Rejeitar service request
export const approveServiceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, comments, approvedCost } = req.body;

    const serviceRequest = await ServiceRequest.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: CatalogItem,
          as: 'catalogItem'
        }
      ]
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    if (serviceRequest.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Solicitação já foi processada' });
    }

    const updateData = {
      approverId: req.user.id,
      approvalDate: new Date(),
      approvalComments: comments
    };

    if (approved) {
      updateData.status = 'approved';
      updateData.approvedCost = approvedCost || serviceRequest.catalogItem.estimatedCost;

      // Criar ticket
      const requester = await User.findByPk(serviceRequest.requesterId);
      const ticket = await createTicketFromRequest(serviceRequest, serviceRequest.catalogItem, requester);
      
      updateData.ticketId = ticket.id;
      updateData.status = 'in_progress';

      logger.info(`Service request aprovado: ${id} - Ticket criado: ${ticket.ticketNumber}`);
    } else {
      updateData.status = 'rejected';
      updateData.rejectionReason = comments;

      logger.info(`Service request rejeitado: ${id}`);
    }

    await serviceRequest.update(updateData);

    res.json({
      success: true,
      serviceRequest
    });
  } catch (error) {
    next(error);
  }
};

// Função auxiliar: criar ticket a partir do service request
async function createTicketFromRequest(serviceRequest, catalogItem, requester) {
  // Montar descrição do ticket com dados do formulário
  let description = `**Solicitação de Serviço:** ${catalogItem.name}\n\n`;
  
  if (catalogItem.fullDescription) {
    description += `${catalogItem.fullDescription}\n\n`;
  }

  description += `**Dados fornecidos:**\n`;
  for (const [key, value] of Object.entries(serviceRequest.formData)) {
    const field = catalogItem.customFields.find(f => f.name === key);
    const label = field ? field.label : key;
    description += `- **${label}:** ${value}\n`;
  }

  const ticket = await Ticket.create({
    organizationId: serviceRequest.organizationId,
    requesterId: serviceRequest.requesterId,
    subject: `[Catálogo] ${catalogItem.name}`,
    description,
    categoryId: catalogItem.defaultTicketCategoryId,
    priority: catalogItem.defaultPriority,
    departmentId: catalogItem.assignedDepartmentId,
    status: 'aberto'
  });

  return ticket;
}

// Obter estatísticas do catálogo
export const getCatalogStatistics = async (req, res, next) => {
  try {
    const totalItems = await CatalogItem.count({
      where: {
        organizationId: req.user.organizationId,
        isActive: true
      }
    });

    const totalRequests = await ServiceRequest.count({
      where: { organizationId: req.user.organizationId }
    });

    const pendingApprovals = await ServiceRequest.count({
      where: {
        organizationId: req.user.organizationId,
        status: 'pending_approval'
      }
    });

    const mostRequested = await CatalogItem.findAll({
      where: {
        organizationId: req.user.organizationId,
        isActive: true
      },
      order: [['requestCount', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'requestCount', 'icon']
    });

    res.json({
      success: true,
      statistics: {
        totalItems,
        totalRequests,
        pendingApprovals,
        mostRequested
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCatalogCategories,
  createCatalogCategory,
  updateCatalogCategory,
  deleteCatalogCategory,
  getCatalogItems,
  getCatalogItemById,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  createServiceRequest,
  getServiceRequests,
  approveServiceRequest,
  getCatalogStatistics
};
