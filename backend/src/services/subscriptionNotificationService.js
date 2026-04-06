import { Subscription, Plan, Organization, OrganizationUser, Notification } from '../modules/models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';
import * as emailService from './emailService.js';

/**
 * Verificar subscrições expirando e criar notificações
 */
export const checkExpiringSubscriptions = async () => {
  try {
    logger.info('🔍 Verificando subscrições expirando...');

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // 1. Verificar trials expirando
    await checkExpiringTrials(now, in7Days, in3Days, in1Day);

    // 2. Verificar subscrições ativas expirando
    await checkExpiringActiveSubscriptions(now, in7Days, in3Days, in1Day);

    // 3. Verificar subscrições já expiradas
    await checkExpiredSubscriptions(now);

    logger.info('✅ Verificação de subscrições concluída');
  } catch (error) {
    logger.error('❌ Erro ao verificar subscrições expirando:', error);
    throw error;
  }
};

/**
 * Verificar trials expirando
 */
const checkExpiringTrials = async (now, in7Days, in3Days, in1Day) => {
  const expiringTrials = await Subscription.findAll({
    where: {
      status: 'trial',
      trialEndsAt: {
        [Op.between]: [now, in7Days]
      }
    },
    include: [
      { model: Organization, as: 'organization' },
      { model: Plan, as: 'plan' }
    ]
  });

  logger.info(`📊 Encontrados ${expiringTrials.length} trials expirando`);

  for (const subscription of expiringTrials) {
    const trialEnd = new Date(subscription.trialEndsAt);
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    // Notificar apenas em marcos específicos: 7, 3, 1 dia
    if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
      await createTrialExpiringNotification(subscription, daysRemaining);
      await sendTrialExpiringEmail(subscription, daysRemaining);
    }
  }
};

/**
 * Verificar subscrições ativas expirando
 */
const checkExpiringActiveSubscriptions = async (now, in7Days, in3Days, in1Day) => {
  const expiringSubscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      currentPeriodEnd: {
        [Op.between]: [now, in7Days]
      }
    },
    include: [
      { model: Organization, as: 'organization' },
      { model: Plan, as: 'plan' }
    ]
  });

  logger.info(`📊 Encontradas ${expiringSubscriptions.length} subscrições ativas expirando`);

  for (const subscription of expiringSubscriptions) {
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));

    // Notificar em marcos específicos: 7, 3, 1 dia
    if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
      await createSubscriptionRenewalNotification(subscription, daysRemaining);
      await sendSubscriptionRenewalEmail(subscription, daysRemaining);
    }
  }
};

/**
 * Verificar subscrições já expiradas
 */
const checkExpiredSubscriptions = async (now) => {
  // Trials expirados
  const expiredTrials = await Subscription.findAll({
    where: {
      status: 'trial',
      trialEndsAt: {
        [Op.lt]: now
      }
    },
    include: [
      { model: Organization, as: 'organization' },
      { model: Plan, as: 'plan' }
    ]
  });

  logger.info(`📊 Encontrados ${expiredTrials.length} trials expirados`);

  for (const subscription of expiredTrials) {
    // Atualizar status para suspended
    await subscription.update({ status: 'suspended' });
    await createTrialExpiredNotification(subscription);
    await sendTrialExpiredEmail(subscription);
  }

  // Subscrições ativas expiradas
  const expiredSubscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      currentPeriodEnd: {
        [Op.lt]: now
      }
    },
    include: [
      { model: Organization, as: 'organization' },
      { model: Plan, as: 'plan' }
    ]
  });

  logger.info(`📊 Encontradas ${expiredSubscriptions.length} subscrições expiradas`);

  for (const subscription of expiredSubscriptions) {
    // Atualizar status para past_due
    await subscription.update({ status: 'past_due' });
    await createSubscriptionExpiredNotification(subscription);
    await sendSubscriptionExpiredEmail(subscription);
  }
};

/**
 * Criar notificação de trial expirando
 */
const createTrialExpiringNotification = async (subscription, daysRemaining) => {
  const admins = await getOrganizationAdmins(subscription.organizationId);

  const priority = daysRemaining <= 3 ? 'high' : 'medium';
  const title = daysRemaining === 1 
    ? 'Trial expira amanhã!' 
    : `Trial expira em ${daysRemaining} dias`;
  const message = `Seu período de trial expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}. Escolha um plano para continuar usando o sistema.`;

  for (const admin of admins) {
    await Notification.create({
      organizationId: subscription.organizationId,
      userId: admin.id,
      type: 'subscription_expiring',
      title,
      message,
      priority,
      data: {
        subscriptionId: subscription.id,
        daysRemaining,
        actionUrl: '/subscription'
      }
    });
  }

  logger.info(`✅ Notificação criada: Trial expirando em ${daysRemaining} dias - ${subscription.organization.name}`);
};

/**
 * Criar notificação de renovação de subscrição
 */
const createSubscriptionRenewalNotification = async (subscription, daysRemaining) => {
  const admins = await getOrganizationAdmins(subscription.organizationId);

  const title = daysRemaining === 1 
    ? 'Renovação amanhã' 
    : `Renovação em ${daysRemaining} dias`;
  const message = `Sua subscrição será renovada em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}. Valor: ${subscription.plan.currency} ${subscription.plan.monthlyPrice}`;

  for (const admin of admins) {
    await Notification.create({
      organizationId: subscription.organizationId,
      userId: admin.id,
      type: 'subscription_renewal',
      title,
      message,
      priority: 'medium',
      data: {
        subscriptionId: subscription.id,
        daysRemaining,
        amount: subscription.plan.monthlyPrice,
        currency: subscription.plan.currency,
        actionUrl: '/subscription'
      }
    });
  }

  logger.info(`✅ Notificação criada: Renovação em ${daysRemaining} dias - ${subscription.organization.name}`);
};

/**
 * Criar notificação de trial expirado
 */
const createTrialExpiredNotification = async (subscription) => {
  const admins = await getOrganizationAdmins(subscription.organizationId);

  for (const admin of admins) {
    await Notification.create({
      organizationId: subscription.organizationId,
      userId: admin.id,
      type: 'subscription_expired',
      title: 'Trial expirado',
      message: 'Seu período de trial expirou. Escolha um plano para continuar usando o sistema.',
      priority: 'high',
      data: {
        subscriptionId: subscription.id,
        actionUrl: '/subscription'
      }
    });
  }

  logger.info(`✅ Notificação criada: Trial expirado - ${subscription.organization.name}`);
};

/**
 * Criar notificação de subscrição expirada
 */
const createSubscriptionExpiredNotification = async (subscription) => {
  const admins = await getOrganizationAdmins(subscription.organizationId);

  for (const admin of admins) {
    await Notification.create({
      organizationId: subscription.organizationId,
      userId: admin.id,
      type: 'subscription_expired',
      title: 'Subscrição expirada',
      message: 'Sua subscrição expirou. Renove para continuar usando o sistema.',
      priority: 'high',
      data: {
        subscriptionId: subscription.id,
        actionUrl: '/subscription'
      }
    });
  }

  logger.info(`✅ Notificação criada: Subscrição expirada - ${subscription.organization.name}`);
};

/**
 * Enviar email de trial expirando
 */
const sendTrialExpiringEmail = async (subscription, daysRemaining) => {
  try {
    const admins = await getOrganizationAdmins(subscription.organizationId);

    for (const admin of admins) {
      await emailService.sendEmail({
        to: admin.email,
        subject: `Trial expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
        template: 'trial-expiring',
        data: {
          userName: admin.name,
          organizationName: subscription.organization.name,
          daysRemaining,
          planName: subscription.plan.displayName,
          actionUrl: `${process.env.FRONTEND_URL}/subscription`
        }
      });
    }

    logger.info(`📧 Email enviado: Trial expirando - ${subscription.organization.name}`);
  } catch (error) {
    logger.error('❌ Erro ao enviar email de trial expirando:', error);
  }
};

/**
 * Enviar email de renovação de subscrição
 */
const sendSubscriptionRenewalEmail = async (subscription, daysRemaining) => {
  try {
    const admins = await getOrganizationAdmins(subscription.organizationId);

    for (const admin of admins) {
      await emailService.sendEmail({
        to: admin.email,
        subject: `Renovação em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
        template: 'subscription-renewal',
        data: {
          userName: admin.name,
          organizationName: subscription.organization.name,
          daysRemaining,
          planName: subscription.plan.displayName,
          amount: subscription.plan.monthlyPrice,
          currency: subscription.plan.currency,
          actionUrl: `${process.env.FRONTEND_URL}/subscription`
        }
      });
    }

    logger.info(`📧 Email enviado: Renovação - ${subscription.organization.name}`);
  } catch (error) {
    logger.error('❌ Erro ao enviar email de renovação:', error);
  }
};

/**
 * Enviar email de trial expirado
 */
const sendTrialExpiredEmail = async (subscription) => {
  try {
    const admins = await getOrganizationAdmins(subscription.organizationId);

    for (const admin of admins) {
      await emailService.sendEmail({
        to: admin.email,
        subject: 'Trial expirado',
        template: 'trial-expired',
        data: {
          userName: admin.name,
          organizationName: subscription.organization.name,
          planName: subscription.plan.displayName,
          actionUrl: `${process.env.FRONTEND_URL}/subscription`
        }
      });
    }

    logger.info(`📧 Email enviado: Trial expirado - ${subscription.organization.name}`);
  } catch (error) {
    logger.error('❌ Erro ao enviar email de trial expirado:', error);
  }
};

/**
 * Enviar email de subscrição expirada
 */
const sendSubscriptionExpiredEmail = async (subscription) => {
  try {
    const admins = await getOrganizationAdmins(subscription.organizationId);

    for (const admin of admins) {
      await emailService.sendEmail({
        to: admin.email,
        subject: 'Subscrição expirada',
        template: 'subscription-expired',
        data: {
          userName: admin.name,
          organizationName: subscription.organization.name,
          planName: subscription.plan.displayName,
          actionUrl: `${process.env.FRONTEND_URL}/subscription`
        }
      });
    }

    logger.info(`📧 Email enviado: Subscrição expirada - ${subscription.organization.name}`);
  } catch (error) {
    logger.error('❌ Erro ao enviar email de subscrição expirada:', error);
  }
};

/**
 * Obter administradores da organização
 */
const getOrganizationAdmins = async (organizationId) => {
  const admins = await OrganizationUser.findAll({
    where: {
      organizationId,
      role: {
        [Op.in]: ['admin', 'org-admin', 'super-admin']
      },
      isActive: true
    },
    attributes: ['id', 'name', 'email']
  });

  return admins;
};

export default {
  checkExpiringSubscriptions
};
