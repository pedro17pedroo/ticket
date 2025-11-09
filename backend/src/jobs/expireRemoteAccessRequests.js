/**
 * Job para expirar solicitações de acesso remoto pendentes
 * Executa a cada 5 minutos
 */

import { RemoteAccess } from '../modules/models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

export const expireRemoteAccessRequests = async () => {
  try {
    const now = new Date();
    
    // Buscar solicitações pendentes expiradas
    const expiredRequests = await RemoteAccess.findAll({
      where: {
        status: 'pending',
        expiresAt: {
          [Op.lt]: now
        }
      }
    });

    if (expiredRequests.length === 0) {
      logger.debug('Nenhuma solicitação de acesso remoto expirada');
      return;
    }

    // Atualizar para rejeitadas
    for (const request of expiredRequests) {
      const auditLog = request.auditLog || [];
      auditLog.push({
        action: 'expired',
        timestamp: now,
        reason: 'Solicitação expirada automaticamente'
      });

      await request.update({
        status: 'rejected',
        rejectionReason: 'Expirado automaticamente (30 minutos)',
        respondedAt: now,
        auditLog
      });

      logger.info(`Solicitação de acesso remoto ${request.id} expirada automaticamente`);
    }

    logger.info(`${expiredRequests.length} solicitação(ões) de acesso remoto expirada(s)`);
  } catch (error) {
    logger.error('Erro ao expirar solicitações de acesso remoto:', error);
  }
};

// Executar a cada 5 minutos
export const startExpirationJob = () => {
  const INTERVAL = 5 * 60 * 1000; // 5 minutos

  setInterval(expireRemoteAccessRequests, INTERVAL);
  logger.info('✅ Job de expiração de acesso remoto iniciado (executa a cada 5 minutos)');

  // Executar imediatamente na inicialização
  expireRemoteAccessRequests();
};
