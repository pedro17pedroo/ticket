import securityService from '../../services/securityService.js';
import logger from '../../config/logger.js';

class SecurityController {
  async getAuditLogs(req, res) {
    try {
      const { organizationId } = req.user;
      const filters = req.query;

      const result = await securityService.getAuditLogs(organizationId, filters);

      res.json(result);
    } catch (error) {
      logger.error('Erro ao buscar audit logs:', error);
      res.status(500).json({ error: 'Erro ao buscar logs' });
    }
  }

  async exportAuditLogs(req, res) {
    try {
      const { organizationId } = req.user;
      const { startDate, endDate, format = 'json' } = req.query;

      const logs = await securityService.exportAuditLogsForCompliance(
        organizationId,
        new Date(startDate),
        new Date(endDate),
        format
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        return res.send(logs);
      }

      res.json(logs);
    } catch (error) {
      logger.error('Erro ao exportar logs:', error);
      res.status(500).json({ error: 'Erro ao exportar logs' });
    }
  }

  async getSecurityAnalytics(req, res) {
    try {
      const { organizationId } = req.user;
      const { startDate, endDate } = req.query;

      const analytics = await securityService.getSecurityAnalytics(
        organizationId,
        new Date(startDate),
        new Date(endDate)
      );

      res.json(analytics);
    } catch (error) {
      logger.error('Erro ao buscar analytics:', error);
      res.status(500).json({ error: 'Erro ao buscar analytics' });
    }
  }

  async getWhitelist(req, res) {
    try {
      const { organizationId } = req.user;

      const whitelist = await IPWhitelist.findAll({
        where: { organizationId, isActive: true }
      });

      res.json(whitelist);
    } catch (error) {
      logger.error('Erro ao buscar whitelist:', error);
      res.status(500).json({ error: 'Erro ao buscar whitelist' });
    }
  }

  async addToWhitelist(req, res) {
    try {
      const { organizationId, id: userId } = req.user;
      const { ipAddress, description, expiresAt } = req.body;

      const whitelist = await securityService.addToWhitelist(ipAddress, organizationId, {
        description,
        expiresAt,
        createdById: userId
      });

      res.status(201).json(whitelist);
    } catch (error) {
      logger.error('Erro ao adicionar IP:', error);
      res.status(500).json({ error: 'Erro ao adicionar IP' });
    }
  }

  async removeFromWhitelist(req, res) {
    try {
      const { id } = req.params;
      const { organizationId, id: userId } = req.user;

      await securityService.removeFromWhitelist(parseInt(id), organizationId, userId);

      res.json({ message: 'IP removido da whitelist' });
    } catch (error) {
      logger.error('Erro ao remover IP:', error);
      res.status(500).json({ error: 'Erro ao remover IP' });
    }
  }
}

export default new SecurityController();
