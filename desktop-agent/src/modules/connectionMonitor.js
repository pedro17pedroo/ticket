/**
 * Connection Monitor
 * Monitora o estado da conexão com o backend
 */

const { EventEmitter } = require('events');
const axios = require('axios');

class ConnectionMonitor extends EventEmitter {
  constructor(apiClient) {
    super();
    this.apiClient = apiClient;
    this.isOnline = true;
    this.checkInterval = null;
    this.checkIntervalMs = 30000; // 30 segundos
    this.lastCheckTime = null;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
  }

  /**
   * Inicia o monitoramento de conexão
   */
  start() {
    console.log('[ConnectionMonitor] Iniciando monitoramento de conexão');
    
    // Verificação inicial
    this.checkConnection();

    // Verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, this.checkIntervalMs);

    // Listener para eventos de rede do sistema
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Para o monitoramento de conexão
   */
  stop() {
    console.log('[ConnectionMonitor] Parando monitoramento de conexão');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Verifica o estado da conexão
   */
  async checkConnection() {
    this.lastCheckTime = new Date();

    try {
      // Verificar se apiClient tem serverUrl definido
      const serverUrl = this.apiClient?.serverUrl;
      if (!serverUrl) {
        console.log('[ConnectionMonitor] Aguardando configuração do servidor...');
        return;
      }
      
      // Tentar fazer uma requisição simples ao backend
      // Remove /api do final se existir para evitar duplicação
      const cleanUrl = serverUrl.replace(/\/api\/?$/, '');
      const response = await axios.get(`${cleanUrl}/api/health`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${this.apiClient.token}`
        }
      });

      if (response.status === 200) {
        this.handleConnectionSuccess();
      } else {
        this.handleConnectionFailure();
      }
    } catch (error) {
      this.handleConnectionFailure(error);
    }
  }

  /**
   * Manipula sucesso na conexão
   */
  handleConnectionSuccess() {
    this.consecutiveFailures = 0;

    if (!this.isOnline) {
      console.log('[ConnectionMonitor] Conexão restaurada');
      this.isOnline = true;
      this.emit('online');
    }
  }

  /**
   * Manipula falha na conexão
   */
  handleConnectionFailure(error = null) {
    this.consecutiveFailures++;

    if (error) {
      console.warn('[ConnectionMonitor] Falha na verificação de conexão:', error.message);
    }

    // Só considera offline após múltiplas falhas consecutivas
    if (this.consecutiveFailures >= this.maxConsecutiveFailures && this.isOnline) {
      console.log('[ConnectionMonitor] Conexão perdida');
      this.isOnline = false;
      this.emit('offline');
    }
  }

  /**
   * Manipula evento online do sistema
   */
  handleOnline() {
    console.log('[ConnectionMonitor] Sistema reportou conexão online');
    this.checkConnection();
  }

  /**
   * Manipula evento offline do sistema
   */
  handleOffline() {
    console.log('[ConnectionMonitor] Sistema reportou conexão offline');
    if (this.isOnline) {
      this.isOnline = false;
      this.emit('offline');
    }
  }

  /**
   * Obtém o estado atual da conexão
   * @returns {boolean} true se online, false se offline
   */
  getStatus() {
    return this.isOnline;
  }

  /**
   * Obtém estatísticas do monitor
   * @returns {object} Estatísticas
   */
  getStats() {
    return {
      isOnline: this.isOnline,
      lastCheckTime: this.lastCheckTime,
      consecutiveFailures: this.consecutiveFailures,
      checkIntervalMs: this.checkIntervalMs
    };
  }

  /**
   * Define o intervalo de verificação
   * @param {number} intervalMs - Intervalo em milissegundos
   */
  setCheckInterval(intervalMs) {
    this.checkIntervalMs = intervalMs;
    
    if (this.checkInterval) {
      this.stop();
      this.start();
    }
  }
}

module.exports = ConnectionMonitor;
