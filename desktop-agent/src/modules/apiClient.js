const axios = require('axios');

class ApiClient {
  constructor(serverUrl, token) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.connected = false;
    this.client = null;
    
    this.setupClient();
  }

  setupClient() {
    this.client = axios.create({
      baseURL: this.serverUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para adicionar token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratar erros
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.connected = false;
          console.error('❌ Token inválido ou expirado');
          console.log('💡 Dica: Faça login novamente na interface do agent para obter um novo token');
          
          // Emitir evento para notificar a interface sobre token expirado
          if (typeof process !== 'undefined' && process.emit) {
            process.emit('token-expired');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  updateConfig(serverUrl, token) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.setupClient();
  }

  async connect() {
    try {
      // Verificar se temos token
      if (!this.token) {
        return { success: false, error: 'Token não configurado' };
      }

      // Testar conexão
      const response = await this.client.get('/api/health');
      
      if (response.status === 200) {
        this.connected = true;
        console.log('✅ Conectado ao servidor:', this.serverUrl);
        return { success: true };
      }
      
      return { success: false, error: 'Servidor não responde' };
    } catch (error) {
      this.connected = false;
      
      if (error.response?.status === 401) {
        console.error('❌ Token inválido ou expirado');
        return { success: false, error: 'Token inválido ou expirado. Faça login novamente.' };
      }
      
      console.error('❌ Erro ao conectar:', error.message);
      return { success: false, error: error.message };
    }
  }

  async validateToken() {
    try {
      if (!this.token) {
        return { valid: false, error: 'Token não configurado' };
      }

      const response = await this.client.get('/api/auth/validate');
      return { valid: true };
    } catch (error) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Token inválido ou expirado' };
      }
      return { valid: false, error: error.message };
    }
  }

  async disconnect() {
    this.connected = false;
    console.log('⏹️ Desconectado do servidor');
  }

  isConnected() {
    return this.connected;
  }

  async sendInventory(inventory) {
    try {
      // Verificar se estamos conectados
      if (!this.connected) {
        throw new Error('Cliente não conectado ao servidor');
      }

      // Verificar se temos token
      if (!this.token) {
        throw new Error('Token não configurado. Faça login novamente.');
      }

      const response = await this.client.post('/api/inventory/agent-collect', {
        inventory,
        source: 'agent' // Mudado de 'desktop-agent' para 'agent'
      });

      console.log('✅ Inventário enviado com sucesso');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        this.connected = false;
        console.error('❌ Token inválido ou expirado ao enviar inventário');
        console.log('💡 Faça login novamente na interface do agent para continuar');
        throw new Error('Token inválido ou expirado. Faça login novamente.');
      }
      
      console.error('❌ Erro ao enviar inventário:', error.message);
      throw error;
    }
  }

  async getAssetInfo(machineId) {
    try {
      const response = await this.client.get(`/api/inventory/assets/machine/${machineId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter informações do asset:', error.message);
      throw error;
    }
  }

  async registerAgent(agentInfo) {
    try {
      const response = await this.client.post('/api/agents/register', agentInfo);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao registrar agente:', error.message);
      throw error;
    }
  }

  async heartbeat(agentData) {
    try {
      const response = await this.client.post('/api/agents/heartbeat', agentData);
      return response.data;
    } catch (error) {
      // Não logar erro de heartbeat para não poluir console
      throw error;
    }
  }
}

module.exports = ApiClient;
