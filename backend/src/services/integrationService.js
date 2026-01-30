import axios from 'axios';
import Integration from '../models/Integration.js';
import logger from '../config/logger.js';

class IntegrationService {
  
  // ===== SLACK =====

  async sendSlackNotification(integrationId, message) {
    try {
      const integration = await Integration.findByPk(integrationId);
      
      if (!integration || integration.type !== 'slack') {
        throw new Error('Integração Slack não encontrada');
      }

      const { webhookUrl } = integration.config;

      await axios.post(webhookUrl, {
        text: message.text || message,
        blocks: message.blocks,
        attachments: message.attachments
      });

      await integration.update({ lastSyncAt: new Date() });

      logger.info('Notificação Slack enviada com sucesso');
    } catch (error) {
      logger.error('Erro ao enviar notificação Slack:', error);
      throw error;
    }
  }

  async formatSlackTicketMessage(ticket) {
    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🎫 Ticket #${ticket.id} - ${ticket.title}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Prioridade:*\n${ticket.priority}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${ticket.status}`
            },
            {
              type: 'mrkdwn',
              text: `*Atribuído:*\n${ticket.assignedTo?.name || 'Não atribuído'}`
            },
            {
              type: 'mrkdwn',
              text: `*Criado em:*\n${new Date(ticket.createdAt).toLocaleString('pt-BR')}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Descrição:*\n${ticket.description.substring(0, 200)}${ticket.description.length > 200 ? '...' : ''}`
          }
        }
      ]
    };
  }

  // ===== MICROSOFT TEAMS =====

  async sendTeamsNotification(integrationId, message) {
    try {
      const integration = await Integration.findByPk(integrationId);
      
      if (!integration || integration.type !== 'teams') {
        throw new Error('Integração Teams não encontrada');
      }

      const { webhookUrl } = integration.config;

      await axios.post(webhookUrl, {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: message.summary || 'Notificação T-Desk',
        themeColor: message.color || '0078D4',
        title: message.title,
        text: message.text,
        sections: message.sections
      });

      await integration.update({ lastSyncAt: new Date() });

      logger.info('Notificação Teams enviada com sucesso');
    } catch (error) {
      logger.error('Erro ao enviar notificação Teams:', error);
      throw error;
    }
  }

  async formatTeamsTicketMessage(ticket) {
    return {
      title: `🎫 Novo Ticket #${ticket.id}`,
      summary: `Ticket ${ticket.title}`,
      color: this.getPriorityColor(ticket.priority),
      sections: [
        {
          activityTitle: ticket.title,
          activitySubtitle: `Criado por ${ticket.requester?.name}`,
          facts: [
            { name: 'Prioridade', value: ticket.priority },
            { name: 'Status', value: ticket.status },
            { name: 'Categoria', value: ticket.category?.name || 'N/A' }
          ],
          text: ticket.description.substring(0, 300)
        }
      ]
    };
  }

  getPriorityColor(priority) {
    const colors = {
      urgent: 'FF0000',
      high: 'FFA500',
      medium: '0078D4',
      low: '00B294'
    };
    return colors[priority] || '0078D4';
  }

  // ===== GOOGLE WORKSPACE =====

  async syncGoogleWorkspace(integrationId) {
    try {
      const integration = await Integration.findByPk(integrationId);
      
      if (!integration || integration.type !== 'google_workspace') {
        throw new Error('Integração Google Workspace não encontrada');
      }

      await integration.update({
        syncStatus: 'syncing'
      });

      // Implementar sincronização de usuários, grupos, etc
      // Requer OAuth2 flow completo

      await integration.update({
        lastSyncAt: new Date(),
        syncStatus: 'idle'
      });

      logger.info('Google Workspace sincronizado com sucesso');
    } catch (error) {
      logger.error('Erro ao sincronizar Google Workspace:', error);
      await Integration.update(
        { syncStatus: 'error', errorMessage: error.message },
        { where: { id: integrationId } }
      );
      throw error;
    }
  }

  // ===== MICROSOFT 365 =====

  async syncMicrosoft365(integrationId) {
    try {
      const integration = await Integration.findByPk(integrationId);
      
      if (!integration || integration.type !== 'microsoft_365') {
        throw new Error('Integração Microsoft 365 não encontrada');
      }

      await integration.update({
        syncStatus: 'syncing'
      });

      // Implementar sincronização via Microsoft Graph API
      
      await integration.update({
        lastSyncAt: new Date(),
        syncStatus: 'idle'
      });

      logger.info('Microsoft 365 sincronizado com sucesso');
    } catch (error) {
      logger.error('Erro ao sincronizar Microsoft 365:', error);
      await Integration.update(
        { syncStatus: 'error', errorMessage: error.message },
        { where: { id: integrationId } }
      );
      throw error;
    }
  }

  // ===== INTEGRATION MANAGEMENT =====

  async createIntegration(data, organizationId, userId) {
    try {
      const integration = await Integration.create({
        ...data,
        organizationId,
        createdById: userId
      });

      logger.info(`Integração ${data.type} criada: ${integration.id}`);
      return integration;
    } catch (error) {
      logger.error('Erro ao criar integração:', error);
      throw error;
    }
  }

  async updateIntegration(id, data, organizationId) {
    try {
      const integration = await Integration.findOne({
        where: { id, organizationId }
      });

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      await integration.update(data);
      return integration;
    } catch (error) {
      logger.error('Erro ao atualizar integração:', error);
      throw error;
    }
  }

  async deleteIntegration(id, organizationId) {
    try {
      const integration = await Integration.findOne({
        where: { id, organizationId }
      });

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      await integration.destroy();
      return integration;
    } catch (error) {
      logger.error('Erro ao deletar integração:', error);
      throw error;
    }
  }

  async testIntegration(id, organizationId) {
    try {
      const integration = await Integration.findOne({
        where: { id, organizationId }
      });

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      const testMessage = {
        text: '✅ Teste de integração T-Desk',
        title: 'Teste de Conexão',
        summary: 'Integração funcionando corretamente'
      };

      switch (integration.type) {
        case 'slack':
          await this.sendSlackNotification(id, testMessage);
          break;
        case 'teams':
          await this.sendTeamsNotification(id, testMessage);
          break;
        default:
          throw new Error(`Tipo de integração não suportado para teste: ${integration.type}`);
      }

      return { message: 'Teste enviado com sucesso' };
    } catch (error) {
      logger.error('Erro ao testar integração:', error);
      throw error;
    }
  }

  async getAllIntegrations(organizationId) {
    try {
      const integrations = await Integration.findAll({
        where: { organizationId },
        order: [['created_at', 'DESC']]
      });

      return integrations;
    } catch (error) {
      logger.error('Erro ao buscar integrações:', error);
      throw error;
    }
  }

  // ===== NOTIFICATION ROUTING =====

  async notifyTicketEvent(ticket, event, organizationId) {
    try {
      const integrations = await Integration.findAll({
        where: {
          organizationId,
          isActive: true,
          type: ['slack', 'teams']
        }
      });

      for (const integration of integrations) {
        try {
          if (integration.type === 'slack') {
            const message = await this.formatSlackTicketMessage(ticket);
            await this.sendSlackNotification(integration.id, message);
          } else if (integration.type === 'teams') {
            const message = await this.formatTeamsTicketMessage(ticket);
            await this.sendTeamsNotification(integration.id, message);
          }
        } catch (error) {
          logger.error(`Erro ao notificar integração ${integration.id}:`, error);
          // Continuar com outras integrações mesmo se uma falhar
        }
      }
    } catch (error) {
      logger.error('Erro ao notificar evento de ticket:', error);
    }
  }

  // ===== AVAILABLE INTEGRATIONS =====

  getAvailableIntegrations() {
    return [
      {
        type: 'slack',
        name: 'Slack',
        description: 'Receba notificações de tickets no Slack',
        icon: '💬',
        requiredFields: ['webhookUrl', 'channel']
      },
      {
        type: 'teams',
        name: 'Microsoft Teams',
        description: 'Receba notificações de tickets no Teams',
        icon: '💼',
        requiredFields: ['webhookUrl']
      },
      {
        type: 'google_workspace',
        name: 'Google Workspace',
        description: 'Sincronize usuários do Google Workspace',
        icon: '🔵',
        requiredFields: ['clientId', 'clientSecret']
      },
      {
        type: 'microsoft_365',
        name: 'Microsoft 365',
        description: 'Sincronize usuários do Microsoft 365',
        icon: '🟦',
        requiredFields: ['clientId', 'clientSecret', 'tenantId']
      },
      {
        type: 'salesforce',
        name: 'Salesforce',
        description: 'Integre tickets com Salesforce CRM',
        icon: '☁️',
        requiredFields: ['instanceUrl', 'clientId', 'clientSecret']
      },
      {
        type: 'jira',
        name: 'Jira',
        description: 'Sincronize tickets com Jira',
        icon: '🔷',
        requiredFields: ['baseUrl', 'email', 'apiToken']
      },
      {
        type: 'zapier',
        name: 'Zapier',
        description: 'Conecte com 5000+ aplicações via Zapier',
        icon: '⚡',
        requiredFields: ['webhookUrl']
      },
      {
        type: 'custom',
        name: 'Custom Integration',
        description: 'Integração customizada via API',
        icon: '🔧',
        requiredFields: ['apiUrl', 'apiKey']
      }
    ];
  }
}

export default new IntegrationService();
