import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectPostgreSQL, connectMongoDB, syncDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { setupAssociations } from './modules/models/index.js';
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

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
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
