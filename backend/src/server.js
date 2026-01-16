import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectPostgreSQL, connectMongoDB, syncDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { setupAssociations } from './modules/models/index.js';
import { initializeSocket } from './socket/index.js';
import emailInboxService from './services/emailInboxService.js';
import emailProcessor from './services/emailProcessor.js';
import slaMonitor from './jobs/slaMonitor.js';
import healthCheckMonitor from './jobs/healthCheckMonitor.js';
import { startExpirationJob } from './jobs/expireRemoteAccessRequests.js';
import { startCleanupJob } from './jobs/cleanupExpiredReports.js';
import logger from './config/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT, 10) || 4003;

// Inicializar servidor
const startServer = async () => {
  try {
    // Conectar bancos de dados
    await connectPostgreSQL();
    await connectMongoDB();
    await connectRedis();

    // Configurar associações de modelos
    setupAssociations();

    // Sincronizar modelos (apenas em desenvolvimento)
    await syncDatabase();

    // Executar migração de organizationId em comments se necessário
    try {
      const { updateCommentsOrganization } = await import('./migrations/updateCommentsOrganization.js');
      await updateCommentsOrganization();
    } catch (error) {
      logger.warn('⚠️  Migração de comments:', error.message);
    }

    // Criar servidor HTTP
    const server = http.createServer(app);

    // Inicializar Socket.IO
    initializeSocket(server);

    // Iniciar servidor
    server.listen(PORT, async () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
      
      // Inicializar serviço de processamento de e-mail
      try {
        if (process.env.IMAP_USER && process.env.IMAP_PASS) {
          await emailProcessor.initialize();
          logger.info('✅ Serviço de processamento de e-mail iniciado');
        } else {
          logger.info('📧 Configuração de e-mail não encontrada (IMAP_USER/IMAP_PASS)');
        }
      } catch (error) {
        logger.error('❌ Erro ao inicializar serviço de e-mail:', error.message);
        logger.warn('⚠️ Sistema continuará sem processamento de e-mail');
      }

      // Inicializar monitor de SLA (se tabelas existirem)
      try {
        await slaMonitor.start();
        logger.info('✅ Monitor de SLA iniciado');
      } catch (error) {
        logger.warn('⚠️ Monitor de SLA desabilitado:', error.message);
      }

      // Inicializar monitor de Health Check (se tabelas existirem)
      try {
        await healthCheckMonitor.start();
        logger.info('✅ Monitor de Health Check iniciado');
      } catch (error) {
        logger.warn('⚠️ Monitor de Health Check desabilitado:', error.message);
      }

      // Inicializar job de expiração de acesso remoto (se tabela existir)
      try {
        startExpirationJob();
      } catch (error) {
        logger.warn('⚠️ Job de expiração desabilitado:', error.message);
      }

      // Inicializar job de limpeza de relatórios expirados
      try {
        startCleanupJob();
      } catch (error) {
        logger.warn('⚠️ Job de limpeza de relatórios desabilitado:', error.message);
      }
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Iniciar
startServer();
