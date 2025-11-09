import axios from 'axios';
import crypto from 'crypto';
import Webhook from '../models/Webhook.js';
import WebhookLog from '../models/WebhookLog.js';
import logger from '../config/logger.js';

class WebhookService {
  constructor() {
    this.eventQueue = [];
    this.isProcessing = false;
  }

  // ===== TRIGGER WEBHOOKS =====

  async trigger(event, payload, organizationId) {
    try {
      const webhooks = await Webhook.findAll({
        where: {
          organizationId,
          isActive: true
        }
      });

      const relevantWebhooks = webhooks.filter(webhook => 
        webhook.events.includes(event) || webhook.events.includes('*')
      );

      if (relevantWebhooks.length === 0) {
        logger.debug(`Nenhum webhook configurado para evento: ${event}`);
        return;
      }

      // Processar webhooks em paralelo
      const promises = relevantWebhooks.map(webhook => 
        this.executeWebhook(webhook, event, payload)
      );

      await Promise.allSettled(promises);

    } catch (error) {
      logger.error('Erro ao disparar webhooks:', error);
    }
  }

  async executeWebhook(webhook, event, payload, retryCount = 0) {
    const startTime = Date.now();
    
    try {
      // Criar log
      const webhookLog = await WebhookLog.create({
        webhookId: webhook.id,
        event,
        payload,
        retryCount,
        status: 'pending',
        organizationId: webhook.organizationId
      });

      // Preparar requisição
      const requestPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload
      };

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'TatuTicket-Webhook/1.0',
        ...webhook.headers
      };

      // Assinar payload se houver secret
      if (webhook.secret) {
        const signature = this.signPayload(requestPayload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      // Fazer requisição
      const response = await axios.post(webhook.url, requestPayload, {
        headers,
        timeout: webhook.timeout || 30000,
        validateStatus: () => true // Aceitar qualquer status para logar
      });

      const duration = Date.now() - startTime;

      // Atualizar log
      await webhookLog.update({
        responseStatus: response.status,
        responseBody: JSON.stringify(response.data).substring(0, 5000),
        duration,
        status: response.status >= 200 && response.status < 300 ? 'success' : 'failed'
      });

      // Atualizar webhook
      await webhook.update({
        lastTriggeredAt: new Date()
      });

      if (response.status >= 200 && response.status < 300) {
        await webhook.increment('successCount');
        logger.info(`Webhook ${webhook.id} executado com sucesso para evento ${event}`);
      } else {
        await webhook.increment('failureCount');
        
        // Tentar retry se configurado
        if (webhook.retryEnabled && retryCount < webhook.maxRetries) {
          await this.scheduleRetry(webhook, event, payload, retryCount + 1, webhookLog.id);
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Erro ao executar webhook ${webhook.id}:`, error);

      // Atualizar log com erro
      const webhookLog = await WebhookLog.findOne({
        where: {
          webhookId: webhook.id,
          event,
          retryCount
        },
        order: [['created_at', 'DESC']]
      });

      if (webhookLog) {
        await webhookLog.update({
          errorMessage: error.message,
          duration,
          status: 'failed'
        });
      }

      await webhook.increment('failureCount');

      // Tentar retry se configurado
      if (webhook.retryEnabled && retryCount < webhook.maxRetries) {
        await this.scheduleRetry(webhook, event, payload, retryCount + 1, webhookLog?.id);
      }
    }
  }

  async scheduleRetry(webhook, event, payload, retryCount, logId) {
    // Backoff exponencial: 2^retryCount * 1000ms
    const delay = Math.pow(2, retryCount) * 1000;

    logger.info(`Agendando retry ${retryCount}/${webhook.maxRetries} para webhook ${webhook.id} em ${delay}ms`);

    if (logId) {
      await WebhookLog.update(
        { status: 'retrying' },
        { where: { id: logId } }
      );
    }

    setTimeout(() => {
      this.executeWebhook(webhook, event, payload, retryCount);
    }, delay);
  }

  signPayload(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  // ===== WEBHOOK MANAGEMENT =====

  async createWebhook(data, organizationId, userId) {
    try {
      const webhook = await Webhook.create({
        ...data,
        organizationId,
        createdById: userId
      });

      logger.info(`Webhook criado: ${webhook.id}`);
      return webhook;
    } catch (error) {
      logger.error('Erro ao criar webhook:', error);
      throw error;
    }
  }

  async updateWebhook(id, data, organizationId) {
    try {
      const webhook = await Webhook.findOne({
        where: { id, organizationId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      await webhook.update(data);
      return webhook;
    } catch (error) {
      logger.error('Erro ao atualizar webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(id, organizationId) {
    try {
      const webhook = await Webhook.findOne({
        where: { id, organizationId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      await webhook.update({ isActive: false });
      return webhook;
    } catch (error) {
      logger.error('Erro ao deletar webhook:', error);
      throw error;
    }
  }

  async testWebhook(id, organizationId) {
    try {
      const webhook = await Webhook.findOne({
        where: { id, organizationId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const testPayload = {
        test: true,
        message: 'This is a test webhook from TatuTicket',
        timestamp: new Date().toISOString()
      };

      await this.executeWebhook(webhook, 'webhook.test', testPayload);

      return { message: 'Webhook de teste enviado' };
    } catch (error) {
      logger.error('Erro ao testar webhook:', error);
      throw error;
    }
  }

  // ===== LOGS =====

  async getWebhookLogs(webhookId, organizationId, options = {}) {
    try {
      const { limit = 50, offset = 0, status } = options;

      const where = {
        webhookId,
        organizationId
      };

      if (status) {
        where.status = status;
      }

      const { rows: logs, count } = await WebhookLog.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        logs,
        total: count,
        hasMore: count > (offset + limit)
      };
    } catch (error) {
      logger.error('Erro ao buscar logs de webhook:', error);
      throw error;
    }
  }

  async getWebhookStats(webhookId, organizationId) {
    try {
      const webhook = await Webhook.findOne({
        where: { id: webhookId, organizationId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const totalExecutions = webhook.successCount + webhook.failureCount;
      const successRate = totalExecutions > 0 
        ? (webhook.successCount / totalExecutions * 100).toFixed(2)
        : 0;

      const recentLogs = await WebhookLog.findAll({
        where: { webhookId, organizationId },
        order: [['created_at', 'DESC']],
        limit: 10
      });

      const avgDuration = recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / recentLogs.length
        : 0;

      return {
        totalExecutions,
        successCount: webhook.successCount,
        failureCount: webhook.failureCount,
        successRate: parseFloat(successRate),
        avgDuration: Math.round(avgDuration),
        lastTriggeredAt: webhook.lastTriggeredAt,
        recentLogs: recentLogs.slice(0, 5)
      };
    } catch (error) {
      logger.error('Erro ao buscar stats de webhook:', error);
      throw error;
    }
  }

  // ===== EVENT HELPERS =====

  getAvailableEvents() {
    return [
      // Tickets
      'ticket.created',
      'ticket.updated',
      'ticket.assigned',
      'ticket.resolved',
      'ticket.closed',
      'ticket.reopened',
      
      // Comments
      'comment.created',
      'comment.updated',
      
      // Users
      'user.created',
      'user.updated',
      
      // SLA
      'sla.warning',
      'sla.violated',
      
      // Workflow
      'workflow.started',
      'workflow.completed',
      
      // Others
      'service.incident',
      'knowledge.published',
      
      // Wildcard
      '*'
    ];
  }
}

export default new WebhookService();
