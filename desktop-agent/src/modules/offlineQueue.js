/**
 * Offline Queue Manager
 * Gerencia ações offline e sincronização quando a conexão é restaurada
 */

const Store = require('electron-store');
const store = new Store();

class OfflineQueue {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.queue = store.get('offline-queue', []);
    this.isProcessing = false;
    this.maxRetries = 3;
  }

  /**
   * Adiciona uma ação à fila offline
   * @param {string} action - Tipo de ação (create_ticket, send_message, etc.)
   * @param {object} data - Dados da ação
   * @param {object} metadata - Metadados adicionais
   */
  add(action, data, metadata = {}) {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      metadata,
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'pending'
    };

    this.queue.push(item);
    this.save();

    console.log(`[OfflineQueue] Ação adicionada à fila: ${action}`, item.id);
    return item.id;
  }

  /**
   * Processa a fila de ações offline
   * @returns {Promise<object>} Resultado do processamento
   */
  async process() {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Processamento já em andamento');
      return { success: false, message: 'Already processing' };
    }

    if (this.queue.length === 0) {
      console.log('[OfflineQueue] Fila vazia');
      return { success: true, processed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let failed = 0;

    console.log(`[OfflineQueue] Iniciando processamento de ${this.queue.length} itens`);

    // Processar itens pendentes
    const pendingItems = this.queue.filter(item => item.status === 'pending');

    for (const item of pendingItems) {
      try {
        console.log(`[OfflineQueue] Processando item ${item.id}: ${item.action}`);
        
        const result = await this.executeAction(item);
        
        if (result.success) {
          // Remover item da fila
          this.removeItem(item.id);
          processed++;
          console.log(`[OfflineQueue] Item ${item.id} processado com sucesso`);
        } else {
          // Incrementar tentativas
          item.retries++;
          
          if (item.retries >= this.maxRetries) {
            item.status = 'failed';
            failed++;
            console.error(`[OfflineQueue] Item ${item.id} falhou após ${this.maxRetries} tentativas`);
          } else {
            console.warn(`[OfflineQueue] Item ${item.id} falhou, tentativa ${item.retries}/${this.maxRetries}`);
          }
          
          this.save();
        }
      } catch (error) {
        console.error(`[OfflineQueue] Erro ao processar item ${item.id}:`, error);
        
        item.retries++;
        if (item.retries >= this.maxRetries) {
          item.status = 'failed';
          item.error = error.message;
          failed++;
        }
        
        this.save();
      }
    }

    this.isProcessing = false;

    console.log(`[OfflineQueue] Processamento concluído: ${processed} sucesso, ${failed} falhas`);

    return {
      success: true,
      processed,
      failed,
      remaining: this.queue.filter(item => item.status === 'pending').length
    };
  }

  /**
   * Executa uma ação específica
   * @param {object} item - Item da fila
   * @returns {Promise<object>} Resultado da execução
   */
  async executeAction(item) {
    const { action, data } = item;

    switch (action) {
      case 'create_ticket':
        return await this.apiClient.createTicket(data);

      case 'send_message':
        return await this.apiClient.sendTicketMessage(data.ticketId, data.message);

      case 'update_ticket':
        return await this.apiClient.updateTicket(data.ticketId, data.updates);

      case 'request_catalog_item':
        return await this.apiClient.requestCatalogItem(data.itemId, data.requestData);

      case 'mark_notification_read':
        return await this.apiClient.markNotificationAsRead(data.notificationId);

      case 'increment_article_views':
        return await this.apiClient.incrementArticleViews(data.articleId);

      default:
        console.error(`[OfflineQueue] Ação desconhecida: ${action}`);
        return { success: false, error: 'Unknown action' };
    }
  }

  /**
   * Remove um item da fila
   * @param {string} itemId - ID do item
   */
  removeItem(itemId) {
    this.queue = this.queue.filter(item => item.id !== itemId);
    this.save();
  }

  /**
   * Limpa itens falhados da fila
   */
  clearFailed() {
    const failedCount = this.queue.filter(item => item.status === 'failed').length;
    this.queue = this.queue.filter(item => item.status !== 'failed');
    this.save();
    console.log(`[OfflineQueue] ${failedCount} itens falhados removidos`);
    return failedCount;
  }

  /**
   * Limpa toda a fila
   */
  clearAll() {
    const count = this.queue.length;
    this.queue = [];
    this.save();
    console.log(`[OfflineQueue] Fila limpa: ${count} itens removidos`);
    return count;
  }

  /**
   * Obtém estatísticas da fila
   * @returns {object} Estatísticas
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Obtém todos os itens da fila
   * @returns {array} Itens da fila
   */
  getAll() {
    return [...this.queue];
  }

  /**
   * Salva a fila no store
   */
  save() {
    store.set('offline-queue', this.queue);
  }

  /**
   * Recarrega a fila do store
   */
  reload() {
    this.queue = store.get('offline-queue', []);
    console.log(`[OfflineQueue] Fila recarregada: ${this.queue.length} itens`);
  }
}

module.exports = OfflineQueue;
