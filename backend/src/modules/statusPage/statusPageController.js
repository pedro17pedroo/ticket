import { Op } from 'sequelize';
import Service from '../../models/Service.js';
import Incident from '../../models/Incident.js';
import Maintenance from '../../models/Maintenance.js';
import StatusSubscription from '../../models/StatusSubscription.js';
import logger from '../../config/logger.js';
import { v4 as uuidv4 } from 'uuid';
import emailProcessor from '../../services/emailProcessor.js';

class StatusPageController {
  // ===== PUBLIC ENDPOINTS =====
  
  async getPublicStatus(req, res) {
    try {
      const { organizationId } = req.params;
      
      // Buscar todos os serviços públicos
      const services = await Service.findAll({
        where: {
          organizationId,
          isPublic: true
        },
        attributes: [
          'id', 'name', 'displayName', 'description', 
          'category', 'status', 'statusMessage', 
          'uptime', 'responseTime', 'metrics'
        ],
        order: [['priority', 'ASC'], ['name', 'ASC']]
      });

      // Buscar incidentes ativos
      const activeIncidents = await Incident.findAll({
        where: {
          organizationId,
          isPublic: true,
          status: {
            [Op.notIn]: ['resolved', 'postmortem']
          }
        },
        order: [['createdAt', 'DESC']]
      });

      // Buscar incidentes resolvidos (últimos 7 dias)
      const resolvedIncidents = await Incident.findAll({
        where: {
          organizationId,
          isPublic: true,
          status: 'resolved',
          resolvedAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['resolvedAt', 'DESC']],
        limit: 10
      });

      // Buscar manutenções futuras
      const upcomingMaintenances = await Maintenance.findAll({
        where: {
          organizationId,
          isPublic: true,
          status: 'scheduled',
          scheduledStartAt: {
            [Op.gte]: new Date()
          }
        },
        order: [['scheduledStartAt', 'ASC']],
        limit: 5
      });

      // Calcular status geral
      const overallStatus = this.calculateOverallStatus(services, activeIncidents);

      // Calcular métricas gerais
      const metrics = this.calculateSystemMetrics(services);

      res.json({
        status: overallStatus,
        message: this.getStatusMessage(overallStatus),
        services,
        incidents: {
          active: activeIncidents,
          resolved: resolvedIncidents
        },
        maintenances: upcomingMaintenances,
        metrics,
        lastUpdated: new Date()
      });
    } catch (error) {
      logger.error('Erro ao buscar status público:', error);
      res.status(500).json({ error: 'Erro ao buscar status' });
    }
  }

  async getServiceHistory(req, res) {
    try {
      const { organizationId, serviceId } = req.params;
      const { days = 30 } = req.query;

      const service = await Service.findOne({
        where: {
          id: serviceId,
          organizationId,
          isPublic: true
        }
      });

      if (!service) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }

      // Buscar incidentes do serviço
      const incidents = await Incident.findAll({
        where: {
          organizationId,
          isPublic: true,
          affectedServices: {
            [Op.contains]: [serviceId]
          },
          createdAt: {
            [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          }
        },
        order: [['createdAt', 'DESC']]
      });

      res.json({
        service: {
          id: service.id,
          name: service.displayName,
          currentStatus: service.status,
          uptime: service.metrics
        },
        incidents,
        uptimeHistory: service.uptimeHistory || []
      });
    } catch (error) {
      logger.error('Erro ao buscar histórico do serviço:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  }

  async subscribe(req, res) {
    try {
      const { organizationId } = req.params;
      const { email, name, type = 'all', services = [] } = req.body;

      // Verificar se já existe inscrição
      let subscription = await StatusSubscription.findOne({
        where: { email, organizationId }
      });

      if (subscription) {
        // Atualizar inscrição existente
        await subscription.update({
          name,
          type,
          services,
          isActive: true
        });
      } else {
        // Criar nova inscrição
        subscription = await StatusSubscription.create({
          email,
          name,
          type,
          services,
          organizationId,
          unsubscribeToken: uuidv4()
        });
      }

      // Enviar e-mail de confirmação
      await this.sendSubscriptionConfirmation(subscription);

      res.json({
        success: true,
        message: 'Inscrição realizada com sucesso',
        unsubscribeToken: subscription.unsubscribeToken
      });
    } catch (error) {
      logger.error('Erro ao realizar inscrição:', error);
      res.status(500).json({ error: 'Erro ao realizar inscrição' });
    }
  }

  async unsubscribe(req, res) {
    try {
      const { token } = req.params;

      const subscription = await StatusSubscription.findOne({
        where: { unsubscribeToken: token }
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      await subscription.update({ isActive: false });

      res.json({
        success: true,
        message: 'Inscrição cancelada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao cancelar inscrição:', error);
      res.status(500).json({ error: 'Erro ao cancelar inscrição' });
    }
  }

  // ===== ADMIN ENDPOINTS =====

  async createService(req, res) {
    try {
      const { organizationId } = req.user;
      const serviceData = { ...req.body, organizationId };

      const service = await Service.create(serviceData);

      res.status(201).json(service);
    } catch (error) {
      logger.error('Erro ao criar serviço:', error);
      res.status(500).json({ error: 'Erro ao criar serviço' });
    }
  }

  async updateService(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const service = await Service.findOne({
        where: { id, organizationId }
      });

      if (!service) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }

      await service.update(req.body);

      // Se o status mudou, verificar se precisa criar incidente
      if (req.body.status && req.body.status !== service.status) {
        await this.handleServiceStatusChange(service, req.body.status);
      }

      res.json(service);
    } catch (error) {
      logger.error('Erro ao atualizar serviço:', error);
      res.status(500).json({ error: 'Erro ao atualizar serviço' });
    }
  }

  async createIncident(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;
      const incidentData = {
        ...req.body,
        organizationId,
        createdById,
        updates: [{
          status: 'investigating',
          message: req.body.description,
          timestamp: new Date(),
          userId: createdById
        }]
      };

      const incident = await Incident.create(incidentData);

      // Atualizar status dos serviços afetados
      if (incident.affectedServices?.length > 0) {
        await Service.update(
          { 
            status: this.getServiceStatusFromImpact(incident.impact),
            statusMessage: `Incidente: ${incident.title}`
          },
          { 
            where: { 
              id: incident.affectedServices,
              organizationId 
            }
          }
        );
      }

      // Notificar inscritos
      await this.notifySubscribers('incident_created', incident);

      res.status(201).json(incident);
    } catch (error) {
      logger.error('Erro ao criar incidente:', error);
      res.status(500).json({ error: 'Erro ao criar incidente' });
    }
  }

  async updateIncident(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;
      const { status, message, ...updateData } = req.body;

      const incident = await Incident.findOne({
        where: { id, organizationId }
      });

      if (!incident) {
        return res.status(404).json({ error: 'Incidente não encontrado' });
      }

      // Adicionar update ao histórico
      const updates = incident.updates || [];
      if (message) {
        updates.push({
          status,
          message,
          timestamp: new Date(),
          userId
        });
      }

      // Atualizar timestamps baseado no status
      const timestamps = {};
      if (status === 'identified' && !incident.identifiedAt) {
        timestamps.identifiedAt = new Date();
      }
      if (status === 'resolved' && !incident.resolvedAt) {
        timestamps.resolvedAt = new Date();
        timestamps.resolvedById = userId;
        
        // Restaurar status dos serviços
        if (incident.affectedServices?.length > 0) {
          await Service.update(
            { 
              status: 'operational',
              statusMessage: null
            },
            { 
              where: { 
                id: incident.affectedServices,
                organizationId 
              }
            }
          );
        }
      }

      await incident.update({
        ...updateData,
        status,
        updates,
        ...timestamps
      });

      // Notificar inscritos
      await this.notifySubscribers('incident_updated', incident);

      res.json(incident);
    } catch (error) {
      logger.error('Erro ao atualizar incidente:', error);
      res.status(500).json({ error: 'Erro ao atualizar incidente' });
    }
  }

  async createMaintenance(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;
      const maintenanceData = {
        ...req.body,
        organizationId,
        createdById
      };

      const maintenance = await Maintenance.create(maintenanceData);

      // Agendar notificações
      await this.scheduleMaintenanceNotifications(maintenance);

      res.status(201).json(maintenance);
    } catch (error) {
      logger.error('Erro ao criar manutenção:', error);
      res.status(500).json({ error: 'Erro ao criar manutenção' });
    }
  }

  async updateMaintenance(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;
      const { status, ...updateData } = req.body;

      const maintenance = await Maintenance.findOne({
        where: { id, organizationId }
      });

      if (!maintenance) {
        return res.status(404).json({ error: 'Manutenção não encontrada' });
      }

      const timestamps = {};
      if (status === 'in_progress' && !maintenance.actualStartAt) {
        timestamps.actualStartAt = new Date();
        
        // Atualizar status dos serviços
        if (maintenance.affectedServices?.length > 0) {
          await Service.update(
            { 
              status: 'under_maintenance',
              statusMessage: `Manutenção: ${maintenance.title}`
            },
            { 
              where: { 
                id: maintenance.affectedServices,
                organizationId 
              }
            }
          );
        }
      }
      
      if (status === 'completed' && !maintenance.actualEndAt) {
        timestamps.actualEndAt = new Date();
        timestamps.completedById = userId;
        timestamps.actualDowntime = Math.round(
          (new Date() - maintenance.actualStartAt) / 60000
        );
        
        // Restaurar status dos serviços
        if (maintenance.affectedServices?.length > 0) {
          await Service.update(
            { 
              status: 'operational',
              statusMessage: null
            },
            { 
              where: { 
                id: maintenance.affectedServices,
                organizationId 
              }
            }
          );
        }
      }

      await maintenance.update({
        ...updateData,
        status,
        ...timestamps
      });

      // Notificar inscritos
      if (status === 'in_progress' || status === 'completed') {
        await this.notifySubscribers('maintenance_updated', maintenance);
      }

      res.json(maintenance);
    } catch (error) {
      logger.error('Erro ao atualizar manutenção:', error);
      res.status(500).json({ error: 'Erro ao atualizar manutenção' });
    }
  }

  // ===== HEALTH CHECK =====

  async performHealthCheck(serviceId) {
    try {
      const service = await Service.findByPk(serviceId);
      if (!service || !service.monitoringEnabled || !service.healthCheckUrl) {
        return;
      }

      const startTime = Date.now();
      
      try {
        const response = await fetch(service.healthCheckUrl, {
          timeout: 5000,
          method: 'GET'
        });

        const responseTime = Date.now() - startTime;
        const isHealthy = response.ok;

        // Atualizar métricas
        await service.update({
          status: isHealthy ? 'operational' : 'degraded_performance',
          responseTime,
          lastHealthCheck: new Date()
        });

        // Se o serviço estava down e voltou, resolver incidentes automáticos
        if (isHealthy && service.status !== 'operational') {
          await this.autoResolveIncidents(serviceId);
        }

        // Se o serviço caiu, criar incidente automático
        if (!isHealthy && service.status === 'operational') {
          await this.createAutomaticIncident(service);
        }
      } catch (error) {
        // Serviço está down
        await service.update({
          status: 'major_outage',
          statusMessage: 'Health check failed',
          lastHealthCheck: new Date()
        });

        await this.createAutomaticIncident(service);
      }

      // Atualizar histórico de uptime
      await this.updateUptimeHistory(service);
    } catch (error) {
      logger.error(`Erro no health check do serviço ${serviceId}:`, error);
    }
  }

  // ===== HELPER METHODS =====

  calculateOverallStatus(services, incidents) {
    if (incidents.some(i => i.impact === 'critical')) {
      return 'major_outage';
    }
    
    const statuses = services.map(s => s.status);
    
    if (statuses.includes('major_outage')) {
      return 'major_outage';
    }
    if (statuses.includes('partial_outage')) {
      return 'partial_outage';
    }
    if (statuses.includes('degraded_performance')) {
      return 'degraded_performance';
    }
    if (statuses.includes('under_maintenance')) {
      return 'under_maintenance';
    }
    
    return 'operational';
  }

  getStatusMessage(status) {
    const messages = {
      'operational': 'Todos os sistemas operacionais',
      'degraded_performance': 'Experiencing degraded performance',
      'partial_outage': 'Partial system outage',
      'major_outage': 'Major system outage',
      'under_maintenance': 'System under maintenance'
    };
    return messages[status] || 'Status desconhecido';
  }

  getServiceStatusFromImpact(impact) {
    const statusMap = {
      'critical': 'major_outage',
      'major': 'partial_outage',
      'minor': 'degraded_performance',
      'none': 'operational'
    };
    return statusMap[impact] || 'operational';
  }

  calculateSystemMetrics(services) {
    const total = services.length;
    const operational = services.filter(s => s.status === 'operational').length;
    const degraded = services.filter(s => s.status === 'degraded_performance').length;
    const outage = services.filter(s => 
      ['partial_outage', 'major_outage'].includes(s.status)
    ).length;

    const avgUptime = services.reduce((sum, s) => sum + (s.uptime || 100), 0) / total;
    const avgResponseTime = services.reduce((sum, s) => sum + (s.responseTime || 0), 0) / total;

    return {
      totalServices: total,
      operational,
      degraded,
      outage,
      operationalPercentage: (operational / total * 100).toFixed(1),
      averageUptime: avgUptime.toFixed(2),
      averageResponseTime: Math.round(avgResponseTime)
    };
  }

  async updateUptimeHistory(service) {
    const history = service.uptimeHistory || [];
    const today = new Date().toISOString().split('T')[0];
    
    // Adicionar ou atualizar entrada de hoje
    const todayIndex = history.findIndex(h => h.date === today);
    const todayData = {
      date: today,
      uptime: service.status === 'operational' ? 100 : 0,
      incidents: 0,
      responseTime: service.responseTime || 0
    };

    if (todayIndex >= 0) {
      history[todayIndex] = todayData;
    } else {
      history.push(todayData);
    }

    // Manter apenas últimos 90 dias
    if (history.length > 90) {
      history.shift();
    }

    // Recalcular métricas
    const metrics = {
      last24h: this.calculatePeriodMetrics(history, 1),
      last7d: this.calculatePeriodMetrics(history, 7),
      last30d: this.calculatePeriodMetrics(history, 30),
      last90d: this.calculatePeriodMetrics(history, 90)
    };

    await service.update({
      uptimeHistory: history,
      metrics,
      uptime: metrics.last30d.uptime
    });
  }

  calculatePeriodMetrics(history, days) {
    const relevantHistory = history.slice(-days);
    
    if (relevantHistory.length === 0) {
      return { uptime: 100, incidents: 0, responseTime: 0 };
    }

    const uptime = relevantHistory.reduce((sum, h) => sum + h.uptime, 0) / relevantHistory.length;
    const incidents = relevantHistory.reduce((sum, h) => sum + h.incidents, 0);
    const responseTime = relevantHistory.reduce((sum, h) => sum + h.responseTime, 0) / relevantHistory.length;

    return {
      uptime: uptime.toFixed(2),
      incidents,
      responseTime: Math.round(responseTime)
    };
  }

  async createAutomaticIncident(service) {
    const incident = await Incident.create({
      title: `${service.displayName} - Outage Detected`,
      description: `Automated incident created due to health check failure for ${service.displayName}`,
      status: 'investigating',
      impact: 'major',
      affectedServices: [service.id],
      organizationId: service.organizationId,
      updates: [{
        status: 'investigating',
        message: 'Automated detection: Service health check failed',
        timestamp: new Date(),
        userId: null
      }]
    });

    await this.notifySubscribers('incident_created', incident);
  }

  async autoResolveIncidents(serviceId) {
    const incidents = await Incident.findAll({
      where: {
        affectedServices: {
          [Op.contains]: [serviceId]
        },
        status: {
          [Op.notIn]: ['resolved', 'postmortem']
        }
      }
    });

    for (const incident of incidents) {
      await incident.update({
        status: 'resolved',
        resolvedAt: new Date(),
        updates: [
          ...incident.updates,
          {
            status: 'resolved',
            message: 'Automated resolution: Service health check passed',
            timestamp: new Date(),
            userId: null
          }
        ]
      });

      await this.notifySubscribers('incident_resolved', incident);
    }
  }

  async notifySubscribers(eventType, data) {
    try {
      const subscriptions = await StatusSubscription.findAll({
        where: {
          organizationId: data.organizationId,
          isActive: true
        }
      });

      for (const subscription of subscriptions) {
        // Verificar se o tipo de evento está nas preferências
        if (!this.shouldNotify(subscription, eventType, data)) {
          continue;
        }

        // Enviar notificação baseada na frequência
        if (subscription.frequency === 'immediate') {
          await this.sendNotificationEmail(subscription, eventType, data);
        } else {
          // Adicionar à fila de notificações agrupadas
          await this.queueNotification(subscription, eventType, data);
        }
      }
    } catch (error) {
      logger.error('Erro ao notificar inscritos:', error);
    }
  }

  shouldNotify(subscription, eventType, data) {
    // Verificar tipo de inscrição
    if (subscription.type === 'incidents' && !eventType.startsWith('incident')) {
      return false;
    }
    if (subscription.type === 'maintenances' && !eventType.startsWith('maintenance')) {
      return false;
    }
    
    // Verificar serviços específicos
    if (subscription.type === 'specific_services' && data.affectedServices) {
      const hasMatch = data.affectedServices.some(serviceId => 
        subscription.services.includes(serviceId)
      );
      if (!hasMatch) return false;
    }

    // Verificar preferências
    const prefs = subscription.preferences || {};
    if (eventType === 'incident_created' && !prefs.incidents) return false;
    if (eventType === 'maintenance_scheduled' && !prefs.maintenances) return false;
    if (eventType.includes('updated') && !prefs.updates) return false;
    if (eventType.includes('resolved') && !prefs.resolutions) return false;

    return true;
  }

  async sendNotificationEmail(subscription, eventType, data) {
    // Implementar envio de e-mail usando emailProcessor
    const templates = {
      'incident_created': {
        subject: `[Incidente] ${data.title}`,
        template: 'incident_created'
      },
      'incident_updated': {
        subject: `[Atualização] ${data.title}`,
        template: 'incident_updated'
      },
      'incident_resolved': {
        subject: `[Resolvido] ${data.title}`,
        template: 'incident_resolved'
      },
      'maintenance_scheduled': {
        subject: `[Manutenção Programada] ${data.title}`,
        template: 'maintenance_scheduled'
      }
    };

    const emailConfig = templates[eventType];
    if (!emailConfig) return;

    // TODO: Implementar envio usando emailProcessor
    logger.info(`Notificação enviada para ${subscription.email}: ${eventType}`);
    
    await subscription.update({
      lastNotificationAt: new Date(),
      notificationCount: subscription.notificationCount + 1
    });
  }

  async sendSubscriptionConfirmation(subscription) {
    // TODO: Implementar envio de e-mail de confirmação
    logger.info(`Confirmação de inscrição enviada para ${subscription.email}`);
  }

  async scheduleMaintenanceNotifications(maintenance) {
    // TODO: Implementar agendamento de notificações (24h antes, 1h antes, início, fim)
    logger.info(`Notificações agendadas para manutenção ${maintenance.id}`);
  }

  async queueNotification(subscription, eventType, data) {
    // TODO: Implementar fila de notificações para envio agrupado
    logger.info(`Notificação adicionada à fila para ${subscription.email}`);
  }

  async handleServiceStatusChange(service, newStatus) {
    if (newStatus !== 'operational' && service.status === 'operational') {
      // Criar incidente automático se o serviço caiu
      await this.createAutomaticIncident(service);
    } else if (newStatus === 'operational' && service.status !== 'operational') {
      // Resolver incidentes se o serviço voltou
      await this.autoResolveIncidents(service.id);
    }
  }
}

export default new StatusPageController();
