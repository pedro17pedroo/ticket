import api from './api';

class SubscriptionService {
  /**
   * Obter subscrição atual
   */
  async getCurrentSubscription() {
    const response = await api.get('/subscription');
    return response.data;
  }

  /**
   * Obter planos disponíveis
   */
  async getAvailablePlans() {
    const response = await api.get('/plans');
    return response.data;
  }

  /**
   * Solicitar upgrade de plano
   */
  async requestUpgrade(planName, billingCycle = 'monthly') {
    const response = await api.post('/subscription/upgrade', {
      planName,
      billingCycle
    });
    return response.data;
  }

  /**
   * Atualizar estatísticas de uso
   */
  async updateUsageStats() {
    const response = await api.post('/subscription/usage/update');
    return response.data;
  }

  /**
   * Verificar limites atuais
   */
  async checkLimits() {
    const response = await api.get('/subscription/limits-check');
    return response.data;
  }
}

export default new SubscriptionService();
