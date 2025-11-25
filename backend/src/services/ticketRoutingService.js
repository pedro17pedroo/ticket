import { CatalogItem, CatalogCategory } from '../modules/catalog/catalogModel.js';
import Category from '../modules/categories/categoryModel.js';
import User from '../modules/users/userModel.js';
import Department from '../modules/departments/departmentModel.js';
import Section from '../modules/sections/sectionModel.js';
import SLA from '../modules/slas/slaModel.js';
import logger from '../config/logger.js';

class TicketRoutingService {
  
  // ===== ROTEAMENTO PRINCIPAL =====
  
  /**
   * Roteia um ticket baseado em suas informações
   * @param {Object} ticketData - Dados do ticket
   * @returns {Object} Dados do ticket com roteamento aplicado
   */
  async routeTicket(ticketData) {
    try {
      logger.info(`Iniciando roteamento do ticket: ${ticketData.title}`);

      // 1. Se veio de Catalog Item (Service Request)
      if (ticketData.catalogItemId) {
        return await this.routeFromCatalogItem(ticketData);
      }

      // 2. Se veio com Category mas sem Catalog Item
      if (ticketData.categoryId) {
        return await this.routeFromCategory(ticketData);
      }

      // 3. Se tem Catalog Category (categoria do catálogo)
      if (ticketData.catalogCategoryId) {
        return await this.routeFromCatalogCategory(ticketData);
      }

      // 4. Se não tem nada, vai para Triage
      return await this.routeToTriage(ticketData);

    } catch (error) {
      logger.error('Erro ao rotear ticket:', error);
      // Em caso de erro, rotear para triage
      return await this.routeToTriage(ticketData);
    }
  }

  // ===== ROTEAMENTO POR CATALOG ITEM =====
  
  async routeFromCatalogItem(ticketData) {
    const item = await CatalogItem.findByPk(ticketData.catalogItemId, {
      include: [
        { model: CatalogCategory, as: 'category' }
      ]
    });

    if (!item) {
      logger.warn(`Catalog Item ${ticketData.catalogItemId} não encontrado`);
      return await this.routeToTriage(ticketData);
    }

    logger.info(`Aplicando regras do Catalog Item: ${item.name}`);

    // Aplicar hierarquia organizacional
    if (item.defaultDirectionId) {
      ticketData.directionId = item.defaultDirectionId;
    }
    if (item.defaultDepartmentId) {
      ticketData.departmentId = item.defaultDepartmentId;
    }
    if (item.defaultSectionId) {
      ticketData.sectionId = item.defaultSectionId;
    }

    // Aplicar categoria de ticket
    if (item.defaultTicketCategoryId) {
      ticketData.categoryId = item.defaultTicketCategoryId;
    }

    // Aplicar SLA
    if (item.slaId) {
      ticketData.slaId = item.slaId;
    } else {
      // Buscar SLA baseado em prioridade e categoria
      ticketData.slaId = await this.getSLAByPriorityAndCategory(
        ticketData.priority || item.defaultPriority,
        ticketData.categoryId
      );
    }

    // Aplicar Workflow
    if (item.defaultWorkflowId) {
      ticketData.workflowId = item.defaultWorkflowId;
    }

    // Aplicar prioridade padrão se não tiver
    if (!ticketData.priority && item.defaultPriority) {
      ticketData.priority = item.defaultPriority;
    }

    // Aplicar tipo de ticket
    if (!ticketData.type) {
      ticketData.type = item.requiresApproval ? 'service_request' : 'incident';
    }

    // Atribuir agente/equipe baseado no tipo de atribuição
    await this.applyAssignment(ticketData, item);

    // Incrementar contador de uso do item
    await item.increment('requestCount');

    logger.info(`Ticket roteado via Catalog Item para: Direction ${ticketData.directionId}, Department ${ticketData.departmentId}`);

    return ticketData;
  }

  // ===== ROTEAMENTO POR CATEGORIA =====
  
  async routeFromCategory(ticketData) {
    const category = await Category.findByPk(ticketData.categoryId);

    if (!category) {
      logger.warn(`Category ${ticketData.categoryId} não encontrada`);
      return await this.routeToTriage(ticketData);
    }

    logger.info(`Aplicando regras da Category: ${category.name}`);

    // Aplicar regras da categoria (se tiver)
    // Categorias podem ter departamento padrão
    if (category.departmentId) {
      ticketData.departmentId = category.departmentId;
    }

    // Buscar SLA baseado na categoria e prioridade
    ticketData.slaId = await this.getSLAByPriorityAndCategory(
      ticketData.priority || 'media',
      category.id
    );

    return ticketData;
  }

  // ===== ROTEAMENTO POR CATALOG CATEGORY =====
  
  async routeFromCatalogCategory(ticketData) {
    const catalogCategory = await CatalogCategory.findByPk(ticketData.catalogCategoryId);

    if (!catalogCategory) {
      return await this.routeToTriage(ticketData);
    }

    logger.info(`Aplicando regras da Catalog Category: ${catalogCategory.name}`);

    // Aplicar roteamento padrão da categoria
    if (catalogCategory.defaultDirectionId) {
      ticketData.directionId = catalogCategory.defaultDirectionId;
    }
    if (catalogCategory.defaultDepartmentId) {
      ticketData.departmentId = catalogCategory.defaultDepartmentId;
    }

    return ticketData;
  }

  // ===== ATRIBUIÇÃO DE AGENTE =====
  
  async applyAssignment(ticketData, item) {
    switch (item.assignmentType) {
      case 'agent':
        // Atribuir para agente específico
        if (item.defaultAgentId) {
          ticketData.assignedToId = item.defaultAgentId;
          logger.info(`Ticket atribuído para agente específico: ${item.defaultAgentId}`);
        }
        break;

      case 'round_robin':
        // Round robin no departamento/seção
        if (item.defaultSectionId) {
          ticketData.assignedToId = await this.getNextAgentRoundRobin(item.defaultSectionId, 'section');
        } else if (item.defaultDepartmentId) {
          ticketData.assignedToId = await this.getNextAgentRoundRobin(item.defaultDepartmentId, 'department');
        }
        logger.info(`Ticket atribuído via Round Robin: ${ticketData.assignedToId}`);
        break;

      case 'load_balance':
        // Atribuir para agente com menos tickets
        if (item.defaultSectionId) {
          ticketData.assignedToId = await this.getAgentWithLeastTickets(item.defaultSectionId, 'section');
        } else if (item.defaultDepartmentId) {
          ticketData.assignedToId = await this.getAgentWithLeastTickets(item.defaultDepartmentId, 'department');
        }
        logger.info(`Ticket atribuído via Load Balance: ${ticketData.assignedToId}`);
        break;

      case 'section':
        // Deixa na fila da seção (não atribui agente específico)
        ticketData.assignedToId = null;
        logger.info(`Ticket enviado para fila da seção: ${item.defaultSectionId}`);
        break;

      case 'department':
        // Deixa na fila do departamento (não atribui agente específico)
        ticketData.assignedToId = null;
        logger.info(`Ticket enviado para fila do departamento: ${item.defaultDepartmentId}`);
        break;

      case 'manual':
      default:
        // Supervisor atribui manualmente
        ticketData.assignedToId = null;
        ticketData.status = 'pending_assignment';
        logger.info('Ticket aguardando atribuição manual');
        break;
    }

    return ticketData;
  }

  // ===== ALGORITMOS DE ATRIBUIÇÃO =====
  
  /**
   * Round Robin: Próximo agente na lista
   */
  async getNextAgentRoundRobin(unitId, unitType) {
    try {
      const where = unitType === 'section' 
        ? { sectionId: unitId, isActive: true, role: ['technician', 'agent', 'admin-org'] }
        : { departmentId: unitId, isActive: true, role: ['technician', 'agent', 'admin-org'] };

      const agents = await User.findAll({
        where,
        order: [['lastAssignedAt', 'ASC']], // Pega quem foi atribuído há mais tempo
        limit: 1
      });

      if (agents.length > 0) {
        const agent = agents[0];
        // Atualizar timestamp de última atribuição
        await agent.update({ lastAssignedAt: new Date() });
        return agent.id;
      }

      return null;
    } catch (error) {
      logger.error('Erro no Round Robin:', error);
      return null;
    }
  }

  /**
   * Load Balance: Agente com menos tickets abertos
   */
  async getAgentWithLeastTickets(unitId, unitType) {
    try {
      const where = unitType === 'section'
        ? { sectionId: unitId, isActive: true, role: ['technician', 'agent', 'admin-org'] }
        : { departmentId: unitId, isActive: true, role: ['technician', 'agent', 'admin-org'] };

      // Buscar agentes e contar tickets abertos
      const agents = await User.findAll({
        where,
        attributes: ['id', 'name', 'email'],
        include: [{
          model: require('../modules/tickets/ticketModel.js').default,
          as: 'assignedTickets',
          attributes: ['id'],
          where: {
            status: ['aberto', 'em_andamento', 'pendente']
          },
          required: false
        }]
      });

      if (agents.length === 0) {
        return null;
      }

      // Ordenar por quantidade de tickets (menos tickets primeiro)
      agents.sort((a, b) => {
        const ticketsA = a.assignedTickets ? a.assignedTickets.length : 0;
        const ticketsB = b.assignedTickets ? b.assignedTickets.length : 0;
        return ticketsA - ticketsB;
      });

      return agents[0].id;
    } catch (error) {
      logger.error('Erro no Load Balance:', error);
      return null;
    }
  }

  // ===== CÁLCULO DE PRIORIDADE =====
  
  /**
   * Calcula prioridade baseado em Urgência + Impacto (ITIL)
   * @param {string} urgency - baixa, media, alta, critica
   * @param {string} impact - baixa, media, alta, critica
   * @returns {string} priority
   */
  calculatePriority(urgency, impact) {
    const matrix = {
      critica: { critica: 'critica', alta: 'critica', media: 'alta', baixa: 'media' },
      alta: { critica: 'critica', alta: 'alta', media: 'alta', baixa: 'media' },
      media: { critica: 'alta', alta: 'alta', media: 'media', baixa: 'baixa' },
      baixa: { critica: 'media', alta: 'media', media: 'baixa', baixa: 'baixa' }
    };

    return matrix[urgency]?.[impact] || 'media';
  }

  // ===== VIP HANDLING =====
  
  /**
   * Verifica se usuário é VIP e aplica escalação
   */
  async checkVIPAndEscalate(ticketData, requesterId) {
    try {
      const requester = await User.findByPk(requesterId);
      
      if (requester && requester.isVIP) {
        logger.info(`Usuário VIP detectado: ${requester.email}`);
        ticketData.priority = 'critica';
        ticketData.escalated = true;
        ticketData.escalationReason = 'VIP User';
        
        // Notificar gestores (implementar)
      }

      return ticketData;
    } catch (error) {
      logger.error('Erro ao verificar VIP:', error);
      return ticketData;
    }
  }

  // ===== SLA =====
  
  async getSLAByPriorityAndCategory(priority, categoryId) {
    try {
      const sla = await SLA.findOne({
        where: {
          priority,
          categoryId: categoryId || null,
          isActive: true
        },
        order: [['createdAt', 'DESC']]
      });

      return sla ? sla.id : null;
    } catch (error) {
      logger.error('Erro ao buscar SLA:', error);
      return null;
    }
  }

  // ===== TRIAGE =====
  
  async routeToTriage(ticketData) {
    logger.info('Ticket sem categoria definida - enviando para Triage');

    // Buscar departamento de Triage
    const triageDept = await Department.findOne({
      where: {
        name: 'Triage',
        organizationId: ticketData.organizationId
      }
    });

    if (triageDept) {
      ticketData.departmentId = triageDept.id;
    }

    ticketData.status = 'pending_categorization';
    ticketData.priority = ticketData.priority || 'media';

    return ticketData;
  }

  // ===== HELPER METHODS =====
  
  /**
   * Valida se o roteamento está completo
   */
  validateRouting(ticketData) {
    const required = ['organizationId', 'departmentId'];
    const missing = required.filter(field => !ticketData[field]);

    if (missing.length > 0) {
      logger.warn(`Campos obrigatórios faltando no roteamento: ${missing.join(', ')}`);
      return false;
    }

    return true;
  }

  /**
   * Log de roteamento para auditoria
   */
  async logRouting(ticketData, originalData) {
    try {
      const changes = {
        directionId: { from: originalData.directionId, to: ticketData.directionId },
        departmentId: { from: originalData.departmentId, to: ticketData.departmentId },
        sectionId: { from: originalData.sectionId, to: ticketData.sectionId },
        assignedToId: { from: originalData.assignedToId, to: ticketData.assignedToId },
        slaId: { from: originalData.slaId, to: ticketData.slaId },
        workflowId: { from: originalData.workflowId, to: ticketData.workflowId }
      };

      logger.info('Roteamento aplicado:', changes);
    } catch (error) {
      logger.error('Erro ao logar roteamento:', error);
    }
  }
}

export default new TicketRoutingService();
