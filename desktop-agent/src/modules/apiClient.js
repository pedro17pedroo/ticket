const axios = require('axios');

class ApiClient {
  constructor(serverUrl, token) {
    // Remove /api do final se existir para evitar duplicação
    this.serverUrl = serverUrl ? serverUrl.replace(/\/api\/?$/, '') : serverUrl;
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
    // Remove /api do final se existir para evitar duplicação
    this.serverUrl = serverUrl ? serverUrl.replace(/\/api\/?$/, '') : serverUrl;
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

  // ==================== PERFIL DO USUÁRIO ====================
  
  async getUserProfile() {
    try {
      const response = await this.client.get('/api/auth/profile');
      console.log('✅ Perfil do usuário obtido:', response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('❌ Erro ao obter perfil do usuário:', error.message);
      throw error;
    }
  }

  // ==================== CATÁLOGO DE SERVIÇOS ====================
  
  async getCatalogCategories() {
    try {
      const response = await this.client.get('/api/catalog/categories');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter categorias do catálogo:', error.message);
      throw error;
    }
  }

  async getCatalogItems(categoryId = null) {
    try {
      const params = categoryId ? { categoryId } : {};
      const response = await this.client.get('/api/catalog/items', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter itens do catálogo:', error.message);
      throw error;
    }
  }

  async requestCatalogItem(itemId, data) {
    try {
      const response = await this.client.post('/api/catalog/requests', {
        catalogItemId: itemId,
        ...data
      });
      console.log('✅ Item do catálogo solicitado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao solicitar item do catálogo:', error.message);
      throw error;
    }
  }

  // ==================== BASE DE CONHECIMENTO ====================
  
  async getKnowledgeArticles(filters = {}) {
    try {
      const response = await this.client.get('/api/knowledge', { params: filters });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter artigos da base de conhecimento:', error.message);
      throw error;
    }
  }

  async getKnowledgeArticle(id) {
    try {
      const response = await this.client.get(`/api/knowledge/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter artigo da base de conhecimento:', error.message);
      throw error;
    }
  }

  async incrementArticleViews(id) {
    try {
      const response = await this.client.post(`/api/knowledge/${id}/view`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao incrementar visualizações do artigo:', error.message);
      throw error;
    }
  }

  // ==================== NOTIFICAÇÕES ====================
  
  async getNotifications() {
    try {
      const response = await this.client.get('/api/notifications');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter notificações:', error.message);
      throw error;
    }
  }

  async markNotificationAsRead(id) {
    try {
      const response = await this.client.patch(`/api/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error.message);
      throw error;
    }
  }

  // ==================== ESTATÍSTICAS ====================
  
  async getTicketStatistics() {
    try {
      const response = await this.client.get('/api/tickets/statistics');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de tickets:', error.message);
      throw error;
    }
  }

  // ==================== UPLOAD DE ANEXOS ====================

  /**
   * Faz upload de anexo para um ticket
   * @param {string} ticketId - ID do ticket
   * @param {object} uploadData - Dados do upload (fileName, fileSize, mimeType, data)
   * @param {function} onProgress - Callback de progresso
   * @returns {Promise<object>} Resultado do upload
   */
  async uploadAttachment(ticketId, uploadData, onProgress = null) {
    try {
      const response = await this.client.post(
        `/api/tickets/${ticketId}/attachments`,
        uploadData,
        {
          onUploadProgress: (progressEvent) => {
            if (onProgress) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percent
              });
            }
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload de anexo:', error.message);
      throw error;
    }
  }

  /**
   * Lista anexos de um ticket
   * @param {string} ticketId - ID do ticket
   * @returns {Promise<array>} Lista de anexos
   */
  async getTicketAttachments(ticketId) {
    try {
      const response = await this.client.get(`/api/tickets/${ticketId}/attachments`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar anexos:', error.message);
      throw error;
    }
  }

  /**
   * Baixa um anexo
   * @param {string} ticketId - ID do ticket
   * @param {string} attachmentId - ID do anexo
   * @returns {Promise<object>} Dados do anexo
   */
  async downloadAttachment(ticketId, attachmentId) {
    try {
      const response = await this.client.get(
        `/api/tickets/${ticketId}/attachments/${attachmentId}`,
        { responseType: 'arraybuffer' }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao baixar anexo:', error.message);
      throw error;
    }
  }

  /**
   * Remove um anexo
   * @param {string} ticketId - ID do ticket
   * @param {string} attachmentId - ID do anexo
   * @returns {Promise<object>} Resultado da remoção
   */
  async deleteAttachment(ticketId, attachmentId) {
    try {
      const response = await this.client.delete(
        `/api/tickets/${ticketId}/attachments/${attachmentId}`
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao remover anexo:', error.message);
      throw error;
    }
  }
}

module.exports = ApiClient;
