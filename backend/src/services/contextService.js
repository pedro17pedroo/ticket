import { Op } from 'sequelize';
import OrganizationUser from '../models/OrganizationUser.js';
import ClientUser from '../modules/clients/clientUserModel.js';
import ContextSession from '../models/ContextSession.js';
import ContextAuditLog from '../models/ContextAuditLog.js';
import Organization from '../modules/organizations/organizationModel.js';
import Client from '../modules/clients/clientModel.js';
import logger from '../config/logger.js';

class ContextService {
  /**
   * Buscar todos os contextos disponíveis para um email
   * @param {string} email - Email do usuário
   * @param {string} password - Senha para validação (opcional)
   * @returns {Promise<Array>} Array de contextos disponíveis
   */
  async getContextsForEmail(email, password = null) {
    try {
      const contexts = [];

      // Buscar contextos de organização
      const orgUsers = await OrganizationUser.scope('withPassword').findAll({
        where: { email, isActive: true },
        include: [{
          model: Organization,
          as: 'organization',
          where: { isActive: true },
          required: true
        }]
      });

      // Validar senha e adicionar contextos de organização
      for (const orgUser of orgUsers) {
        // Se senha foi fornecida, validar
        if (password) {
          const isValid = await orgUser.comparePassword(password);
          if (!isValid) continue;
        }

        contexts.push({
          id: orgUser.id,
          type: 'organization',
          userId: orgUser.id,
          userType: 'organization',
          contextId: orgUser.organizationId,
          contextType: 'organization',
          organizationId: orgUser.organizationId,
          organizationName: orgUser.organization?.name || 'Unknown',
          organizationSlug: orgUser.organization?.slug,
          email: orgUser.email,
          name: orgUser.name,
          role: orgUser.role,
          permissions: orgUser.permissions,
          avatar: orgUser.avatar,
          isLastUsed: false,
          lastAccessedAt: null
        });
      }

      // Buscar contextos de cliente
      const clientUsers = await ClientUser.scope('withPassword').findAll({
        where: { email, isActive: true },
        include: [
          {
            model: Client,
            as: 'client',
            where: { isActive: true },
            required: true
          },
          {
            model: Organization,
            as: 'organization',
            where: { isActive: true },
            required: true
          }
        ]
      });

      // Validar senha e adicionar contextos de cliente
      for (const clientUser of clientUsers) {
        // Se senha foi fornecida, validar
        if (password) {
          const isValid = await clientUser.comparePassword(password);
          if (!isValid) continue;
        }

        contexts.push({
          id: clientUser.id,
          type: 'client',
          userId: clientUser.id,
          userType: 'client',
          contextId: clientUser.clientId,
          contextType: 'client',
          organizationId: clientUser.organizationId,
          organizationName: clientUser.organization?.name || 'Unknown',
          clientId: clientUser.clientId,
          clientName: clientUser.client?.name || 'Unknown',
          email: clientUser.email,
          name: clientUser.name,
          role: clientUser.role,
          permissions: clientUser.permissions,
          avatar: clientUser.avatar,
          isLastUsed: false,
          lastAccessedAt: null
        });
      }

      // Buscar a sessão mais recente para determinar o último contexto usado
      if (contexts.length > 0) {
        const userIds = contexts.map(ctx => ctx.userId);
        
        const lastSession = await ContextSession.findOne({
          where: {
            userId: { [Op.in]: userIds }
          },
          order: [['last_activity_at', 'DESC']]
        });

        if (lastSession) {
          // Marcar o contexto correspondente como último usado
          const lastUsedContext = contexts.find(
            ctx => ctx.userId === lastSession.userId && 
                   ctx.contextId === lastSession.contextId &&
                   ctx.contextType === lastSession.contextType
          );

          if (lastUsedContext) {
            lastUsedContext.isLastUsed = true;
            lastUsedContext.lastAccessedAt = lastSession.lastActivityAt;
          }
        }
      }

      return contexts;
    } catch (error) {
      logger.error('Erro ao buscar contextos para email:', error);
      throw error;
    }
  }

  /**
   * Validar se um usuário tem acesso a um contexto específico
   * @param {string} email - Email do usuário
   * @param {string} contextId - ID do contexto (organizationId ou clientId)
   * @param {string} contextType - Tipo do contexto ('organization' ou 'client')
   * @returns {Promise<Object|null>} Dados do usuário se válido, null caso contrário
   */
  async validateContextAccess(email, contextId, contextType) {
    try {
      if (contextType === 'organization') {
        const orgUser = await OrganizationUser.findOne({
          where: {
            email,
            organizationId: contextId,
            isActive: true
          },
          include: [{
            model: Organization,
            as: 'organization',
            where: { isActive: true },
            required: true
          }]
        });

        if (!orgUser) return null;

        return {
          userId: orgUser.id,
          userType: 'organization',
          contextId: orgUser.organizationId,
          contextType: 'organization',
          email: orgUser.email,
          name: orgUser.name,
          role: orgUser.role,
          permissions: orgUser.permissions,
          organizationId: orgUser.organizationId,
          organizationName: orgUser.organization?.name
        };
      } else if (contextType === 'client') {
        const clientUser = await ClientUser.findOne({
          where: {
            email,
            clientId: contextId,
            isActive: true
          },
          include: [
            {
              model: Client,
              as: 'client',
              where: { isActive: true },
              required: true
            },
            {
              model: Organization,
              as: 'organization',
              where: { isActive: true },
              required: true
            }
          ]
        });

        if (!clientUser) return null;

        return {
          userId: clientUser.id,
          userType: 'client',
          contextId: clientUser.clientId,
          contextType: 'client',
          email: clientUser.email,
          name: clientUser.name,
          role: clientUser.role,
          permissions: clientUser.permissions,
          organizationId: clientUser.organizationId,
          organizationName: clientUser.organization?.name,
          clientId: clientUser.clientId,
          clientName: clientUser.client?.name
        };
      }

      return null;
    } catch (error) {
      logger.error('Erro ao validar acesso ao contexto:', error);
      throw error;
    }
  }

  /**
   * Criar uma nova sessão de contexto
   * @param {string} userId - ID do usuário
   * @param {string} userType - Tipo do usuário ('organization' ou 'client')
   * @param {string} contextId - ID do contexto
   * @param {string} contextType - Tipo do contexto ('organization' ou 'client')
   * @param {string} ipAddress - Endereço IP do cliente
   * @param {string} userAgent - User agent do navegador
   * @returns {Promise<Object>} Sessão criada
   */
  async createContextSession(userId, userType, contextId, contextType, ipAddress, userAgent) {
    try {
      // Calcular tempo de expiração (8 horas)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      // Gerar token temporário (será substituído pelo JWT real)
      const sessionToken = `temp_${userId}_${Date.now()}`;

      const session = await ContextSession.create({
        userId,
        userType,
        contextId,
        contextType,
        sessionToken,
        ipAddress,
        userAgent,
        isActive: true,
        lastActivityAt: new Date(),
        expiresAt
      });

      logger.info('Sessão de contexto criada:', {
        sessionId: session.id,
        userId,
        userType,
        contextId,
        contextType
      });

      return session;
    } catch (error) {
      logger.error('Erro ao criar sessão de contexto:', error);
      throw error;
    }
  }

  /**
   * Invalidar uma sessão de contexto
   * @param {string} sessionId - ID da sessão
   * @returns {Promise<boolean>} True se invalidada com sucesso
   */
  async invalidateContextSession(sessionId) {
    try {
      const session = await ContextSession.findByPk(sessionId);

      if (!session) {
        logger.warn('Tentativa de invalidar sessão inexistente:', sessionId);
        return false;
      }

      await session.invalidate();

      logger.info('Sessão de contexto invalidada:', {
        sessionId: session.id,
        userId: session.userId,
        contextId: session.contextId
      });

      return true;
    } catch (error) {
      logger.error('Erro ao invalidar sessão de contexto:', error);
      throw error;
    }
  }

  /**
   * Obter contexto ativo de uma sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Promise<Object|null>} Dados do contexto ativo ou null
   */
  async getActiveContext(sessionId) {
    try {
      const session = await ContextSession.findOne({
        where: {
          id: sessionId,
          isActive: true
        }
      });

      if (!session) {
        return null;
      }

      // Verificar se a sessão expirou
      if (session.isExpired()) {
        await session.invalidate();
        return null;
      }

      // Atualizar última atividade
      await session.updateActivity();

      // Buscar dados completos do contexto
      let contextData = null;

      if (session.contextType === 'organization') {
        const orgUser = await OrganizationUser.findOne({
          where: {
            id: session.userId,
            organizationId: session.contextId,
            isActive: true
          },
          include: [{
            model: Organization,
            as: 'organization',
            where: { isActive: true },
            required: true
          }]
        });

        if (orgUser) {
          contextData = {
            sessionId: session.id,
            userId: orgUser.id,
            userType: 'organization',
            contextId: orgUser.organizationId,
            contextType: 'organization',
            email: orgUser.email,
            name: orgUser.name,
            role: orgUser.role,
            permissions: orgUser.permissions,
            organizationId: orgUser.organizationId,
            organizationName: orgUser.organization?.name,
            avatar: orgUser.avatar
          };
        }
      } else if (session.contextType === 'client') {
        const clientUser = await ClientUser.findOne({
          where: {
            id: session.userId,
            clientId: session.contextId,
            isActive: true
          },
          include: [
            {
              model: Client,
              as: 'client',
              where: { isActive: true },
              required: true
            },
            {
              model: Organization,
              as: 'organization',
              where: { isActive: true },
              required: true
            }
          ]
        });

        if (clientUser) {
          contextData = {
            sessionId: session.id,
            userId: clientUser.id,
            userType: 'client',
            contextId: clientUser.clientId,
            contextType: 'client',
            email: clientUser.email,
            name: clientUser.name,
            role: clientUser.role,
            permissions: clientUser.permissions,
            organizationId: clientUser.organizationId,
            organizationName: clientUser.organization?.name,
            clientId: clientUser.clientId,
            clientName: clientUser.client?.name,
            avatar: clientUser.avatar
          };
        }
      }

      return contextData;
    } catch (error) {
      logger.error('Erro ao obter contexto ativo:', error);
      throw error;
    }
  }

  /**
   * Registrar troca de contexto no audit log
   * @param {string} userId - ID do usuário
   * @param {Object} fromContext - Contexto de origem
   * @param {Object} toContext - Contexto de destino
   * @param {string} ipAddress - Endereço IP
   * @param {string} userAgent - User agent
   * @returns {Promise<Object>} Log de auditoria criado
   */
  async logContextSwitch(userId, fromContext, toContext, ipAddress, userAgent) {
    try {
      const log = await ContextAuditLog.logContextSwitch(
        userId,
        toContext.email,
        toContext.userType,
        fromContext?.contextId || null,
        fromContext?.contextType || null,
        toContext.contextId,
        toContext.contextType,
        ipAddress,
        userAgent,
        true,
        null
      );

      logger.info('Troca de contexto registrada:', {
        userId,
        from: fromContext ? `${fromContext.contextType}:${fromContext.contextId}` : 'none',
        to: `${toContext.contextType}:${toContext.contextId}`
      });

      return log;
    } catch (error) {
      logger.error('Erro ao registrar troca de contexto:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de trocas de contexto de um usuário
   * @param {string} email - Email do usuário
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Promise<Object>} Histórico de trocas
   */
  async getContextSwitchHistory(email, options = {}) {
    try {
      const {
        action,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = options;

      const where = { userEmail: email };

      if (action) where.action = action;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      const { rows: logs, count } = await ContextAuditLog.findAndCountAll({
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
      logger.error('Erro ao buscar histórico de contexto:', error);
      throw error;
    }
  }

  /**
   * Limpar sessões expiradas
   * @returns {Promise<number>} Número de sessões limpas
   */
  async cleanupExpiredSessions() {
    try {
      const result = await ContextSession.update(
        { isActive: false },
        {
          where: {
            isActive: true,
            expiresAt: {
              [Op.lt]: new Date()
            }
          }
        }
      );

      const count = result[0];
      
      if (count > 0) {
        logger.info(`${count} sessões expiradas foram limpas`);
      }

      return count;
    } catch (error) {
      logger.error('Erro ao limpar sessões expiradas:', error);
      throw error;
    }
  }

  /**
   * Obter sessões ativas de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Array de sessões ativas
   */
  async getActiveSessions(userId) {
    try {
      const sessions = await ContextSession.findAll({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            [Op.gt]: new Date()
          }
        },
        order: [['last_activity_at', 'DESC']]
      });

      return sessions;
    } catch (error) {
      logger.error('Erro ao buscar sessões ativas:', error);
      throw error;
    }
  }

  /**
   * Armazenar contexto preferido do usuário
   * @param {string} email - Email do usuário
   * @param {string} contextId - ID do contexto preferido
   * @param {string} contextType - Tipo do contexto preferido ('organization' ou 'client')
   * @returns {Promise<boolean>} True se armazenado com sucesso
   */
  async setPreferredContext(email, contextId, contextType) {
    try {
      // Validar que o usuário tem acesso ao contexto
      const contextData = await this.validateContextAccess(email, contextId, contextType);
      
      if (!contextData) {
        logger.warn('Tentativa de definir contexto preferido inválido:', { email, contextId, contextType });
        return false;
      }

      // Atualizar settings do usuário no modelo apropriado
      const Model = contextType === 'organization' ? OrganizationUser : ClientUser;
      const user = await Model.findByPk(contextData.userId);

      if (!user) {
        logger.warn('Usuário não encontrado ao definir contexto preferido:', contextData.userId);
        return false;
      }

      // Atualizar settings com contexto preferido
      const currentSettings = user.settings || {};
      const updatedSettings = {
        ...currentSettings,
        preferredContext: {
          contextId,
          contextType,
          updatedAt: new Date()
        }
      };

      await user.update({ settings: updatedSettings });

      logger.info('Contexto preferido definido:', {
        userId: user.id,
        email: user.email,
        contextId,
        contextType
      });

      return true;
    } catch (error) {
      logger.error('Erro ao definir contexto preferido:', error);
      throw error;
    }
  }

  /**
   * Obter contexto preferido do usuário
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} Contexto preferido ou null
   */
  async getPreferredContext(email) {
    try {
      // Buscar em ambas as tabelas
      const orgUser = await OrganizationUser.findOne({
        where: { email, isActive: true }
      });

      const clientUser = await ClientUser.findOne({
        where: { email, isActive: true }
      });

      // Verificar se algum usuário tem contexto preferido definido
      let preferredContext = null;

      if (orgUser?.settings?.preferredContext) {
        preferredContext = orgUser.settings.preferredContext;
      }

      if (clientUser?.settings?.preferredContext) {
        // Se ambos têm preferência, usar o mais recente
        if (!preferredContext || 
            new Date(clientUser.settings.preferredContext.updatedAt) > new Date(preferredContext.updatedAt)) {
          preferredContext = clientUser.settings.preferredContext;
        }
      }

      if (preferredContext) {
        logger.debug('Contexto preferido encontrado:', {
          email,
          contextId: preferredContext.contextId,
          contextType: preferredContext.contextType
        });
      }

      return preferredContext;
    } catch (error) {
      logger.error('Erro ao obter contexto preferido:', error);
      throw error;
    }
  }

  /**
   * Marcar contextos com flags de preferência e último uso
   * @param {Array} contexts - Array de contextos
   * @param {string} email - Email do usuário
   * @returns {Promise<Array>} Contextos com flags atualizadas
   */
  async enrichContextsWithPreferences(contexts, email) {
    try {
      if (!contexts || contexts.length === 0) {
        return contexts;
      }

      // Obter contexto preferido
      const preferredContext = await this.getPreferredContext(email);

      // Marcar contexto preferido
      if (preferredContext) {
        const preferred = contexts.find(
          ctx => ctx.contextId === preferredContext.contextId && 
                 ctx.contextType === preferredContext.contextType
        );

        if (preferred) {
          preferred.isPreferred = true;
        }
      }

      // Ordenar: preferido primeiro, depois último usado, depois alfabético
      contexts.sort((a, b) => {
        if (a.isPreferred && !b.isPreferred) return -1;
        if (!a.isPreferred && b.isPreferred) return 1;
        if (a.isLastUsed && !b.isLastUsed) return -1;
        if (!a.isLastUsed && b.isLastUsed) return 1;
        return (a.organizationName || a.clientName || '').localeCompare(b.organizationName || b.clientName || '');
      });

      return contexts;
    } catch (error) {
      logger.error('Erro ao enriquecer contextos com preferências:', error);
      return contexts; // Retornar contextos sem enriquecimento em caso de erro
    }
  }
}

export default new ContextService();
