import axios from 'axios';

export const PaymentMethod = {
  EKWANZA: 'ekwanza',
  GPO: 'gpo',
  REF: 'ref'
};

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

class TPagamentoService {
  constructor() {
    this.apiKey = process.env.TPAGAMENTO_API_KEY || 'pk_test_ttb_sandbox_key';
    const baseURL = process.env.TPAGAMENTO_API_URL || 'https://tpagamento-backend.tatusolutions.com/api/v1';
    
    this.client = axios.create({
      baseURL,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 seconds
    });
  }

  // Generate unique reference code
  generateReferenceCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `REF-${timestamp}${random}`;
  }

  // E-Kwanza Payment
  async createEKwanzaPayment(amount, mobileNumber, referenceCode) {
    try {
      const code = referenceCode || this.generateReferenceCode();
      const cleanPhone = mobileNumber.replace(/\D/g, '').slice(-9);

      console.log('[TPagamento] Creating E-Kwanza payment:', { amount, mobileNumber: cleanPhone, referenceCode: code });

      const response = await this.client.post('/ekwanza/payment-code', {
        amount,
        referenceCode: code,
        mobileNumber: cleanPhone,
      });

      console.log('[TPagamento] E-Kwanza payment response:', response.data);

      return {
        success: true,
        paymentId: response.data.id || code,
        referenceCode: code,
        status: 'pending',
        data: response.data,
      };
    } catch (error) {
      console.error('[TPagamento] E-Kwanza payment error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao processar pagamento E-Kwanza',
        error: error.response?.data || error.message
      };
    }
  }

  // Check E-Kwanza Payment Status
  async checkEKwanzaStatus(code) {
    try {
      console.log(`[TPagamento] Checking E-Kwanza status for code: ${code}`);
      
      const response = await this.client.get(`/ekwanza/payment-status/${code}`);
      
      console.log('[TPagamento] E-Kwanza status response:', response.data);

      const statusMap = {
        pending: PaymentStatus.PENDING,
        paid: PaymentStatus.PAID,
        completed: PaymentStatus.PAID,
        failed: PaymentStatus.FAILED,
        expired: PaymentStatus.EXPIRED,
      };

      return {
        success: true,
        status: statusMap[response.data.status?.toLowerCase()] || PaymentStatus.PENDING,
        paymentId: response.data.id,
        amount: response.data.amount,
        paidAt: response.data.paidAt,
        data: response.data,
      };
    } catch (error) {
      console.error('[TPagamento] E-Kwanza status check error:', error.response?.data || error.message);
      return {
        success: false,
        status: PaymentStatus.PENDING,
        data: error.response?.data,
      };
    }
  }

  // Multicaixa Express (GPO) Payment
  async createMulticaixaExpressPayment(amount, customerName, customerEmail, customerPhone, description) {
    try {
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-9);

      const requestData = {
        amount,
        currency: 'AOA',
        paymentMethod: 'gpo',
        customerName,
        customerEmail,
        customerPhone: cleanPhone,
        description: description || 'Pagamento via Multicaixa Express',
        metadata: {
          gateway: 'appypay',
          method: 'gpo',
        },
        expiresIn: 30,
      };

      console.log('[TPagamento] Creating GPO payment:', requestData);

      const response = await this.client.post('/payments', requestData);

      console.log('[TPagamento] GPO payment response:', response.data);

      // Handle nested response structure: { success: true, data: { id, reference, ... } }
      const paymentData = response.data.data || response.data;

      // Check if payment failed
      if (paymentData.status === 'failed') {
        return {
          success: false,
          message: paymentData.message || 'Pagamento falhou. Por favor tente novamente.',
          paymentId: paymentData.id,
          referenceCode: paymentData.reference,
          status: 'failed',
          data: paymentData,
        };
      }

      return {
        success: true,
        paymentId: paymentData.id,
        referenceCode: paymentData.reference,
        status: paymentData.status === 'completed' ? 'paid' : 'pending',
        data: paymentData,
      };
    } catch (error) {
      console.error('[TPagamento] Multicaixa Express payment error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao processar pagamento Multicaixa Express',
        error: error.response?.data || error.message
      };
    }
  }

  // Referência Multicaixa (REF) Payment
  async createReferenciaMulticaixaPayment(amount, customerName, customerEmail, customerPhone, description) {
    try {
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-9);

      const requestData = {
        amount,
        currency: 'AOA',
        paymentMethod: 'ref',
        customerName,
        customerEmail,
        customerPhone: cleanPhone,
        description: description || 'Pagamento via Referência Multicaixa',
        metadata: {
          gateway: 'appypay',
          method: 'ref',
        },
        expiresIn: 60,
      };

      console.log('[TPagamento] Creating REF payment:', requestData);

      const response = await this.client.post('/payments', requestData);

      console.log('[TPagamento] REF payment response:', response.data);

      // Handle nested response structure: { success: true, data: { id, reference, ... } }
      const paymentData = response.data.data || response.data;

      // Check if payment failed
      if (paymentData.status === 'failed') {
        return {
          success: false,
          message: paymentData.message || 'Pagamento falhou. Por favor tente novamente.',
          paymentId: paymentData.id,
          referenceCode: paymentData.reference,
          status: 'failed',
          data: paymentData,
        };
      }

      return {
        success: true,
        paymentId: paymentData.id,
        referenceCode: paymentData.reference,
        status: paymentData.status === 'completed' ? 'paid' : 'pending',
        data: paymentData,
      };
    } catch (error) {
      console.error('[TPagamento] Referência Multicaixa payment error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao processar pagamento Referência Multicaixa',
        error: error.response?.data || error.message
      };
    }
  }

  // Check Multicaixa/Referência Payment Status
  async checkPaymentStatus(paymentId) {
    try {
      console.log(`[TPagamento] Checking payment status for ID: ${paymentId}`);

      if (!paymentId || paymentId === 'null' || paymentId === 'undefined') {
        console.log('[TPagamento] Invalid payment ID provided');
        return {
          success: false,
          status: PaymentStatus.PENDING,
          data: { error: 'Invalid payment ID' },
        };
      }

      const response = await this.client.get(`/payments/${paymentId}`);

      console.log(`[TPagamento] Payment status response:`, response.data);

      // Handle nested response structure: { success: true, data: { status, ... } }
      const paymentData = response.data.data || response.data;

      const statusMap = {
        pending: PaymentStatus.PENDING,
        paid: PaymentStatus.PAID,
        completed: PaymentStatus.PAID,
        failed: PaymentStatus.FAILED,
        expired: PaymentStatus.EXPIRED,
      };

      const mappedStatus = statusMap[paymentData.status?.toLowerCase()] || PaymentStatus.PENDING;

      console.log(`[TPagamento] Status mapping: ${paymentData.status} -> ${mappedStatus}`);

      return {
        success: true,
        status: mappedStatus,
        paymentId: paymentData.id,
        amount: paymentData.amount,
        paidAt: paymentData.paidAt,
        data: paymentData,
      };
    } catch (error) {
      console.error('[TPagamento] Payment status check error:', error.response?.data || error.message);
      return {
        success: false,
        status: PaymentStatus.PENDING,
        data: error.response?.data,
      };
    }
  }

  // Unified payment creation
  async createPayment(method, amount, customer, description) {
    switch (method) {
      case PaymentMethod.EKWANZA:
        return this.createEKwanzaPayment(amount, customer.phone);
      
      case PaymentMethod.GPO:
        return this.createMulticaixaExpressPayment(
          amount,
          customer.name,
          customer.email,
          customer.phone,
          description
        );
      
      case PaymentMethod.REF:
        return this.createReferenciaMulticaixaPayment(
          amount,
          customer.name,
          customer.email,
          customer.phone,
          description
        );
      
      default:
        return {
          success: false,
          message: 'Método de pagamento não suportado',
        };
    }
  }

  // Unified status check
  async getPaymentStatus(method, paymentIdOrCode) {
    if (method === PaymentMethod.EKWANZA) {
      return this.checkEKwanzaStatus(paymentIdOrCode);
    }
    return this.checkPaymentStatus(paymentIdOrCode);
  }
}

// Export singleton instance
export const tpagamentoService = new TPagamentoService();
export default tpagamentoService;
