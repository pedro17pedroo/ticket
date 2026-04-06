import { PaymentTransaction, PaymentReceipt, Subscription, Organization, Plan } from '../modules/models/index.js';
import tpagamentoService from './tpagamentoService.js';
import { sendEmail } from '../config/email.js';
import { debug, info, warn, error as logError } from '../utils/debugLogger.js';
import { Op } from 'sequelize';

class PaymentService {
  /**
   * Create a new payment transaction
   */
  async createPaymentTransaction(organizationId, subscriptionId, paymentData) {
    try {
      const { method, amount, customer, description } = paymentData;

      debug('[PaymentService] Creating payment transaction:', {
        organizationId,
        subscriptionId,
        method,
        amount
      });

      // Create payment with TPagamento
      const tpagamentoResponse = await tpagamentoService.createPayment(
        method,
        amount,
        customer,
        description
      );

      if (!tpagamentoResponse.success) {
        throw new Error(tpagamentoResponse.message || 'Erro ao criar pagamento');
      }

      // Calculate expiration date
      let expiresAt = null;
      if (tpagamentoResponse.expiresAt) {
        expiresAt = new Date(tpagamentoResponse.expiresAt);
      } else if (method === 'gpo') {
        expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      } else if (method === 'ref') {
        expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes
      }

      // Determine initial status based on payment method and TPagamento response
      // GPO and E-Kwanza are real-time, REF is pending until manual payment
      let initialStatus = 'pending';
      let paidAt = null;
      
      if (tpagamentoResponse.status === 'paid' || tpagamentoResponse.status === 'completed') {
        initialStatus = 'completed';
        paidAt = new Date();
      } else if (tpagamentoResponse.status === 'failed') {
        initialStatus = 'failed';
      }

      debug('[PaymentService] Payment status from TPagamento:', {
        tpagamentoStatus: tpagamentoResponse.status,
        initialStatus,
        method
      });

      // Store transaction in database
      const transaction = await PaymentTransaction.create({
        organizationId,
        subscriptionId,
        amount,
        currency: 'AOA',
        paymentMethod: method,
        status: initialStatus,
        paidAt,
        paymentId: tpagamentoResponse.paymentId,
        referenceCode: tpagamentoResponse.referenceCode,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        description,
        metadata: tpagamentoResponse.data || {},
        expiresAt,
      });

      debug('[PaymentService] Payment transaction created:', {
        id: transaction.id,
        paymentId: transaction.paymentId,
        referenceCode: transaction.referenceCode,
        status: transaction.status
      });

      // If payment is already completed (real-time methods), process it immediately
      if (initialStatus === 'completed') {
        info('[PaymentService] Processing real-time payment immediately');
        await this.processSuccessfulPayment(transaction);
      }

      return {
        success: true,
        transaction,
        paymentInstructions: {
          method,
          paymentId: transaction.paymentId,
          referenceCode: transaction.referenceCode,
          amount,
          currency: 'AOA',
          expiresAt,
          status: initialStatus
        }
      };
    } catch (error) {
      logError('[PaymentService] Error creating payment transaction:', error);
      throw error;
    }
  }

  /**
   * Check and update payment status
   */
  async checkAndUpdatePaymentStatus(transactionId) {
    try {
      const transaction = await PaymentTransaction.findByPk(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Don't check if already completed or failed
      if (transaction.isCompleted() || transaction.isFailed()) {
        return {
          success: true,
          status: transaction.status,
          transaction
        };
      }

      // Check if expired
      if (transaction.isExpired()) {
        await transaction.update({ status: 'expired' });
        return {
          success: true,
          status: 'expired',
          transaction
        };
      }

      debug('[PaymentService] Checking payment status:', {
        transactionId,
        paymentId: transaction.paymentId,
        method: transaction.paymentMethod
      });

      // Check status with TPagamento
      const statusResponse = await tpagamentoService.getPaymentStatus(
        transaction.paymentMethod,
        transaction.paymentId
      );

      if (!statusResponse.success) {
        warn('[PaymentService] Failed to check payment status:', statusResponse.error);
        return {
          success: false,
          status: transaction.status,
          transaction
        };
      }

      // Update transaction if status changed
      if (statusResponse.status !== transaction.status) {
        const updateData = {
          status: statusResponse.status,
          metadata: {
            ...transaction.metadata,
            lastStatusCheck: new Date(),
            statusResponse: statusResponse.data
          }
        };

        if (statusResponse.status === 'completed' && statusResponse.paidAt) {
          updateData.paidAt = new Date(statusResponse.paidAt);
        }

        await transaction.update(updateData);

        debug('[PaymentService] Payment status updated:', {
          transactionId,
          oldStatus: transaction.status,
          newStatus: statusResponse.status
        });

        // Process successful payment
        if (statusResponse.status === 'completed') {
          await this.processSuccessfulPayment(transaction);
        }
      }

      return {
        success: true,
        status: transaction.status,
        transaction
      };
    } catch (error) {
      logError('[PaymentService] Error checking payment status:', error);
      throw error;
    }
  }

  /**
   * Process successful payment
   */
  async processSuccessfulPayment(transaction) {
    try {
      debug('[PaymentService] Processing successful payment:', {
        transactionId: transaction.id,
        organizationId: transaction.organizationId,
        subscriptionId: transaction.subscriptionId,
        description: transaction.description
      });

      // Update subscription if exists
      if (transaction.subscriptionId) {
        const subscription = await Subscription.findByPk(transaction.subscriptionId);

        if (subscription) {
          const now = new Date();
          const nextPeriodEnd = new Date(now);
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

          const updateData = {
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: nextPeriodEnd,
            lastPaymentDate: transaction.paidAt || now,
            lastPaymentAmount: transaction.amount,
            amount: transaction.amount, // Atualizar valor da subscrição
            // Remover trial se estava em trial
            trialEndsAt: null
          };

          // Se é um upgrade, verificar se precisa atualizar o plano
          // A descrição contém "Upgrade para [Nome do Plano]"
          if (transaction.description && transaction.description.includes('Upgrade para')) {
            // Extrair nome do plano da descrição
            const planName = transaction.description.replace('Upgrade para ', '').trim();
            
            // Buscar plano pelo nome
            const newPlan = await Plan.findOne({
              where: { name: planName }
            });

            if (newPlan) {
              updateData.planId = newPlan.id;
              updateData.amount = newPlan.monthlyPrice;
              
              info('[PaymentService] Upgrading to new plan:', {
                oldPlanId: subscription.planId,
                newPlanId: newPlan.id,
                newPlanName: newPlan.name,
                newAmount: newPlan.monthlyPrice
              });
            } else {
              warn('[PaymentService] New plan not found for upgrade:', {
                planName,
                description: transaction.description
              });
            }
          }

          await subscription.update(updateData);

          info('[PaymentService] Subscription activated:', {
            subscriptionId: subscription.id,
            status: 'active',
            currentPeriodEnd: nextPeriodEnd,
            trialRemoved: subscription.trialEndsAt !== null,
            amount: updateData.amount,
            planId: updateData.planId || subscription.planId
          });
        } else {
          warn('[PaymentService] Subscription not found:', {
            subscriptionId: transaction.subscriptionId
          });
        }
      } else {
        warn('[PaymentService] No subscriptionId in transaction:', {
          transactionId: transaction.id
        });
      }

      // Generate receipt
      await this.generateReceipt(transaction.id);

      // Send confirmation email
      const organization = await Organization.findByPk(transaction.organizationId);
      if (organization) {
        await this.sendPaymentConfirmationEmail(transaction, organization);
      }

      return { success: true };
    } catch (error) {
      logError('[PaymentService] Error processing successful payment:', error);
      throw error;
    }
  }

  /**
   * Generate receipt for payment
   */
  async generateReceipt(transactionId) {
    try {
      const transaction = await PaymentTransaction.findByPk(transactionId, {
        include: [
          { model: Organization, as: 'organization' },
          { model: Subscription, as: 'subscription', include: [{ model: Plan, as: 'plan' }] }
        ]
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check if receipt already exists
      let receipt = await PaymentReceipt.findOne({
        where: { transactionId }
      });

      if (receipt) {
        debug('[PaymentService] Receipt already exists:', receipt.id);
        return receipt;
      }

      // Generate receipt number
      const year = new Date().getFullYear();
      const count = await PaymentReceipt.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(`${year}-01-01`)
          }
        }
      });
      const receiptNumber = `REC-${year}-${String(count + 1).padStart(6, '0')}`;

      // Create receipt
      receipt = await PaymentReceipt.create({
        transactionId,
        receiptNumber,
        // PDF generation would be implemented here
        pdfPath: null,
        pdfUrl: null
      });

      debug('[PaymentService] Receipt generated:', {
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber
      });

      return receipt;
    } catch (error) {
      logError('[PaymentService] Error generating receipt:', error);
      throw error;
    }
  }

  /**
   * Get payment history for organization
   */
  async getPaymentHistory(organizationId, filters = {}) {
    try {
      const { status, method, startDate, endDate, page = 1, limit = 20 } = filters;

      const where = { organizationId };

      if (status) {
        where.status = status;
      }

      if (method) {
        where.paymentMethod = method;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.createdAt[Op.lte] = new Date(endDate);
        }
      }

      const offset = (page - 1) * limit;

      const { count, rows: transactions } = await PaymentTransaction.findAndCountAll({
        where,
        include: [
          { model: Subscription, as: 'subscription', include: [{ model: Plan, as: 'plan' }] },
          { model: PaymentReceipt, as: 'receipt' }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        success: true,
        transactions,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logError('[PaymentService] Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Calculate prorated amount for plan upgrade
   */
  async calculateProratedAmount(subscriptionId, newPlanId) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [{ model: Plan, as: 'plan' }]
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newPlan = await Plan.findByPk(newPlanId);

      if (!newPlan) {
        throw new Error('New plan not found');
      }

      const currentPlan = subscription.plan;
      const now = new Date();
      const periodEnd = subscription.currentPeriodEnd;

      // Calculate remaining days in current period
      const totalDays = Math.ceil((periodEnd - subscription.currentPeriodStart) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));

      // Calculate prorated amounts
      const currentPlanDailyRate = currentPlan.monthlyPrice / totalDays;
      const newPlanDailyRate = newPlan.monthlyPrice / totalDays;

      const currentPlanRemainingValue = currentPlanDailyRate * remainingDays;
      const newPlanRemainingValue = newPlanDailyRate * remainingDays;

      const proratedAmount = Math.max(0, newPlanRemainingValue - currentPlanRemainingValue);

      return {
        success: true,
        proratedAmount: Math.round(proratedAmount * 100) / 100,
        remainingDays,
        currentPlan: {
          name: currentPlan.displayName,
          monthlyPrice: currentPlan.monthlyPrice
        },
        newPlan: {
          name: newPlan.displayName,
          monthlyPrice: newPlan.monthlyPrice
        }
      };
    } catch (error) {
      logError('[PaymentService] Error calculating prorated amount:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(transaction, organization) {
    try {
      const subject = 'Pagamento Confirmado - TatuTicket';
      const html = `
        <h2>Pagamento Confirmado</h2>
        <p>Olá ${transaction.customerName},</p>
        <p>Confirmamos o recebimento do seu pagamento:</p>
        <ul>
          <li><strong>Valor:</strong> Kz ${transaction.amount.toFixed(2)}</li>
          <li><strong>Método:</strong> ${transaction.getMethodName()}</li>
          <li><strong>Referência:</strong> ${transaction.referenceCode}</li>
          <li><strong>Data:</strong> ${transaction.paidAt ? transaction.paidAt.toLocaleString('pt-AO') : 'N/A'}</li>
        </ul>
        <p>Sua subscrição está ativa e você pode continuar usando todos os recursos do TatuTicket.</p>
        <p>Obrigado por escolher o TatuTicket!</p>
      `;

      await sendEmail(transaction.customerEmail, subject, html);

      debug('[PaymentService] Payment confirmation email sent:', {
        to: transaction.customerEmail,
        transactionId: transaction.id
      });
    } catch (error) {
      logError('[PaymentService] Error sending payment confirmation email:', error);
      // Don't throw - email failure shouldn't fail the payment process
    }
  }

  /**
   * Send payment reminder emails
   */
  async sendPaymentReminders() {
    try {
      const now = new Date();
      const reminderDays = [7, 3, 1];

      for (const days of reminderDays) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find subscriptions expiring in X days
        const subscriptions = await Subscription.findAll({
          where: {
            status: 'active',
            currentPeriodEnd: {
              [Op.gte]: targetDate,
              [Op.lt]: nextDay
            }
          },
          include: [
            { model: Organization, as: 'organization' },
            { model: Plan, as: 'plan' }
          ]
        });

        for (const subscription of subscriptions) {
          await this.sendPaymentReminderEmail(subscription, days);
        }

        info(`[PaymentService] Sent ${subscriptions.length} payment reminders for ${days} days`);
      }
    } catch (error) {
      logError('[PaymentService] Error sending payment reminders:', error);
    }
  }

  /**
   * Send individual payment reminder email
   */
  async sendPaymentReminderEmail(subscription, daysRemaining) {
    try {
      const organization = subscription.organization;
      const plan = subscription.plan;

      const subject = `Lembrete: Renovação da Subscrição em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`;
      const html = `
        <h2>Lembrete de Renovação</h2>
        <p>Olá ${organization.name},</p>
        <p>Sua subscrição do plano <strong>${plan.displayName}</strong> expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}.</p>
        <p><strong>Data de expiração:</strong> ${subscription.currentPeriodEnd.toLocaleDateString('pt-AO')}</p>
        <p><strong>Valor da renovação:</strong> Kz ${subscription.amount.toFixed(2)}</p>
        <p>Para renovar sua subscrição, acesse o portal da organização e efetue o pagamento.</p>
        <p>Se você já efetuou o pagamento, desconsidere este email.</p>
        <p>Obrigado por usar o TatuTicket!</p>
      `;

      await sendEmail(organization.email, subject, html);

      debug('[PaymentService] Payment reminder email sent:', {
        organizationId: organization.id,
        daysRemaining
      });
    } catch (error) {
      logError('[PaymentService] Error sending payment reminder email:', error);
    }
  }
}

export default new PaymentService();
