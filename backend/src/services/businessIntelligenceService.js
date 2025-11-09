import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Ticket, User, Department, Category, Comment, SLA } from '../modules/models/index.js';
import KPI from '../models/KPI.js';
import logger from '../config/logger.js';

class BusinessIntelligenceService {
  constructor() {
    this.metricCalculators = {
      'tickets_created': this.calculateTicketsCreated.bind(this),
      'tickets_resolved': this.calculateTicketsResolved.bind(this),
      'avg_resolution_time': this.calculateAvgResolutionTime.bind(this),
      'avg_response_time': this.calculateAvgResponseTime.bind(this),
      'sla_compliance': this.calculateSLACompliance.bind(this),
      'satisfaction_score': this.calculateSatisfactionScore.bind(this),
      'agent_productivity': this.calculateAgentProductivity.bind(this),
      'backlog_size': this.calculateBacklogSize.bind(this),
      'tickets_by_priority': this.calculateTicketsByPriority.bind(this),
      'tickets_by_category': this.calculateTicketsByCategory.bind(this),
      'first_contact_resolution': this.calculateFCR.bind(this),
      'reopened_tickets_rate': this.calculateReopenedRate.bind(this)
    };
  }

  // ===== CORE METRICS =====

  async calculateTicketsCreated(organizationId, startDate, endDate) {
    const count = await Ticket.count({
      where: {
        organizationId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    return { value: count, unit: 'tickets' };
  }

  async calculateTicketsResolved(organizationId, startDate, endDate) {
    const count = await Ticket.count({
      where: {
        organizationId,
        status: 'resolvido',
        resolvedAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    return { value: count, unit: 'tickets' };
  }

  async calculateAvgResolutionTime(organizationId, startDate, endDate) {
    const result = await Ticket.findOne({
      where: {
        organizationId,
        status: 'resolvido',
        resolvedAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [fn('AVG', 
          literal('EXTRACT(EPOCH FROM (resolved_at - created_at))')
        ), 'avgTime']
      ],
      raw: true
    });

    const hours = result?.avgTime ? (result.avgTime / 3600).toFixed(2) : 0;
    return { value: hours, unit: 'hours' };
  }

  async calculateAvgResponseTime(organizationId, startDate, endDate) {
    const result = await Ticket.findOne({
      where: {
        organizationId,
        firstResponseAt: {
          [Op.not]: null,
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [fn('AVG', 
          literal('EXTRACT(EPOCH FROM (first_response_at - created_at))')
        ), 'avgTime']
      ],
      raw: true
    });

    const hours = result?.avgTime ? (result.avgTime / 3600).toFixed(2) : 0;
    return { value: hours, unit: 'hours' };
  }

  async calculateSLACompliance(organizationId, startDate, endDate) {
    const total = await Ticket.count({
      where: {
        organizationId,
        slaId: { [Op.not]: null },
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const compliant = await Ticket.count({
      where: {
        organizationId,
        slaId: { [Op.not]: null },
        slaResolutionStatus: 'compliant',
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const percentage = total > 0 ? ((compliant / total) * 100).toFixed(2) : 0;
    return { value: percentage, unit: '%' };
  }

  async calculateSatisfactionScore(organizationId, startDate, endDate) {
    const result = await Ticket.findOne({
      where: {
        organizationId,
        satisfactionRating: { [Op.not]: null },
        resolvedAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [fn('AVG', col('satisfaction_rating')), 'avgRating']
      ],
      raw: true
    });

    const score = result?.avgRating ? parseFloat(result.avgRating).toFixed(2) : 0;
    return { value: score, unit: '/5' };
  }

  async calculateAgentProductivity(organizationId, startDate, endDate) {
    const agents = await User.findAll({
      where: {
        organizationId,
        role: ['agente', 'tecnico']
      },
      attributes: ['id'],
      raw: true
    });

    const ticketsResolved = await Ticket.count({
      where: {
        organizationId,
        assigneeId: { [Op.in]: agents.map(a => a.id) },
        status: 'resolvido',
        resolvedAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const avgPerAgent = agents.length > 0 ? 
      (ticketsResolved / agents.length).toFixed(2) : 0;

    return { value: avgPerAgent, unit: 'tickets/agent' };
  }

  async calculateBacklogSize(organizationId) {
    const count = await Ticket.count({
      where: {
        organizationId,
        status: { [Op.notIn]: ['fechado', 'resolvido'] }
      }
    });

    return { value: count, unit: 'tickets' };
  }

  async calculateTicketsByPriority(organizationId, startDate, endDate) {
    const results = await Ticket.findAll({
      where: {
        organizationId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'priority',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    return { value: results, unit: 'distribution' };
  }

  async calculateTicketsByCategory(organizationId, startDate, endDate) {
    const results = await Ticket.findAll({
      where: {
        organizationId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name']
      }],
      attributes: [
        'categoryId',
        [fn('COUNT', col('Ticket.id')), 'count']
      ],
      group: ['categoryId', 'category.id', 'category.name'],
      raw: true
    });

    return { value: results, unit: 'distribution' };
  }

  async calculateFCR(organizationId, startDate, endDate) {
    const total = await Ticket.count({
      where: {
        organizationId,
        status: 'resolvido',
        resolvedAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const fcr = await Ticket.count({
      where: {
        organizationId,
        status: 'resolvido',
        resolvedAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Comment,
        as: 'comments',
        required: false
      }],
      having: literal('COUNT("comments"."id") <= 1')
    });

    const percentage = total > 0 ? ((fcr / total) * 100).toFixed(2) : 0;
    return { value: percentage, unit: '%' };
  }

  async calculateReopenedRate(organizationId, startDate, endDate) {
    const resolved = await Ticket.count({
      where: {
        organizationId,
        status: 'resolvido',
        resolvedAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const reopened = await Ticket.count({
      where: {
        organizationId,
        reopenedAt: {
          [Op.not]: null,
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const percentage = resolved > 0 ? ((reopened / resolved) * 100).toFixed(2) : 0;
    return { value: percentage, unit: '%' };
  }

  // ===== TIME SERIES DATA =====

  async getTimeSeriesData(organizationId, metric, period = 'daily', days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate);
      
      switch (period) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
      }

      if (this.metricCalculators[metric]) {
        const result = await this.metricCalculators[metric](
          organizationId,
          currentDate,
          nextDate
        );

        data.push({
          date: currentDate.toISOString().split('T')[0],
          value: result.value,
          unit: result.unit
        });
      }

      currentDate = nextDate;
    }

    return data;
  }

  // ===== FORECASTING =====

  async forecastMetric(organizationId, metric, periods = 7) {
    // Obter dados históricos (30 dias)
    const historicalData = await this.getTimeSeriesData(
      organizationId,
      metric,
      'daily',
      30
    );

    // Regressão linear simples
    const forecast = this.linearRegression(historicalData, periods);

    return forecast;
  }

  linearRegression(data, periods) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = parseFloat(point.value) || 0;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecast = [];
    for (let i = 0; i < periods; i++) {
      const x = n + i;
      const predictedValue = slope * x + intercept;
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);

      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, predictedValue.toFixed(2)),
        type: 'forecast'
      });
    }

    return forecast;
  }

  // ===== AGGREGATIONS =====

  async getAggregatedMetrics(organizationId, startDate, endDate) {
    const metrics = {};

    for (const [name, calculator] of Object.entries(this.metricCalculators)) {
      try {
        metrics[name] = await calculator(organizationId, startDate, endDate);
      } catch (error) {
        logger.error(`Erro ao calcular métrica ${name}:`, error);
        metrics[name] = { value: 0, unit: 'error' };
      }
    }

    return metrics;
  }

  // ===== COMPARATIVE ANALYSIS =====

  async comparePeriodsData(organizationId, metric, currentStart, currentEnd, previousStart, previousEnd) {
    const calculator = this.metricCalculators[metric];
    
    if (!calculator) {
      throw new Error(`Métrica desconhecida: ${metric}`);
    }

    const currentPeriod = await calculator(organizationId, currentStart, currentEnd);
    const previousPeriod = await calculator(organizationId, previousStart, previousEnd);

    const change = currentPeriod.value - previousPeriod.value;
    const changePercent = previousPeriod.value > 0 
      ? ((change / previousPeriod.value) * 100).toFixed(2)
      : 0;

    return {
      current: currentPeriod,
      previous: previousPeriod,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }

  // ===== KPI AUTO-CALCULATION =====

  async calculateAllKPIs(organizationId) {
    const kpis = await KPI.findAll({
      where: {
        organizationId,
        autoCalculate: true
      }
    });

    const results = [];

    for (const kpi of kpis) {
      try {
        const calculator = this.metricCalculators[kpi.metric];
        
        if (calculator) {
          const { startDate, endDate } = this.getPeriodDates(kpi.period);
          const result = await calculator(organizationId, startDate, endDate);

          // Determinar status baseado nos thresholds
          const status = this.determineKPIStatus(result.value, kpi.threshold);
          const trend = this.determineTrend(result.value, kpi.currentValue);

          // Atualizar histórico
          const history = kpi.history || [];
          history.push({
            date: new Date(),
            value: result.value
          });

          // Manter apenas últimos 12 registros
          if (history.length > 12) {
            history.shift();
          }

          await kpi.update({
            previousValue: kpi.currentValue,
            currentValue: result.value,
            status,
            trend,
            history,
            lastCalculatedAt: new Date()
          });

          results.push({
            kpiId: kpi.id,
            name: kpi.name,
            value: result.value,
            status,
            trend
          });
        }
      } catch (error) {
        logger.error(`Erro ao calcular KPI ${kpi.id}:`, error);
      }
    }

    return results;
  }

  determineKPIStatus(value, threshold) {
    if (value >= threshold.excellent) return 'excellent';
    if (value >= threshold.good) return 'good';
    if (value >= threshold.acceptable) return 'acceptable';
    if (value >= threshold.poor) return 'poor';
    return 'critical';
  }

  determineTrend(currentValue, previousValue) {
    if (!previousValue) return 'stable';
    
    const diff = currentValue - previousValue;
    const changePercent = Math.abs((diff / previousValue) * 100);

    if (changePercent < 5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }

  getPeriodDates(period) {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  // ===== DATA EXPORT =====

  async exportData(organizationId, type, filters, format = 'json') {
    let data;

    switch (type) {
      case 'tickets':
        data = await this.exportTickets(organizationId, filters);
        break;
      case 'metrics':
        data = await this.exportMetrics(organizationId, filters);
        break;
      case 'kpis':
        data = await this.exportKPIs(organizationId);
        break;
      default:
        throw new Error(`Tipo de export desconhecido: ${type}`);
    }

    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'xlsx':
        return this.convertToXLSX(data);
      default:
        return data;
    }
  }

  async exportTickets(organizationId, filters) {
    const where = {
      organizationId,
      ...filters
    };

    return await Ticket.findAll({
      where,
      include: [
        { model: User, as: 'requester' },
        { model: User, as: 'assignee' },
        { model: Category, as: 'category' },
        { model: Department, as: 'department' }
      ]
    });
  }

  async exportMetrics(organizationId, filters) {
    const { startDate, endDate } = filters;
    return await this.getAggregatedMetrics(organizationId, startDate, endDate);
  }

  async exportKPIs(organizationId) {
    return await KPI.findAll({
      where: { organizationId }
    });
  }

  convertToCSV(data) {
    // Implementação simples de CSV
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  convertToXLSX(data) {
    // Retornar dados formatados para biblioteca XLSX no frontend
    return {
      type: 'xlsx',
      data,
      headers: data.length > 0 ? Object.keys(data[0]) : []
    };
  }
}

export default new BusinessIntelligenceService();
