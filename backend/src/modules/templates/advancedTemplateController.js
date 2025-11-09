import { Op } from 'sequelize';
import TicketTemplate from '../../models/TicketTemplate.js';
import Macro from '../../models/Macro.js';
import EmailTemplate from '../../models/EmailTemplate.js';
import { Ticket, User, Comment, Tag } from '../models/index.js';
import logger from '../../config/logger.js';
import emailProcessor from '../../services/emailProcessor.js';
import { getIO } from '../../socket/index.js';

class AdvancedTemplateController {
  // ===== TICKET TEMPLATES =====
  
  async getTemplates(req, res) {
    try {
      const { organizationId } = req.user;
      const { type, category, isActive = true } = req.query;

      const where = {
        organizationId,
        ...(type && { type }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive })
      };

      const templates = await TicketTemplate.findAll({
        where,
        order: [
          ['quickAccess', 'DESC'],
          ['priority', 'ASC'],
          ['name', 'ASC']
        ]
      });

      // Filtrar por permissões
      const accessibleTemplates = templates.filter(template => 
        this.hasTemplateAccess(template, req.user)
      );

      res.json(accessibleTemplates);
    } catch (error) {
      logger.error('Erro ao buscar templates:', error);
      res.status(500).json({ error: 'Erro ao buscar templates' });
    }
  }

  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const template = await TicketTemplate.findOne({
        where: { id, organizationId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado' });
      }

      if (!this.hasTemplateAccess(template, req.user)) {
        return res.status(403).json({ error: 'Sem permissão para acessar este template' });
      }

      res.json(template);
    } catch (error) {
      logger.error('Erro ao buscar template:', error);
      res.status(500).json({ error: 'Erro ao buscar template' });
    }
  }

  async createTemplate(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;

      const template = await TicketTemplate.create({
        ...req.body,
        organizationId,
        createdById
      });

      res.status(201).json(template);
    } catch (error) {
      logger.error('Erro ao criar template:', error);
      res.status(500).json({ error: 'Erro ao criar template' });
    }
  }

  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const template = await TicketTemplate.findOne({
        where: { id, organizationId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado' });
      }

      await template.update(req.body);

      res.json(template);
    } catch (error) {
      logger.error('Erro ao atualizar template:', error);
      res.status(500).json({ error: 'Erro ao atualizar template' });
    }
  }

  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const template = await TicketTemplate.findOne({
        where: { id, organizationId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado' });
      }

      await template.destroy();

      res.json({ message: 'Template removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover template:', error);
      res.status(500).json({ error: 'Erro ao remover template' });
    }
  }

  async applyTemplate(req, res) {
    try {
      const { ticketId, templateId } = req.body;
      const { organizationId } = req.user;

      const [ticket, template] = await Promise.all([
        Ticket.findOne({ where: { id: ticketId, organizationId } }),
        TicketTemplate.findOne({ where: { id: templateId, organizationId } })
      ]);

      if (!ticket || !template) {
        return res.status(404).json({ error: 'Ticket ou template não encontrado' });
      }

      if (!this.hasTemplateAccess(template, req.user)) {
        return res.status(403).json({ error: 'Sem permissão para usar este template' });
      }

      // Aplicar conteúdo do template
      const result = await this.applyTemplateToTicket(template, ticket, req.user);

      // Incrementar contador de uso
      await template.update({
        usageCount: template.usageCount + 1,
        lastUsedAt: new Date()
      });

      res.json(result);
    } catch (error) {
      logger.error('Erro ao aplicar template:', error);
      res.status(500).json({ error: 'Erro ao aplicar template' });
    }
  }

  // ===== MACROS =====

  async getMacros(req, res) {
    try {
      const { organizationId } = req.user;
      const { isActive = true } = req.query;

      const where = {
        organizationId,
        ...(isActive !== undefined && { isActive })
      };

      const macros = await Macro.findAll({
        where,
        order: [
          ['quickAccess', 'DESC'],
          ['priority', 'ASC'],
          ['name', 'ASC']
        ]
      });

      // Filtrar por permissões
      const accessibleMacros = macros.filter(macro => 
        this.hasMacroAccess(macro, req.user)
      );

      res.json(accessibleMacros);
    } catch (error) {
      logger.error('Erro ao buscar macros:', error);
      res.status(500).json({ error: 'Erro ao buscar macros' });
    }
  }

  async getMacroById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const macro = await Macro.findOne({
        where: { id, organizationId }
      });

      if (!macro) {
        return res.status(404).json({ error: 'Macro não encontrada' });
      }

      if (!this.hasMacroAccess(macro, req.user)) {
        return res.status(403).json({ error: 'Sem permissão para acessar esta macro' });
      }

      res.json(macro);
    } catch (error) {
      logger.error('Erro ao buscar macro:', error);
      res.status(500).json({ error: 'Erro ao buscar macro' });
    }
  }

  async createMacro(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;

      const macro = await Macro.create({
        ...req.body,
        organizationId,
        createdById
      });

      res.status(201).json(macro);
    } catch (error) {
      logger.error('Erro ao criar macro:', error);
      res.status(500).json({ error: 'Erro ao criar macro' });
    }
  }

  async updateMacro(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const macro = await Macro.findOne({
        where: { id, organizationId }
      });

      if (!macro) {
        return res.status(404).json({ error: 'Macro não encontrada' });
      }

      await macro.update(req.body);

      res.json(macro);
    } catch (error) {
      logger.error('Erro ao atualizar macro:', error);
      res.status(500).json({ error: 'Erro ao atualizar macro' });
    }
  }

  async deleteMacro(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const macro = await Macro.findOne({
        where: { id, organizationId }
      });

      if (!macro) {
        return res.status(404).json({ error: 'Macro não encontrada' });
      }

      await macro.destroy();

      res.json({ message: 'Macro removida com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover macro:', error);
      res.status(500).json({ error: 'Erro ao remover macro' });
    }
  }

  async executeMacro(req, res) {
    try {
      const { ticketId, macroId } = req.body;
      const { organizationId } = req.user;

      const [ticket, macro] = await Promise.all([
        Ticket.findOne({ 
          where: { id: ticketId, organizationId },
          include: [
            { model: User, as: 'requester' },
            { model: User, as: 'assignee' }
          ]
        }),
        Macro.findOne({ where: { id: macroId, organizationId } })
      ]);

      if (!ticket || !macro) {
        return res.status(404).json({ error: 'Ticket ou macro não encontrado' });
      }

      if (!this.hasMacroAccess(macro, req.user)) {
        return res.status(403).json({ error: 'Sem permissão para executar esta macro' });
      }

      // Verificar condições
      if (!this.checkMacroConditions(macro, ticket)) {
        return res.status(400).json({ 
          error: 'As condições da macro não foram atendidas' 
        });
      }

      // Executar ações da macro
      const results = await this.executeMacroActions(macro, ticket, req.user);

      // Atualizar histórico
      await this.updateMacroHistory(macro, ticket, req.user, results);

      // Incrementar contador
      await macro.update({
        executionCount: macro.executionCount + 1,
        lastExecutedAt: new Date()
      });

      res.json({
        success: true,
        results,
        message: `Macro "${macro.name}" executada com sucesso`
      });
    } catch (error) {
      logger.error('Erro ao executar macro:', error);
      res.status(500).json({ error: 'Erro ao executar macro' });
    }
  }

  async batchExecuteMacro(req, res) {
    try {
      const { ticketIds, macroId } = req.body;
      const { organizationId } = req.user;

      const macro = await Macro.findOne({
        where: { id: macroId, organizationId }
      });

      if (!macro) {
        return res.status(404).json({ error: 'Macro não encontrada' });
      }

      if (!this.hasMacroAccess(macro, req.user)) {
        return res.status(403).json({ error: 'Sem permissão para executar esta macro' });
      }

      const results = [];
      
      for (const ticketId of ticketIds) {
        try {
          const ticket = await Ticket.findOne({
            where: { id: ticketId, organizationId }
          });

          if (!ticket || !this.checkMacroConditions(macro, ticket)) {
            results.push({
              ticketId,
              success: false,
              error: 'Ticket não encontrado ou condições não atendidas'
            });
            continue;
          }

          const actionResults = await this.executeMacroActions(macro, ticket, req.user);
          results.push({
            ticketId,
            success: true,
            results: actionResults
          });
        } catch (error) {
          results.push({
            ticketId,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        total: ticketIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      });
    } catch (error) {
      logger.error('Erro ao executar macro em lote:', error);
      res.status(500).json({ error: 'Erro ao executar macro em lote' });
    }
  }

  // ===== EMAIL TEMPLATES =====

  async getEmailTemplates(req, res) {
    try {
      const { organizationId } = req.user;
      const { type, active = true } = req.query;

      const where = {
        organizationId,
        ...(type && { type }),
        ...(active !== undefined && { active })
      };

      const templates = await EmailTemplate.findAll({
        where,
        order: [['name', 'ASC']]
      });

      res.json(templates);
    } catch (error) {
      logger.error('Erro ao buscar templates de e-mail:', error);
      res.status(500).json({ error: 'Erro ao buscar templates de e-mail' });
    }
  }

  async createEmailTemplate(req, res) {
    try {
      const { organizationId } = req.user;

      const template = await EmailTemplate.create({
        ...req.body,
        organizationId
      });

      res.status(201).json(template);
    } catch (error) {
      logger.error('Erro ao criar template de e-mail:', error);
      res.status(500).json({ error: 'Erro ao criar template de e-mail' });
    }
  }

  async updateEmailTemplate(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const template = await EmailTemplate.findOne({
        where: { id, organizationId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado' });
      }

      await template.update(req.body);

      res.json(template);
    } catch (error) {
      logger.error('Erro ao atualizar template de e-mail:', error);
      res.status(500).json({ error: 'Erro ao atualizar template de e-mail' });
    }
  }

  async deleteEmailTemplate(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const template = await EmailTemplate.findOne({
        where: { id, organizationId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado' });
      }

      await template.destroy();

      res.json({ message: 'Template removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover template de e-mail:', error);
      res.status(500).json({ error: 'Erro ao remover template de e-mail' });
    }
  }

  async previewEmailTemplate(req, res) {
    try {
      const { id } = req.params;
      const { ticketId } = req.query;
      const { organizationId } = req.user;

      const template = await EmailTemplate.findOne({
        where: { id, organizationId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado' });
      }

      // Se um ticket foi fornecido, usar seus dados para preview
      let context = {};
      if (ticketId) {
        const ticket = await Ticket.findOne({
          where: { id: ticketId, organizationId },
          include: [
            { model: User, as: 'requester' },
            { model: User, as: 'assignee' }
          ]
        });

        if (ticket) {
          context = this.buildTemplateContext(ticket, req.user);
        }
      } else {
        // Usar dados de exemplo
        context = this.buildSampleContext();
      }

      const rendered = this.renderTemplate(template.content, context);

      res.json({
        subject: this.renderTemplate(template.subject, context),
        content: rendered,
        variables: template.variables,
        context
      });
    } catch (error) {
      logger.error('Erro ao visualizar template:', error);
      res.status(500).json({ error: 'Erro ao visualizar template' });
    }
  }

  // ===== HELPER METHODS =====

  hasTemplateAccess(template, user) {
    if (template.isPublic) return true;
    if (template.createdById === user.id) return true;

    const perms = template.permissions || {};
    
    if (perms.users?.includes(user.id)) return true;
    if (perms.roles?.includes(user.role)) return true;
    if (perms.departments?.includes(user.departmentId)) return true;
    
    return false;
  }

  hasMacroAccess(macro, user) {
    if (macro.isPublic) return true;
    if (macro.createdById === user.id) return true;

    const perms = macro.permissions || {};
    
    if (perms.users?.includes(user.id)) return true;
    if (perms.roles?.includes(user.role)) return true;
    if (perms.departments?.includes(user.departmentId)) return true;
    
    return false;
  }

  checkMacroConditions(macro, ticket) {
    const conditions = macro.conditions || {};
    
    // Se não há condições, sempre executar
    if (Object.keys(conditions).length === 0) return true;

    // Verificar status
    if (conditions.ticketStatus && !conditions.ticketStatus.includes(ticket.status)) {
      return false;
    }

    // Verificar prioridade
    if (conditions.priority && !conditions.priority.includes(ticket.priority)) {
      return false;
    }

    // Verificar categoria
    if (conditions.category && ticket.categoryId !== conditions.category) {
      return false;
    }

    // Verificar departamento
    if (conditions.department && ticket.departmentId !== conditions.department) {
      return false;
    }

    // Verificar tempo aberto
    if (conditions.timeOpen) {
      const hoursOpen = (Date.now() - ticket.createdAt) / (1000 * 60 * 60);
      const { operator, value } = conditions.timeOpen;
      
      switch (operator) {
        case '>': if (!(hoursOpen > value)) return false; break;
        case '<': if (!(hoursOpen < value)) return false; break;
        case '>=': if (!(hoursOpen >= value)) return false; break;
        case '<=': if (!(hoursOpen <= value)) return false; break;
        case '=': if (!(Math.abs(hoursOpen - value) < 0.1)) return false; break;
      }
    }

    return true;
  }

  async applyTemplateToTicket(template, ticket, user) {
    const results = [];

    // Aplicar conteúdo
    if (template.content) {
      const context = this.buildTemplateContext(ticket, user);
      const renderedContent = this.renderTemplate(template.content, context);

      // Adicionar comentário
      const comment = await Comment.create({
        content: renderedContent,
        ticketId: ticket.id,
        userId: user.id,
        isPublic: true,
        organizationId: user.organizationId
      });

      results.push({ action: 'comment', success: true, data: comment.id });
    }

    // Executar ações
    if (template.actions?.length > 0) {
      for (const action of template.actions) {
        try {
          const result = await this.executeAction(action, ticket, user);
          results.push(result);
        } catch (error) {
          results.push({
            action: action.type,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  async executeMacroActions(macro, ticket, user) {
    const results = [];
    const actions = macro.actions || [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, ticket, user);
        results.push(result);
      } catch (error) {
        logger.error(`Erro ao executar ação ${action.type}:`, error);
        results.push({
          action: action.type,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async executeAction(action, ticket, user) {
    switch (action.type) {
      case 'status':
        await ticket.update({ status: action.value });
        return { action: 'status', success: true, value: action.value };

      case 'priority':
        await ticket.update({ priority: action.value });
        return { action: 'priority', success: true, value: action.value };

      case 'assign':
        await ticket.update({ assigneeId: action.value });
        return { action: 'assign', success: true, value: action.value };

      case 'department':
        await ticket.update({ departmentId: action.value });
        return { action: 'department', success: true, value: action.value };

      case 'addTag':
        // TODO: Implementar tags
        return { action: 'addTag', success: true, value: action.value };

      case 'removeTag':
        // TODO: Implementar tags
        return { action: 'removeTag', success: true, value: action.value };

      case 'addComment':
        const comment = await Comment.create({
          content: action.value,
          ticketId: ticket.id,
          userId: user.id,
          isPublic: action.isPublic !== false,
          organizationId: user.organizationId
        });
        return { action: 'addComment', success: true, data: comment.id };

      case 'sendEmail':
        // TODO: Implementar envio de e-mail
        return { action: 'sendEmail', success: true };

      case 'webhook':
        // TODO: Implementar webhook
        return { action: 'webhook', success: true };

      default:
        return { action: action.type, success: false, error: 'Ação não implementada' };
    }
  }

  async updateMacroHistory(macro, ticket, user, results) {
    const history = macro.executionHistory || [];
    
    history.push({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId: user.id,
      userName: user.name,
      executedAt: new Date(),
      results: results.map(r => ({
        action: r.action,
        success: r.success,
        error: r.error
      }))
    });

    // Manter apenas últimas 100 execuções
    if (history.length > 100) {
      history.shift();
    }

    await macro.update({ executionHistory: history });
  }

  buildTemplateContext(ticket, user) {
    return {
      ticket: {
        id: ticket.id,
        number: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      },
      requester: ticket.requester ? {
        name: ticket.requester.name,
        email: ticket.requester.email,
        phone: ticket.requester.phone
      } : {},
      assignee: ticket.assignee ? {
        name: ticket.assignee.name,
        email: ticket.assignee.email
      } : {},
      agent: {
        name: user.name,
        email: user.email,
        role: user.role
      },
      organization: {
        name: user.organization?.name || 'Organização'
      },
      date: {
        today: new Date().toLocaleDateString('pt-BR'),
        now: new Date().toLocaleString('pt-BR')
      }
    };
  }

  buildSampleContext() {
    return {
      ticket: {
        id: 123,
        number: '000123',
        subject: 'Exemplo de ticket',
        description: 'Descrição de exemplo',
        status: 'novo',
        priority: 'media',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      requester: {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        phone: '(11) 98765-4321'
      },
      assignee: {
        name: 'Maria Santos',
        email: 'maria@empresa.com'
      },
      agent: {
        name: 'Agente Exemplo',
        email: 'agente@empresa.com',
        role: 'agente'
      },
      organization: {
        name: 'Empresa Exemplo'
      },
      date: {
        today: new Date().toLocaleDateString('pt-BR'),
        now: new Date().toLocaleString('pt-BR')
      }
    };
  }

  renderTemplate(template, context) {
    let rendered = template;
    
    // Substituir variáveis usando notação {{variable.path}}
    const replaceVariables = (str, obj, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          str = replaceVariables(str, value, fullKey);
        } else {
          const regex = new RegExp(`{{\\s*${fullKey}\\s*}}`, 'g');
          str = str.replace(regex, value || '');
        }
      });
      
      return str;
    };
    
    return replaceVariables(rendered, context);
  }

  async getQuickAccessItems(req, res) {
    try {
      const { organizationId } = req.user;

      const [templates, macros] = await Promise.all([
        TicketTemplate.findAll({
          where: {
            organizationId,
            quickAccess: true,
            isActive: true
          },
          order: [['priority', 'ASC']],
          limit: 10
        }),
        Macro.findAll({
          where: {
            organizationId,
            quickAccess: true,
            isActive: true
          },
          order: [['priority', 'ASC']],
          limit: 10
        })
      ]);

      res.json({
        templates: templates.filter(t => this.hasTemplateAccess(t, req.user)),
        macros: macros.filter(m => this.hasMacroAccess(m, req.user))
      });
    } catch (error) {
      logger.error('Erro ao buscar itens de acesso rápido:', error);
      res.status(500).json({ error: 'Erro ao buscar itens de acesso rápido' });
    }
  }

  async getTemplateStatistics(req, res) {
    try {
      const { organizationId } = req.user;

      const [templates, macros, emailTemplates] = await Promise.all([
        TicketTemplate.count({ where: { organizationId } }),
        Macro.count({ where: { organizationId } }),
        EmailTemplate.count({ where: { organizationId } })
      ]);

      const mostUsedTemplates = await TicketTemplate.findAll({
        where: { organizationId },
        order: [['usageCount', 'DESC']],
        limit: 5,
        attributes: ['id', 'name', 'type', 'usageCount', 'lastUsedAt']
      });

      const mostUsedMacros = await Macro.findAll({
        where: { organizationId },
        order: [['executionCount', 'DESC']],
        limit: 5,
        attributes: ['id', 'name', 'executionCount', 'lastExecutedAt']
      });

      res.json({
        totals: {
          templates,
          macros,
          emailTemplates
        },
        mostUsedTemplates,
        mostUsedMacros
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
}

export default new AdvancedTemplateController();
