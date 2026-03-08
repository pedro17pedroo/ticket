import cron from 'node-cron';
import contextService from '../services/contextService.js';
import logger from '../config/logger.js';

/**
 * Job para limpar sessões expiradas
 * Executa a cada hora
 */
export const startSessionCleanupJob = () => {
  // Executar a cada hora (0 minutos de cada hora)
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('🧹 Iniciando limpeza de sessões expiradas...');
      
      const count = await contextService.cleanupExpiredSessions();
      
      if (count > 0) {
        logger.info(`✅ ${count} sessões expiradas foram limpas`);
      } else {
        logger.debug('✅ Nenhuma sessão expirada encontrada');
      }
    } catch (error) {
      logger.error('❌ Erro ao limpar sessões expiradas:', error);
    }
  });

  logger.info('✅ Job de limpeza de sessões iniciado (executa a cada hora)');
};

/**
 * Limpar sessões expiradas manualmente
 * Útil para testes ou execução sob demanda
 */
export const cleanupNow = async () => {
  try {
    logger.info('🧹 Limpeza manual de sessões expiradas...');
    const count = await contextService.cleanupExpiredSessions();
    logger.info(`✅ ${count} sessões expiradas foram limpas`);
    return count;
  } catch (error) {
    logger.error('❌ Erro ao limpar sessões expiradas:', error);
    throw error;
  }
};

export default {
  startSessionCleanupJob,
  cleanupNow
};
