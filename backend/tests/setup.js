/**
 * Configuração e Setup dos Testes
 * Configurações globais para execução dos testes
 */

import { config } from 'dotenv';

// Carregar variáveis de ambiente para testes
config({ path: '.env.test' });

// Importar e configurar associações dos modelos
import { setupAssociations } from '../src/modules/models/index.js';

// Configurar associações do Sequelize
setupAssociations();

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});