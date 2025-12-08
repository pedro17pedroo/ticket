/**
 * Configuração Centralizada do Desktop Agent
 * 
 * Este arquivo centraliza todas as configurações do aplicativo,
 * permitindo fácil manutenção e alteração de parâmetros.
 */

require('dotenv').config();

const config = {
  // Configurações do Backend
  backend: {
    // URL base do backend (sem /api no final - o código adiciona /api nas chamadas)
    url: process.env.BACKEND_URL || 'http://localhost:4003',
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  },

  // Modo de desenvolvimento
  development: {
    useMock: process.env.USE_MOCK === 'true',
  },

  // Sincronização
  sync: {
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL) || 5,
    intervalMs: (parseInt(process.env.SYNC_INTERVAL) || 5) * 60 * 1000,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Aplicação
  app: {
    name: 'TatuTicket Desktop Agent',
    version: '2.0.0',
  },
};

// Validar configurações críticas
if (!config.backend.url) {
  console.error('❌ ERRO: BACKEND_URL não configurada!');
  console.error('Configure a variável BACKEND_URL no arquivo .env');
  process.exit(1);
}

// Log de configuração (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  console.log('⚙️  Configuração carregada:');
  console.log('   Backend URL:', config.backend.url);
  console.log('   Modo Mock:', config.development.useMock ? 'ATIVADO' : 'DESATIVADO');
  console.log('   Sync Interval:', config.sync.intervalMinutes, 'minutos');
}

module.exports = config;
