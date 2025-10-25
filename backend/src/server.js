import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectPostgreSQL, connectMongoDB, syncDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { setupAssociations } from './modules/models/index.js';
import { initializeSocket } from './socket/index.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 3000;

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
    server.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
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
