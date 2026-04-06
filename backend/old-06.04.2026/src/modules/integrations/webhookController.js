import webhookService from '../../services/webhookService.js';
import Webhook from '../../models/Webhook.js';
import logger from '../../config/logger.js';

class WebhookController {
  // ===== WEBHOOK CRUD =====

  async getAll(req, res) {
    try {
      const { organizationId } = req.user;

      const webhooks = await Webhook.findAll({
        where: { organizationId },
        order: [['created_at', 'DESC']]
      });

      res.json(webhooks);
    } catch (error) {
      logger.error('Erro ao buscar webhooks:', error);
      res.status(500).json({ error: 'Erro ao buscar webhooks' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const webhook = await Webhook.findOne({
        where: { id, organizationId }
      });

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook não encontrado' });
      }

      res.json(webhook);
    } catch (error) {
      logger.error('Erro ao buscar webhook:', error);
      res.status(500).json({ error: 'Erro ao buscar webhook' });
    }
  }

  async create(req, res) {
    try {
      const { organizationId, id: userId } = req.user;

      const webhook = await webhookService.createWebhook(
        req.body,
        organizationId,
        userId
      );

      res.status(201).json(webhook);
    } catch (error) {
      logger.error('Erro ao criar webhook:', error);
      res.status(500).json({ error: 'Erro ao criar webhook' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const webhook = await webhookService.updateWebhook(
        id,
        req.body,
        organizationId
      );

      res.json(webhook);
    } catch (error) {
      logger.error('Erro ao atualizar webhook:', error);
      res.status(500).json({ error: 'Erro ao atualizar webhook' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      await webhookService.deleteWebhook(id, organizationId);

      res.json({ message: 'Webhook desativado com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar webhook:', error);
      res.status(500).json({ error: 'Erro ao deletar webhook' });
    }
  }

  // ===== TESTE =====

  async test(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const result = await webhookService.testWebhook(id, organizationId);

      res.json(result);
    } catch (error) {
      logger.error('Erro ao testar webhook:', error);
      res.status(500).json({ error: 'Erro ao testar webhook' });
    }
  }

  // ===== LOGS =====

  async getLogs(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;
      const { limit, offset, status } = req.query;

      const result = await webhookService.getWebhookLogs(
        id,
        organizationId,
        { limit: parseInt(limit), offset: parseInt(offset), status }
      );

      res.json(result);
    } catch (error) {
      logger.error('Erro ao buscar logs:', error);
      res.status(500).json({ error: 'Erro ao buscar logs' });
    }
  }

  async getStats(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const stats = await webhookService.getWebhookStats(id, organizationId);

      res.json(stats);
    } catch (error) {
      logger.error('Erro ao buscar stats:', error);
      res.status(500).json({ error: 'Erro ao buscar stats' });
    }
  }

  // ===== EVENTS =====

  async getAvailableEvents(req, res) {
    try {
      const events = webhookService.getAvailableEvents();
      res.json(events);
    } catch (error) {
      logger.error('Erro ao buscar eventos:', error);
      res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
  }
}

export default new WebhookController();
