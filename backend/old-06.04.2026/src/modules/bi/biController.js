import { Op } from 'sequelize';
import Dashboard from '../../models/Dashboard.js';
import Report from '../../models/Report.js';
import KPI from '../../models/KPI.js';
import biService from '../../services/businessIntelligenceService.js';
import logger from '../../config/logger.js';

class BIController {
  // ===== DASHBOARDS =====

  async getDashboards(req, res) {
    try {
      const { organizationId, id: userId } = req.user;
      const { isPublic, tags } = req.query;

      const where = {
        organizationId,
        ...(isPublic !== undefined && { isPublic })
      };

      if (tags) {
        where.tags = { [Op.contains]: tags.split(',') };
      }

      const dashboards = await Dashboard.findAll({
        where,
        order: [
          ['isDefault', 'DESC'],
          ['favoriteCount', 'DESC'],
          ['name', 'ASC']
        ]
      });

      res.json(dashboards);
    } catch (error) {
      logger.error('Erro ao buscar dashboards:', error);
      res.status(500).json({ error: 'Erro ao buscar dashboards' });
    }
  }

  async getDashboardById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const dashboard = await Dashboard.findOne({
        where: { id, organizationId }
      });

      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard não encontrado' });
      }

      // Incrementar contador de visualizações
      await dashboard.increment('viewCount');

      res.json(dashboard);
    } catch (error) {
      logger.error('Erro ao buscar dashboard:', error);
      res.status(500).json({ error: 'Erro ao buscar dashboard' });
    }
  }

  async createDashboard(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;

      const dashboard = await Dashboard.create({
        ...req.body,
        organizationId,
        createdById
      });

      res.status(201).json(dashboard);
    } catch (error) {
      logger.error('Erro ao criar dashboard:', error);
      res.status(500).json({ error: 'Erro ao criar dashboard' });
    }
  }

  async updateDashboard(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const dashboard = await Dashboard.findOne({
        where: { id, organizationId }
      });

      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard não encontrado' });
      }

      await dashboard.update(req.body);

      res.json(dashboard);
    } catch (error) {
      logger.error('Erro ao atualizar dashboard:', error);
      res.status(500).json({ error: 'Erro ao atualizar dashboard' });
    }
  }

  async deleteDashboard(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const dashboard = await Dashboard.findOne({
        where: { id, organizationId }
      });

      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard não encontrado' });
      }

      await dashboard.destroy();

      res.json({ message: 'Dashboard removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover dashboard:', error);
      res.status(500).json({ error: 'Erro ao remover dashboard' });
    }
  }

  async duplicateDashboard(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const { organizationId, id: createdById } = req.user;

      const original = await Dashboard.findOne({
        where: { id, organizationId }
      });

      if (!original) {
        return res.status(404).json({ error: 'Dashboard não encontrado' });
      }

      const duplicate = await Dashboard.create({
        name: name || `${original.name} (Cópia)`,
        description: original.description,
        layout: original.layout,
        widgets: original.widgets,
        filters: original.filters,
        refreshInterval: original.refreshInterval,
        organizationId,
        createdById
      });

      res.status(201).json(duplicate);
    } catch (error) {
      logger.error('Erro ao duplicar dashboard:', error);
      res.status(500).json({ error: 'Erro ao duplicar dashboard' });
    }
  }

  // ===== REPORTS =====

  async getReports(req, res) {
    try {
      const { organizationId } = req.user;
      const { type, tags } = req.query;

      const where = {
        organizationId,
        ...(type && { type })
      };

      if (tags) {
        where.tags = { [Op.contains]: tags.split(',') };
      }

      const reports = await Report.findAll({
        where,
        order: [
          ['isFavorite', 'DESC'],
          ['executionCount', 'DESC'],
          ['name', 'ASC']
        ]
      });

      res.json(reports);
    } catch (error) {
      logger.error('Erro ao buscar relatórios:', error);
      res.status(500).json({ error: 'Erro ao buscar relatórios' });
    }
  }

  async createReport(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;

      const report = await Report.create({
        ...req.body,
        organizationId,
        createdById
      });

      res.status(201).json(report);
    } catch (error) {
      logger.error('Erro ao criar relatório:', error);
      res.status(500).json({ error: 'Erro ao criar relatório' });
    }
  }

  async executeReport(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const report = await Report.findOne({
        where: { id, organizationId }
      });

      if (!report) {
        return res.status(404).json({ error: 'Relatório não encontrado' });
      }

      const startTime = Date.now();

      // Executar query do relatório
      const data = await biService.exportData(
        organizationId,
        report.type,
        report.filters
      );

      const executionTime = Date.now() - startTime;

      // Atualizar estatísticas
      await report.update({
        executionCount: report.executionCount + 1,
        lastExecutedAt: new Date(),
        lastExecutionTime: executionTime
      });

      res.json({
        report: {
          id: report.id,
          name: report.name,
          type: report.type
        },
        data,
        executionTime,
        recordCount: Array.isArray(data) ? data.length : 0
      });
    } catch (error) {
      logger.error('Erro ao executar relatório:', error);
      res.status(500).json({ error: 'Erro ao executar relatório' });
    }
  }

  async exportReport(req, res) {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.query;
      const { organizationId } = req.user;

      const report = await Report.findOne({
        where: { id, organizationId }
      });

      if (!report) {
        return res.status(404).json({ error: 'Relatório não encontrado' });
      }

      const data = await biService.exportData(
        organizationId,
        report.type,
        report.filters,
        format
      );

      // Atualizar contador
      await report.increment('executionCount');

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report.name}.csv"`);
        return res.send(data);
      }

      res.json(data);
    } catch (error) {
      logger.error('Erro ao exportar relatório:', error);
      res.status(500).json({ error: 'Erro ao exportar relatório' });
    }
  }

  // ===== KPIs =====

  async getKPIs(req, res) {
    try {
      const { organizationId } = req.user;
      const { category, status } = req.query;

      const where = {
        organizationId,
        ...(category && { category }),
        ...(status && { status })
      };

      const kpis = await KPI.findAll({
        where,
        order: [['name', 'ASC']]
      });

      res.json(kpis);
    } catch (error) {
      logger.error('Erro ao buscar KPIs:', error);
      res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
  }

  async createKPI(req, res) {
    try {
      const { organizationId, id: createdById } = req.user;

      const kpi = await KPI.create({
        ...req.body,
        organizationId,
        createdById
      });

      res.status(201).json(kpi);
    } catch (error) {
      logger.error('Erro ao criar KPI:', error);
      res.status(500).json({ error: 'Erro ao criar KPI' });
    }
  }

  async calculateKPI(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const kpi = await KPI.findOne({
        where: { id, organizationId }
      });

      if (!kpi) {
        return res.status(404).json({ error: 'KPI não encontrado' });
      }

      const calculator = biService.metricCalculators[kpi.metric];
      
      if (!calculator) {
        return res.status(400).json({ error: 'Métrica não suportada' });
      }

      const { startDate, endDate } = biService.getPeriodDates(kpi.period);
      const result = await calculator(organizationId, startDate, endDate);

      const status = biService.determineKPIStatus(result.value, kpi.threshold);
      const trend = biService.determineTrend(result.value, kpi.currentValue);

      await kpi.update({
        previousValue: kpi.currentValue,
        currentValue: result.value,
        status,
        trend,
        lastCalculatedAt: new Date()
      });

      res.json({
        kpi: kpi.name,
        value: result.value,
        unit: result.unit,
        status,
        trend,
        target: kpi.target
      });
    } catch (error) {
      logger.error('Erro ao calcular KPI:', error);
      res.status(500).json({ error: 'Erro ao calcular KPI' });
    }
  }

  async calculateAllKPIs(req, res) {
    try {
      const { organizationId } = req.user;

      const results = await biService.calculateAllKPIs(organizationId);

      res.json({
        message: 'KPIs calculados com sucesso',
        count: results.length,
        results
      });
    } catch (error) {
      logger.error('Erro ao calcular todos os KPIs:', error);
      res.status(500).json({ error: 'Erro ao calcular KPIs' });
    }
  }

  // ===== METRICS =====

  async getMetrics(req, res) {
    try {
      const { organizationId } = req.user;
      const { 
        metric, 
        startDate, 
        endDate,
        period = 'daily',
        days = 30
      } = req.query;

      if (metric && !startDate) {
        // Time series data
        const data = await biService.getTimeSeriesData(
          organizationId,
          metric,
          period,
          parseInt(days)
        );
        return res.json(data);
      }

      if (metric && startDate && endDate) {
        // Single metric calculation
        const calculator = biService.metricCalculators[metric];
        if (!calculator) {
          return res.status(400).json({ error: 'Métrica desconhecida' });
        }

        const result = await calculator(
          organizationId,
          new Date(startDate),
          new Date(endDate)
        );

        return res.json(result);
      }

      // All aggregated metrics
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const metrics = await biService.getAggregatedMetrics(organizationId, start, end);

      res.json(metrics);
    } catch (error) {
      logger.error('Erro ao buscar métricas:', error);
      res.status(500).json({ error: 'Erro ao buscar métricas' });
    }
  }

  async getForecast(req, res) {
    try {
      const { organizationId } = req.user;
      const { metric, periods = 7 } = req.query;

      if (!metric) {
        return res.status(400).json({ error: 'Métrica não especificada' });
      }

      const forecast = await biService.forecastMetric(
        organizationId,
        metric,
        parseInt(periods)
      );

      res.json(forecast);
    } catch (error) {
      logger.error('Erro ao gerar previsão:', error);
      res.status(500).json({ error: 'Erro ao gerar previsão' });
    }
  }

  async comparePeriodsMetrics(req, res) {
    try {
      const { organizationId } = req.user;
      const { 
        metric,
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
      } = req.query;

      if (!metric || !currentStart || !currentEnd || !previousStart || !previousEnd) {
        return res.status(400).json({ error: 'Parâmetros incompletos' });
      }

      const comparison = await biService.comparePeriodsData(
        organizationId,
        metric,
        new Date(currentStart),
        new Date(currentEnd),
        new Date(previousStart),
        new Date(previousEnd)
      );

      res.json(comparison);
    } catch (error) {
      logger.error('Erro ao comparar períodos:', error);
      res.status(500).json({ error: 'Erro ao comparar períodos' });
    }
  }

  // ===== DATA EXPORT =====

  async exportData(req, res) {
    try {
      const { organizationId } = req.user;
      const { type, format = 'json', startDate, endDate } = req.query;

      if (!type) {
        return res.status(400).json({ error: 'Tipo de export não especificado' });
      }

      const filters = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const data = await biService.exportData(organizationId, type, filters, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export_${type}.csv"`);
        return res.send(data);
      }

      res.json(data);
    } catch (error) {
      logger.error('Erro ao exportar dados:', error);
      res.status(500).json({ error: 'Erro ao exportar dados' });
    }
  }

  // ===== ANALYTICS =====

  async getAnalytics(req, res) {
    try {
      const { organizationId } = req.user;
      const { period = 'monthly' } = req.query;

      const { startDate, endDate } = biService.getPeriodDates(period);

      const [
        metrics,
        kpis,
        trends
      ] = await Promise.all([
        biService.getAggregatedMetrics(organizationId, startDate, endDate),
        KPI.findAll({ 
          where: { organizationId },
          order: [['status', 'ASC']]
        }),
        biService.getTimeSeriesData(organizationId, 'tickets_created', 'daily', 30)
      ]);

      res.json({
        period,
        dateRange: { startDate, endDate },
        metrics,
        kpis,
        trends
      });
    } catch (error) {
      logger.error('Erro ao buscar analytics:', error);
      res.status(500).json({ error: 'Erro ao buscar analytics' });
    }
  }
}

export default new BIController();
