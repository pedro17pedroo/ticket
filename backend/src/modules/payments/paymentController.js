import paymentService from '../../services/paymentService.js';
import PaymentTransaction from '../../models/PaymentTransaction.js';
import PaymentReceipt from '../../models/PaymentReceipt.js';

/**
 * POST /api/payments/create - Criar novo pagamento
 */
export const createPayment = async (req, res, next) => {
  try {
    const {
      amount,
      paymentMethod,
      customerName,
      customerEmail,
      customerPhone,
      description,
      subscriptionId
    } = req.body;

    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não está associado a uma organização'
      });
    }

    // Validações
    if (!amount || !paymentMethod || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios: amount, paymentMethod, customerName, customerEmail, customerPhone'
      });
    }

    if (!['ekwanza', 'gpo', 'ref'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Método de pagamento inválido. Use: ekwanza, gpo ou ref'
      });
    }

    const result = await paymentService.createPaymentTransaction(
      organizationId,
      subscriptionId,
      {
        method: paymentMethod,
        amount,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        description: description || 'Pagamento de subscrição'
      }
    );

    res.status(201).json({
      success: true,
      message: 'Pagamento criado com sucesso',
      data: {
        transactionId: result.transaction.id,
        paymentId: result.transaction.paymentId,
        referenceCode: result.transaction.referenceCode,
        amount: result.transaction.amount,
        currency: result.transaction.currency,
        paymentMethod: result.transaction.paymentMethod,
        status: result.transaction.status,
        expiresAt: result.transaction.expiresAt,
        instructions: result.paymentData
      }
    });
  } catch (error) {
    console.error('[PaymentController] Error creating payment:', error);
    next(error);
  }
};

/**
 * GET /api/payments/:id/status - Verificar status do pagamento
 */
export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verificar se a transação pertence à organização do usuário
    const transaction = await PaymentTransaction.findOne({
      where: { id, organizationId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transação não encontrada'
      });
    }

    const result = await paymentService.checkAndUpdatePaymentStatus(id);

    res.json({
      success: true,
      data: {
        transactionId: result.transaction.id,
        status: result.transaction.status,
        amount: result.transaction.amount,
        currency: result.transaction.currency,
        paymentMethod: result.transaction.paymentMethod,
        paidAt: result.transaction.paidAt,
        expiresAt: result.transaction.expiresAt
      }
    });
  } catch (error) {
    console.error('[PaymentController] Error checking payment status:', error);
    next(error);
  }
};

/**
 * GET /api/payments/history - Obter histórico de pagamentos
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não está associado a uma organização'
      });
    }

    const filters = {
      status: req.query.status,
      method: req.query.method,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page || 1,
      limit: req.query.limit || 20
    };

    const result = await paymentService.getPaymentHistory(organizationId, filters);

    res.json({
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: filters.limit
      }
    });
  } catch (error) {
    console.error('[PaymentController] Error getting payment history:', error);
    next(error);
  }
};

/**
 * GET /api/payments/:id/receipt - Obter recibo do pagamento
 */
export const getPaymentReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verificar se a transação pertence à organização do usuário
    const transaction = await PaymentTransaction.findOne({
      where: { id, organizationId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transação não encontrada'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Recibo disponível apenas para pagamentos concluídos'
      });
    }

    // Buscar ou gerar recibo
    let receipt = await PaymentReceipt.findOne({
      where: { transactionId: id }
    });

    if (!receipt) {
      const result = await paymentService.generateReceipt(id);
      receipt = result.receipt;
    }

    res.json({
      success: true,
      data: {
        receiptNumber: receipt.receiptNumber,
        transactionId: receipt.transactionId,
        pdfUrl: receipt.pdfUrl,
        data: receipt.data,
        createdAt: receipt.createdAt
      }
    });
  } catch (error) {
    console.error('[PaymentController] Error getting payment receipt:', error);
    next(error);
  }
};

/**
 * POST /api/payments/calculate-upgrade - Calcular valor de upgrade
 */
export const calculateUpgrade = async (req, res, next) => {
  try {
    const { newPlanId } = req.body;
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não está associado a uma organização'
      });
    }

    if (!newPlanId) {
      return res.status(400).json({
        success: false,
        error: 'newPlanId é obrigatório'
      });
    }

    // Buscar subscription da organização
    const { Subscription } = await import('../models/index.js');
    const subscription = await Subscription.findOne({
      where: { organizationId }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription não encontrada'
      });
    }

    const result = await paymentService.calculateProratedAmount(subscription.id, newPlanId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[PaymentController] Error calculating upgrade:', error);
    next(error);
  }
};
