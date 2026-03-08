import crypto from 'crypto';
import { Op } from 'sequelize';
import PaymentTransaction from '../../models/PaymentTransaction.js';
import paymentService from '../../services/paymentService.js';

/**
 * POST /api/webhooks/tpagamento - Receber webhooks do TPagamento
 */
export const handleTPagamentoWebhook = async (req, res) => {
  try {
    console.log('[Webhook] Received TPagamento webhook:', req.body);

    // Validar assinatura do webhook
    const signature = req.headers['x-webhook-signature'];
    const webhookSecret = process.env.TPAGAMENTO_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[Webhook] Invalid signature');
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }
    }

    const { event, data } = req.body;

    // Processar evento
    switch (event) {
      case 'payment.completed':
        await handlePaymentCompleted(data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(data);
        break;

      case 'payment.expired':
        await handlePaymentExpired(data);
        break;

      default:
        console.log(`[Webhook] Unknown event type: ${event}`);
    }

    // Sempre retornar 200 para o webhook
    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    
    // Mesmo com erro, retornar 200 para evitar reenvios
    res.status(200).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Processar pagamento concluído
 */
async function handlePaymentCompleted(data) {
  try {
    console.log('[Webhook] Processing payment.completed:', data);

    const { id: paymentId, reference, amount, paidAt } = data;

    // Buscar transação pelo paymentId ou referenceCode
    const transaction = await PaymentTransaction.findOne({
      where: {
        [Op.or]: [
          { paymentId },
          { referenceCode: reference }
        ]
      }
    });

    if (!transaction) {
      console.error(`[Webhook] Transaction not found for paymentId: ${paymentId}, reference: ${reference}`);
      return;
    }

    // Atualizar status
    await transaction.update({
      status: 'completed',
      paidAt: paidAt || new Date()
    });

    console.log(`[Webhook] Transaction ${transaction.id} marked as completed`);

    // Processar pagamento bem-sucedido
    await paymentService.processSuccessfulPayment(transaction);

    console.log(`[Webhook] Payment ${transaction.id} processed successfully`);
  } catch (error) {
    console.error('[Webhook] Error handling payment.completed:', error);
    throw error;
  }
}

/**
 * Processar pagamento falhado
 */
async function handlePaymentFailed(data) {
  try {
    console.log('[Webhook] Processing payment.failed:', data);

    const { id: paymentId, reference, reason } = data;

    // Buscar transação
    const transaction = await PaymentTransaction.findOne({
      where: {
        [Op.or]: [
          { paymentId },
          { referenceCode: reference }
        ]
      }
    });

    if (!transaction) {
      console.error(`[Webhook] Transaction not found for paymentId: ${paymentId}, reference: ${reference}`);
      return;
    }

    // Atualizar status
    await transaction.update({
      status: 'failed',
      failureReason: reason || 'Pagamento falhou'
    });

    console.log(`[Webhook] Transaction ${transaction.id} marked as failed`);

    // TODO: Enviar notificação ao usuário
  } catch (error) {
    console.error('[Webhook] Error handling payment.failed:', error);
    throw error;
  }
}

/**
 * Processar pagamento expirado
 */
async function handlePaymentExpired(data) {
  try {
    console.log('[Webhook] Processing payment.expired:', data);

    const { id: paymentId, reference } = data;

    // Buscar transação
    const transaction = await PaymentTransaction.findOne({
      where: {
        [Op.or]: [
          { paymentId },
          { referenceCode: reference }
        ]
      }
    });

    if (!transaction) {
      console.error(`[Webhook] Transaction not found for paymentId: ${paymentId}, reference: ${reference}`);
      return;
    }

    // Atualizar status
    await transaction.update({
      status: 'expired'
    });

    console.log(`[Webhook] Transaction ${transaction.id} marked as expired`);

    // TODO: Enviar notificação ao usuário
  } catch (error) {
    console.error('[Webhook] Error handling payment.expired:', error);
    throw error;
  }
}
