/**
 * Catalog Organization Controller
 * 
 * Controller específico para usuários da organização acessarem o catálogo
 * com controle de acesso (ACL) aplicado.
 * 
 * Diferente do catalogController.js (admin), este controller:
 * - Filtra categorias e itens por ACL
 * - Cria tickets diretamente a partir de itens do catálogo
 * - Aplica configurações do item (direção, departamento, aprovação, etc.)
 */

import { CatalogCategory, CatalogItem } from './catalogModel.js';
import { Ticket } from '../models/index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import { 
  hasAccess, 
  filterAccessibleCategories, 
  filterAccessibleItems,
  getEffectiveAccess 
} from '../catalogAccess/catalogAccessController.js';

/**
 * Gerar número de ticket único
 */
async function generateTicketNumber() {
  const lastTicket = await Ticket.findOne({
    order: [['createdAt', 'DESC']],
    attributes: ['ticketNumber']
  });

  if (!lastTicket || !lastTicket.ticketNumber) {
    return 'TKT-000001';
  }

  // Extrair número do último ticket (formato: TKT-XXXXXX)
  const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[1] || '0');
  const nextNumber = (lastNumber + 1).toString().padStart(6, '0');

  return `TKT-${nextNumber}`;
}

/**
 * Obter categorias acessíveis pelo usuário (com hierarquia)
 * 
 * @route GET /api/catalog/organization/categories
 * @access Private (Organization Users)
 */
export const getOrganizationCategories = async (req, res, next) => {
  try {
    const user = req.user;
    const { includeInactive } = req.query;
    
    const where = { 
      organizationId: user.organizationId,
      parentCategoryId: null // Apenas categorias raiz
    };
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    // Buscar categorias raiz
    const rootCategories = await CatalogCategory.findAll({
      where,
      order: [['order', 'ASC'], ['name', 'ASC']]
    });
    
    // Função recursiva para carregar subcategorias
    const loadSubcategories = async (category) => {
      const subcategories = await CatalogCategory.findAll({
        where: {
          organizationId: user.organizationId,
          parentCategoryId: category.id,
          ...(includeInactive ? {} : { isActive: true })
        },
        order: [['order', 'ASC'], ['name', 'ASC']]
      });
      
      // Carregar subcategorias recursivamente
      for (const subcat of subcategories) {
        subcat.dataValues.subcategories = await loadSubcategories(subcat);
      }
      
      return subcategories;
    };
    
    // Carregar hierarquia completa
    const categoriesWithHierarchy = [];
    for (const category of rootCategories) {
      const categoryData = category.toJSON();
      categoryData.subcategories = await loadSubcategories(category);
      categoriesWithHierarchy.push(categoryData);
    }
    
    // Filtrar por ACL
    const accessibleCategories = await filterAccessibleCategories(user, categoriesWithHierarchy);
    
    res.json({
      success: true,
      categories: accessibleCategories
    });
  } catch (error) {
    logger.error('Erro ao obter categorias da organização:', error);
    next(error);
  }
};

/**
 * Obter itens acessíveis de uma categoria
 * 
 * @route GET /api/catalog/organization/items
 * @access Private (Organization Users)
 */
export const getOrganizationItems = async (req, res, next) => {
  try {
    const user = req.user;
    const { categoryId, search, includeInactive } = req.query;
    
    const where = { 
      organizationId: user.organizationId
    };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (!includeInactive) {
      where.isActive = true;
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
          attributes: ['id', 'name', 'icon', 'color']
        }
      ],
      order: [['order', 'ASC'], ['requestCount', 'DESC'], ['name', 'ASC']]
    });
    
    // Filtrar por ACL
    const accessibleItems = await filterAccessibleItems(user, items);
    
    res.json({
      success: true,
      items: accessibleItems
    });
  } catch (error) {
    logger.error('Erro ao obter itens da organização:', error);
    next(error);
  }
};

/**
 * Obter item específico (com verificação de acesso)
 * 
 * @route GET /api/catalog/organization/items/:id
 * @access Private (Organization Users)
 */
export const getOrganizationItemById = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    const item = await CatalogItem.findOne({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: [
        {
          model: CatalogCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }
      ]
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item não encontrado'
      });
    }
    
    // Verificar acesso
    const hasAccessToItem = await hasAccess(user, 'item', item.id);
    if (!hasAccessToItem) {
      return res.status(403).json({
        success: false,
        error: 'Não tem permissão para aceder a este item'
      });
    }
    
    res.json({
      success: true,
      item
    });
  } catch (error) {
    logger.error('Erro ao obter item da organização:', error);
    next(error);
  }
};

/**
 * Criar ticket a partir de item do catálogo
 * 
 * @route POST /api/catalog/organization/items/:id/ticket
 * @access Private (Organization Users)
 */
export const createTicketFromCatalogItem = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Processar formData do multipart/form-data
    let formData = {};
    if (req.body.formData) {
      try {
        formData = typeof req.body.formData === 'string' 
          ? JSON.parse(req.body.formData) 
          : req.body.formData;
      } catch (error) {
        logger.error('Erro ao parsear formData:', error);
        return res.status(400).json({
          success: false,
          error: 'Dados do formulário inválidos'
        });
      }
    }
    
    // Garantir que formData existe
    const transformedData = formData || {};
    
    // Buscar item do catálogo
    const item = await CatalogItem.findOne({
      where: {
        id,
        organizationId: user.organizationId,
        isActive: true
      }
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item do catálogo não encontrado'
      });
    }
    
    // Verificar acesso
    const hasAccessToItem = await hasAccess(user, 'item', item.id);
    if (!hasAccessToItem) {
      return res.status(403).json({
        success: false,
        error: 'Não tem permissão para solicitar este serviço'
      });
    }
    
    // Validar campos obrigatórios do formulário
    if (item.customFields && item.customFields.length > 0) {
      for (const field of item.customFields) {
        if (field.required && !transformedData[field.name]) {
          return res.status(400).json({
            success: false,
            error: `Campo obrigatório não preenchido: ${field.label}`
          });
        }
      }
    }
    
    // Montar descrição do ticket com dados do formulário
    let description = `**Solicitação de Serviço:** ${item.name}\n\n`;
    
    if (item.fullDescription) {
      description += `${item.fullDescription}\n\n`;
    }
    
    if (transformedData && Object.keys(transformedData).length > 0) {
      description += `**Dados fornecidos:**\n`;
      for (const [key, value] of Object.entries(transformedData)) {
        if (value !== undefined && value !== null && value !== '') {
          const field = item.customFields?.find(f => f.name === key);
          const label = field ? field.label : key;
          description += `- **${label}:** ${value}\n`;
        }
      }
    }
    
    // Gerar número do ticket
    const ticketNumber = await generateTicketNumber();
    
    // Criar ticket com configurações do item
    const ticketData = {
      ticketNumber,
      organizationId: user.organizationId,
      subject: `[Catálogo] ${item.name}`,
      description,
      catalogCategoryId: item.categoryId,
      catalogItemId: item.id,
      priorityId: item.priorityId,
      typeId: item.typeId,
      directionId: item.defaultDirectionId,
      departmentId: item.defaultDepartmentId,
      sectionId: item.defaultSectionId,
      requiresApproval: item.requiresApproval,
      approvalStatus: item.requiresApproval ? 'pending' : null,
      formData: transformedData,
      estimatedCost: item.estimatedCost,
      estimatedDeliveryDays: item.estimatedDeliveryTime,
      status: item.requiresApproval ? 'aguardando_aprovacao' : 'novo',
      // Requester polimórfico (organization user)
      requesterType: 'organization',
      requesterOrgUserId: user.id
    };
    
    const ticket = await Ticket.create(ticketData);
    
    // Incrementar contador de popularidade
    await item.increment('requestCount');
    
    logger.info(`Ticket criado via catálogo: ${ticket.ticketNumber} - Item: ${item.name} - Usuário: ${user.name}`);
    
    res.json({
      success: true,
      ticket,
      requiresApproval: item.requiresApproval,
      message: item.requiresApproval 
        ? 'Solicitação enviada para aprovação' 
        : 'Ticket criado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao criar ticket via catálogo:', error);
    next(error);
  }
};

export default {
  getOrganizationCategories,
  getOrganizationItems,
  getOrganizationItemById,
  createTicketFromCatalogItem,
  getEffectiveAccess // Re-exportar do catalogAccessController
};
