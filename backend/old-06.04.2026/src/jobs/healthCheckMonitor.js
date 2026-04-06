import cron from 'node-cron';
import { Op } from 'sequelize';
import Service from '../models/Service.js';
import statusPageController from '../modules/statusPage/statusPageController.js';
import logger from '../config/logger.js';

class HealthCheckMonitor {
  constructor() {
    this.job = null;
    this.runningChecks = new Set();
  }

  async start() {
    try {
      // Executar health checks a cada minuto
      this.job = cron.schedule('* * * * *', async () => {
        await this.performHealthChecks();
      });

      logger.info('🏥 Monitor de Health Check iniciado (executa a cada minuto)');
      
      // Executar verificação inicial
      await this.performHealthChecks();
    } catch (error) {
      logger.error('Erro ao iniciar monitor de health check:', error);
    }
  }

  async stop() {
    if (this.job) {
      this.job.stop();
      logger.info('🏥 Monitor de Health Check parado');
    }
  }

  async performHealthChecks() {
    try {
      // Buscar serviços que precisam de health check
      const services = await Service.findAll({
        where: {
          monitoringEnabled: true,
          healthCheckUrl: {
            [Op.ne]: null
          },
          [Op.or]: [
            { lastHealthCheck: null },
            {
              lastHealthCheck: {
                [Op.lt]: new Date(Date.now() - 60 * 1000) // Mais de 1 minuto atrás
              }
            }
          ]
        }
      });

      logger.debug(`🔍 Verificando health de ${services.length} serviços`);

      // Executar health checks em paralelo (máximo 10 por vez)
      const chunks = this.chunkArray(services, 10);
      
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(service => this.checkServiceHealth(service))
        );
      }
    } catch (error) {
      logger.error('Erro ao executar health checks:', error);
    }
  }

  async checkServiceHealth(service) {
    // Evitar checks duplicados
    if (this.runningChecks.has(service.id)) {
      return;
    }

    this.runningChecks.add(service.id);

    try {
      await statusPageController.performHealthCheck(service.id);
    } catch (error) {
      logger.error(`Erro no health check do serviço ${service.name}:`, error);
    } finally {
      this.runningChecks.delete(service.id);
    }
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getStatistics() {
    const stats = await Service.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'operational' THEN 1 ELSE 0 END")), 'operational'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'degraded_performance' THEN 1 ELSE 0 END")), 'degraded'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status IN ('partial_outage', 'major_outage') THEN 1 ELSE 0 END")), 'outage'],
        [sequelize.fn('AVG', sequelize.col('uptime')), 'avgUptime'],
        [sequelize.fn('AVG', sequelize.col('response_time')), 'avgResponseTime']
      ],
      where: {
        monitoringEnabled: true
      }
    });

    return stats[0];
  }
}

export default new HealthCheckMonitor();
