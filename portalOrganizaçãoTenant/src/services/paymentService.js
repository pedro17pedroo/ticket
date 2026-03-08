import api from './api';

class PaymentService {
  /**
   * Criar pagamento
   */
  async createPayment(paymentData) {
    try {
      const response = await api.post('/payments/create', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Verificar status do pagamento
   */
  async checkPaymentStatus(transactionId) {
    try {
      const response = await api.get(`/payments/${transactionId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de pagamentos
   */
  async getPaymentHistory(filters = {}) {
    try {
      const response = await api.get('/payments/history', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Obter recibo
   */
  async getReceipt(transactionId) {
    try {
      const response = await api.get(`/payments/${transactionId}/receipt`);
      return response.data;
    } catch (error) {
      console.error('Error getting receipt:', error);
      throw error;
    }
  }

  /**
   * Calcular valor de upgrade
   */
  async calculateUpgrade(newPlanId) {
    try {
      const response = await api.post('/payments/calculate-upgrade', { newPlanId });
      return response.data;
    } catch (error) {
      console.error('Error calculating upgrade:', error);
      throw error;
    }
  }
}

export default new PaymentService();
