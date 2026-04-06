import integrationService from '../../services/integrationService.js';
import Integration from '../../models/Integration.js';
import logger from '../../config/logger.js';

class IntegrationController {
  // ===== INTEGRATION CRUD =====

  async getAll(req, res) {
    try {
      const { organizationId } = req.user;

      const integrations = await integrationService.getAllIntegrations(organizationId);

      res.json(integrations);
    } catch (error) {
      logger.error('Erro ao buscar integrações:', error);
      res.status(500).json({ error: 'Erro ao buscar integrações' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const integration = await Integration.findOne({
        where: { id, organizationId }
      });

      if (!integration) {
        return res.status(404).json({ error: 'Integração não encontrada' });
      }

      res.json(integration);
    } catch (error) {
      logger.error('Erro ao buscar integração:', error);
      res.status(500).json({ error: 'Erro ao buscar integração' });
    }
  }

  async create(req, res) {
    try {
      const { organizationId, id: userId } = req.user;

      const integration = await integrationService.createIntegration(
        req.body,
        organizationId,
        userId
      );

      res.status(201).json(integration);
    } catch (error) {
      logger.error('Erro ao criar integração:', error);
      res.status(500).json({ error: 'Erro ao criar integração' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const integration = await integrationService.updateIntegration(
        id,
        req.body,
        organizationId
      );

      res.json(integration);
    } catch (error) {
      logger.error('Erro ao atualizar integração:', error);
      res.status(500).json({ error: 'Erro ao atualizar integração' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      await integrationService.deleteIntegration(id, organizationId);

      res.json({ message: 'Integração removida com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar integração:', error);
      res.status(500).json({ error: 'Erro ao deletar integração' });
    }
  }

  // ===== TESTE =====

  async test(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const result = await integrationService.testIntegration(id, organizationId);

      res.json(result);
    } catch (error) {
      logger.error('Erro ao testar integração:', error);
      res.status(500).json({ error: 'Erro ao testar integração' });
    }
  }

  // ===== SYNC =====

  async sync(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const integration = await Integration.findOne({
        where: { id, organizationId }
      });

      if (!integration) {
        return res.status(404).json({ error: 'Integração não encontrada' });
      }

      switch (integration.type) {
        case 'google_workspace':
          await integrationService.syncGoogleWorkspace(id);
          break;
        case 'microsoft_365':
          await integrationService.syncMicrosoft365(id);
          break;
        default:
          return res.status(400).json({ error: 'Tipo de integração não suporta sincronização' });
      }

      res.json({ message: 'Sincronização iniciada' });
    } catch (error) {
      logger.error('Erro ao sincronizar integração:', error);
      res.status(500).json({ error: 'Erro ao sincronizar integração' });
    }
  }

  // ===== AVAILABLE INTEGRATIONS =====

  async getAvailable(req, res) {
    try {
      const available = integrationService.getAvailableIntegrations();
      res.json(available);
    } catch (error) {
      logger.error('Erro ao buscar integrações disponíveis:', error);
      res.status(500).json({ error: 'Erro ao buscar integrações disponíveis' });
    }
  }
}

export default new IntegrationController();
