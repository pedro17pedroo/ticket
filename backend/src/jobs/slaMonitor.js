import cron from 'node-cron';
import { Op } from 'sequelize';
import { Ticket, SLA, User, Organization, ClientUser, OrganizationUser } from '../modules/models/index.js';
import logger from '../config/logger.js';
import emailProcessor from '../services/emailProcessor.js';
import { getIO } from '../socket/index.js';

class SLAMonitor {
  constructor() {
    this.job = null;
    this.businessHours = {
      start: 9, // 9:00
      end: 18,  // 18:00
      workDays: [1, 2, 3, 4, 5] // Segunda a Sexta
    };
    this.holidays = []; // Carregar de configuração ou API
    this.escalationRules = [];
  }

  async start() {
    try {
      // Executar a cada 5 minutos
      this.job = cron.schedule('*/5 * * * *', async () => {
        await this.checkSLAViolations();
      });

      // Carregar regras de escalação
      await this.loadEscalationRules();

      logger.info('⏰ Monitor de SLA iniciado (executa a cada 5 minutos)');

      // Executar verificação inicial
      await this.checkSLAViolations();
    } catch (error) {
      logger.error('Erro ao iniciar monitor de SLA:', error);
    }
  }

  async stop() {
    if (this.job) {
      this.job.stop();
      logger.info('⏰ Monitor de SLA parado');
    }
  }

  async checkSLAViolations() {
    try {
      const tickets = await Ticket.findAll({
        where: {
          status: {
            [Op.notIn]: ['fechado', 'resolvido']
          }
        },
        include: [
          {
            model: SLA,
            as: 'sla'
          },
          {
            model: OrganizationUser, // Assignee is always OrganizationUser
            as: 'assignee'
          },
          // Polymorphic Requester
          {
            model: User,
            as: 'requesterUser',
            required: false
          },
          {
            model: OrganizationUser,
            as: 'requesterOrgUser',
            required: false
          },
          {
            model: ClientUser,
            as: 'requesterClientUser',
            required: false
          }
        ]
      });

      logger.info(`🔍 Verificando SLA de ${tickets.length} tickets ativos`);

      for (const ticket of tickets) {
        // Normalize requester for polymorphic associations
        const ticketData = ticket.toJSON();
        let requester = null;
        switch (ticketData.requesterType) {
          case 'provider': requester = ticketData.requesterUser; break;
          case 'organization': requester = ticketData.requesterOrgUser; break;
          case 'client': requester = ticketData.requesterClientUser; break;
        }
        ticket.requester = requester; // Attach normalized requester to model instance (virtual-ish)

        await this.checkTicketSLA(ticket);
      }
    } catch (error) {
      logger.error('Erro ao verificar violações de SLA:', error);
    }
  }

  async checkTicketSLA(ticket) {
    try {
      if (!ticket.sla) {
        // Atribuir SLA padrão baseado na prioridade
        await this.assignDefaultSLA(ticket);
        return;
      }

      const now = new Date();
      const createdAt = new Date(ticket.createdAt);

      // Calcular tempo decorrido em horas úteis
      const businessHoursElapsed = this.calculateBusinessHours(createdAt, now);

      // Atualizar tempo decorrido no ticket
      await ticket.update({
        slaTimeElapsed: businessHoursElapsed
      });

      // Verificar SLA de primeira resposta
      if (!ticket.firstResponseAt) {
        await this.checkResponseTimeSLA(ticket, businessHoursElapsed);
      }

      // Verificar SLA de resolução
      await this.checkResolutionTimeSLA(ticket, businessHoursElapsed);

    } catch (error) {
      logger.error(`Erro ao verificar SLA do ticket #${ticket.ticketNumber}:`, error);
    }
  }

  async assignDefaultSLA(ticket) {
    const defaultSLA = await SLA.findOne({
      where: {
        organizationId: ticket.organizationId,
        priority: ticket.priority,
        isActive: true
      }
    });

    if (defaultSLA) {
      await ticket.update({ slaId: defaultSLA.id });
      logger.info(`📋 SLA padrão atribuído ao ticket #${ticket.ticketNumber}`);
    }
  }

  async checkResponseTimeSLA(ticket, hoursElapsed) {
    const responseTime = ticket.sla.responseTime;
    const percentageElapsed = (hoursElapsed / responseTime) * 100;

    // Verificar diferentes níveis de alerta
    if (percentageElapsed >= 100 && ticket.slaResponseStatus !== 'violated') {
      // SLA violado
      await this.handleSLAViolation(ticket, 'response');
    } else if (percentageElapsed >= 90 && ticket.slaResponseStatus !== 'critical') {
      // 90% do tempo - crítico
      await this.sendSLAWarning(ticket, 'response', 90);
      await ticket.update({ slaResponseStatus: 'critical' });
    } else if (percentageElapsed >= 75 && ticket.slaResponseStatus !== 'warning') {
      // 75% do tempo - aviso
      await this.sendSLAWarning(ticket, 'response', 75);
      await ticket.update({ slaResponseStatus: 'warning' });
    } else if (percentageElapsed >= 50 && ticket.slaResponseStatus !== 'attention') {
      // 50% do tempo - atenção
      await ticket.update({ slaResponseStatus: 'attention' });
    }
  }

  async checkResolutionTimeSLA(ticket, hoursElapsed) {
    const resolutionTime = ticket.sla.resolutionTime;
    const percentageElapsed = (hoursElapsed / resolutionTime) * 100;

    if (percentageElapsed >= 100 && ticket.slaResolutionStatus !== 'violated') {
      // SLA violado
      await this.handleSLAViolation(ticket, 'resolution');
    } else if (percentageElapsed >= 90 && ticket.slaResolutionStatus !== 'critical') {
      // 90% do tempo - crítico
      await this.sendSLAWarning(ticket, 'resolution', 90);
      await ticket.update({ slaResolutionStatus: 'critical' });
    } else if (percentageElapsed >= 75 && ticket.slaResolutionStatus !== 'warning') {
      // 75% do tempo - aviso
      await this.sendSLAWarning(ticket, 'resolution', 75);
      await ticket.update({ slaResolutionStatus: 'warning' });
    } else if (percentageElapsed >= 50 && ticket.slaResolutionStatus !== 'attention') {
      // 50% do tempo - atenção
      await ticket.update({ slaResolutionStatus: 'attention' });
    }
  }

  async handleSLAViolation(ticket, type) {
    logger.warn(`⚠️ SLA violado: Ticket #${ticket.ticketNumber} - ${type}`);

    // Atualizar status
    const updateData = {};
    if (type === 'response') {
      updateData.slaResponseStatus = 'violated';
      updateData.slaResponseViolatedAt = new Date();
    } else {
      updateData.slaResolutionStatus = 'violated';
      updateData.slaResolutionViolatedAt = new Date();
    }
    await ticket.update(updateData);

    // Executar escalação
    await this.escalateTicket(ticket, type);

    // Notificar via WebSocket
    const io = getIO();
    if (io) {
      io.to(`org-${ticket.organizationId}`).emit('sla:violated', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        type: type,
        priority: ticket.priority
      });
    }

    // Enviar notificações
    await this.sendViolationNotifications(ticket, type);
  }

  async escalateTicket(ticket, violationType) {
    const rule = this.findEscalationRule(ticket.priority, violationType);

    if (!rule) {
      logger.info(`Sem regra de escalação para ticket #${ticket.ticketNumber}`);
      return;
    }

    // Aplicar escalação
    const updates = {};

    // Aumentar prioridade
    if (rule.increasePriority) {
      updates.priority = this.getNextPriority(ticket.priority);
    }

    // Reatribuir para supervisor/gerente
    if (rule.reassignTo === 'supervisor' && ticket.assignee) {
      const supervisor = await this.findSupervisor(ticket.assignee);
      if (supervisor) {
        updates.assigneeId = supervisor.id;
      }
    } else if (rule.reassignTo === 'manager') {
      const manager = await this.findManager(ticket);
      if (manager) {
        updates.assigneeId = manager.id;
      }
    }

    // Adicionar tags de escalação
    const currentTags = ticket.tags || [];
    updates.tags = [...currentTags, 'sla-violated', `escalated-${violationType}`];

    await ticket.update(updates);

    // Registrar escalação
    await this.logEscalation(ticket, violationType, rule);

    logger.info(`📈 Ticket #${ticket.ticketNumber} escalado: ${JSON.stringify(updates)}`);
  }

  findEscalationRule(priority, violationType) {
    return this.escalationRules.find(rule =>
      rule.priority === priority &&
      rule.violationType === violationType
    );
  }

  async loadEscalationRules() {
    // Por enquanto, regras hardcoded. Futuramente, carregar do banco
    this.escalationRules = [
      {
        priority: 'baixa',
        violationType: 'response',
        increasePriority: true,
        reassignTo: null,
        notifyManagement: false
      },
      {
        priority: 'media',
        violationType: 'response',
        increasePriority: true,
        reassignTo: 'supervisor',
        notifyManagement: false
      },
      {
        priority: 'alta',
        violationType: 'response',
        increasePriority: true,
        reassignTo: 'manager',
        notifyManagement: true
      },
      {
        priority: 'urgente',
        violationType: 'response',
        increasePriority: false, // Já está no máximo
        reassignTo: 'manager',
        notifyManagement: true
      },
      {
        priority: 'baixa',
        violationType: 'resolution',
        increasePriority: true,
        reassignTo: 'supervisor',
        notifyManagement: false
      },
      {
        priority: 'media',
        violationType: 'resolution',
        increasePriority: true,
        reassignTo: 'manager',
        notifyManagement: true
      },
      {
        priority: 'alta',
        violationType: 'resolution',
        increasePriority: true,
        reassignTo: 'manager',
        notifyManagement: true
      },
      {
        priority: 'urgente',
        violationType: 'resolution',
        increasePriority: false,
        reassignTo: 'manager',
        notifyManagement: true
      }
    ];
  }

  getNextPriority(currentPriority) {
    const priorities = ['baixa', 'media', 'alta', 'urgente'];
    const currentIndex = priorities.indexOf(currentPriority);

    if (currentIndex < priorities.length - 1) {
      return priorities[currentIndex + 1];
    }

    return currentPriority; // Já está no máximo
  }

  async findSupervisor(user) {
    // Buscar supervisor do departamento
    const supervisor = await User.findOne({
      where: {
        departmentId: user.departmentId,
        role: ['org-admin', 'supervisor'],
        isActive: true
      }
    });

    return supervisor;
  }

  async findManager(ticket) {
    // Buscar gerente da organização
    const manager = await User.findOne({
      where: {
        organizationId: ticket.organizationId,
        role: 'org-admin',
        isActive: true
      },
      order: [['createdAt', 'ASC']] // Pegar o mais antigo (provavelmente o principal)
    });

    return manager;
  }

  async logEscalation(ticket, violationType, rule) {
    // Criar registro de auditoria
    logger.info(`📝 Escalação registrada: Ticket #${ticket.ticketNumber}, Tipo: ${violationType}`);

    // TODO: Criar modelo de auditoria de escalação
    // await EscalationLog.create({
    //   ticketId: ticket.id,
    //   violationType,
    //   rule: JSON.stringify(rule),
    //   timestamp: new Date()
    // });
  }

  async sendSLAWarning(ticket, type, percentage) {
    logger.info(`⚠️ Aviso SLA ${percentage}%: Ticket #${ticket.ticketNumber} - ${type}`);

    // Notificar agente responsável
    if (ticket.assignee?.email) {
      await emailProcessor.sendTicketUpdate(ticket, {
        slaWarning: {
          type,
          percentage,
          timeRemaining: this.calculateTimeRemaining(ticket, type)
        }
      }, ticket.assignee.email);
    }

    // Notificar via WebSocket
    const io = getIO();
    if (io) {
      io.to(`org-${ticket.organizationId}`).emit('sla:warning', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        type: type,
        percentage: percentage,
        priority: ticket.priority
      });
    }
  }

  async sendViolationNotifications(ticket, type) {
    const recipients = [];

    // Adicionar agente responsável
    if (ticket.assignee?.email) {
      recipients.push(ticket.assignee.email);
    }

    // Adicionar gerentes se necessário
    const rule = this.findEscalationRule(ticket.priority, type);
    if (rule?.notifyManagement) {
      const managers = await User.findAll({
        where: {
          organizationId: ticket.organizationId,
          role: 'org-admin',
          isActive: true
        }
      });

      managers.forEach(manager => {
        if (manager.email) recipients.push(manager.email);
      });
    }

    // Enviar notificações
    for (const email of recipients) {
      await emailProcessor.sendTicketUpdate(ticket, {
        slaViolation: {
          type,
          violatedAt: new Date()
        }
      }, email);
    }
  }

  calculateBusinessHours(startDate, endDate) {
    let totalHours = 0;
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current < end) {
      // Verificar se é dia útil
      const dayOfWeek = current.getDay();
      if (this.businessHours.workDays.includes(dayOfWeek)) {
        // Verificar se não é feriado
        if (!this.isHoliday(current)) {
          // Calcular horas do dia
          const dayStart = new Date(current);
          dayStart.setHours(this.businessHours.start, 0, 0, 0);

          const dayEnd = new Date(current);
          dayEnd.setHours(this.businessHours.end, 0, 0, 0);

          // Ajustar para início e fim reais
          const actualStart = dayStart > startDate ? dayStart : startDate;
          const actualEnd = dayEnd < end ? dayEnd : end;

          if (actualEnd > actualStart) {
            const hoursInDay = (actualEnd - actualStart) / (1000 * 60 * 60);
            totalHours += Math.max(0, hoursInDay);
          }
        }
      }

      // Avançar para próximo dia
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    return totalHours;
  }

  isHoliday(date) {
    // Verificar se a data está na lista de feriados
    const dateStr = date.toISOString().split('T')[0];
    return this.holidays.includes(dateStr);
  }

  calculateTimeRemaining(ticket, type) {
    const slaTime = type === 'response'
      ? ticket.sla.responseTime
      : ticket.sla.resolutionTime;

    const elapsed = ticket.slaTimeElapsed || 0;
    const remaining = Math.max(0, slaTime - elapsed);

    return {
      hours: Math.floor(remaining),
      minutes: Math.round((remaining % 1) * 60)
    };
  }

  async getStatistics() {
    const stats = await Ticket.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN sla_response_status = 'violated' THEN 1 ELSE 0 END")), 'responseViolations'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN sla_resolution_status = 'violated' THEN 1 ELSE 0 END")), 'resolutionViolations'],
        [sequelize.fn('AVG', sequelize.col('sla_time_elapsed')), 'avgTimeElapsed']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
        }
      }
    });

    return stats[0];
  }
}

export default new SLAMonitor();
