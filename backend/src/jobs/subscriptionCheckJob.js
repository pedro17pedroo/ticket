import cron from 'node-cron';
import subscriptionNotificationService from '../services/subscriptionNotificationService.js';
import logger from '../config/logger.js';

/**
 * Job para verificar subscrições expirando
 * Executa diariamente às 9h da manhã
 */
export const startSubscriptionCheckJob = () => {
  // Executar diariamente às 9h
  cron.schedule('0 9 * * *', async () => {
    logger.info('🕐 Iniciando job de verificação de subscrições...');
    
    try {
      await subscriptionNotificationService.checkExpiringSubscriptions();
      logger.info('✅ Job de verificação de subscrições concluído');
    } catch (error) {
      logger.error('❌ Erro no job de verificação de subscrições:', error);
    }
  }, {
    timezone: 'Africa/Luanda' // Ajustar para o timezone correto
  });

  logger.info('✅ Job de verificação de subscrições agendado (diariamente às 9h)');
};

/**
 * Executar verificação manualmente (para testes)
 */
export const runSubscriptionCheckNow = async () => {
  logger.info('🔍 Executando verificação manual de subscrições...');
  
  try {
    await subscriptionNotificationService.checkExpiringSubscriptions();
    logger.info('✅ Verificação manual concluída');
  } catch (error) {
    logger.error('❌ Erro na verificação manual:', error);
    throw error;
  }
};

export default {
  startSubscriptionCheckJob,
  runSubscriptionCheckNow
};
