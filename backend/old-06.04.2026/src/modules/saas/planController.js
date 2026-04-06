import PlanService from '../../services/planService.js';
import { Plan, Subscription } from '../models/index.js';

/**
 * GET /api/plans - Listar todos os planos disponíveis
 */
export const getAvailablePlans = async (req, res, next) => {
  try {
    const plans = await PlanService.getActivePlans();
    
    const plansList = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      trialDays: plan.trialDays,
      isDefault: plan.isDefault,
      limits: {
        maxUsers: plan.maxUsers,
        maxClients: plan.maxClients,
        maxTicketsPerMonth: plan.maxTicketsPerMonth,
        maxStorageGB: plan.maxStorageGB,
        maxAttachmentSizeMB: plan.maxAttachmentSizeMB
      },
      features: plan.features
    }));

    res.json({
      success: true,
      data: plansList
    });

  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    next(error);
  }
};

/**
 * GET /api/subscription - Obter subscription da organização do usuário
 */
export const getMySubscription = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não está associado a uma organização'
      });
    }

    const planSummary = await PlanService.getOrganizationPlanSummary(organizationId);
    
    if (!planSummary) {
      return res.status(404).json({
        success: false,
        error: 'Subscription não encontrada'
      });
    }

    res.json({
      success: true,
      data: planSummary
    });

  } catch (error) {
    console.error('Erro ao buscar subscription:', error);
    next(error);
  }
};

/**
 * GET /api/subscription/:organizationId - Obter subscription de uma organização específica (admin)
 */
export const getOrganizationSubscription = async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    // Verificar se o usuário é admin global ou da organização
    if (req.user.role !== 'super-admin' && req.user.organizationId !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const planSummary = await PlanService.getOrganizationPlanSummary(organizationId);
    
    if (!planSummary) {
      return res.status(404).json({
        success: false,
        error: 'Subscription não encontrada'
      });
    }

    res.json({
      success: true,
      data: planSummary
    });

  } catch (error) {
    console.error('Erro ao buscar subscription da organização:', error);
    next(error);
  }
};

/**
 * POST /api/subscription/upgrade - Solicitar upgrade de plano
 */
export const requestPlanUpgrade = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { planName, billingCycle = 'monthly' } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não está associado a uma organização'
      });
    }

    // Buscar plano solicitado
    const newPlan = await PlanService.getPlanByName(planName);
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado'
      });
    }

    // Buscar subscription atual
    const currentSubscription = await PlanService.getOrganizationSubscription(organizationId);
    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription atual não encontrada'
      });
    }

    // Verificar se é realmente um upgrade
    const currentPlan = currentSubscription.plan;
    if (newPlan.monthlyPrice <= currentPlan.monthlyPrice) {
      return res.status(400).json({
        success: false,
        error: 'O plano solicitado não é um upgrade válido'
      });
    }

    // Calcular preço baseado no ciclo
    const amount = billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice;

    // TODO: Aqui você integraria com Stripe ou outro processador de pagamento
    
    // Por agora, vamos simular uma solicitação de upgrade
    res.json({
      success: true,
      message: 'Solicitação de upgrade recebida',
      data: {
        currentPlan: {
          name: currentPlan.name,
          displayName: currentPlan.displayName,
          monthlyPrice: currentPlan.monthlyPrice
        },
        requestedPlan: {
          name: newPlan.name,
          displayName: newPlan.displayName,
          monthlyPrice: newPlan.monthlyPrice,
          yearlyPrice: newPlan.yearlyPrice
        },
        billingCycle,
        amount,
        currency: 'EUR',
        // Em produção, você retornaria uma URL de checkout do Stripe
        checkoutUrl: `${process.env.FRONTEND_URL}/checkout?plan=${planName}&cycle=${billingCycle}`
      }
    });

  } catch (error) {
    console.error('Erro ao solicitar upgrade:', error);
    next(error);
  }
};

/**
 * POST /api/subscription/usage/update - Atualizar uso atual da organização
 */
export const updateUsageStats = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não está associado a uma organização'
      });
    }

    const updatedUsage = await PlanService.updateCurrentUsage(organizationId);
    
    if (!updatedUsage) {
      return res.status(404).json({
        success: false,
        error: 'Subscription não encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        usage: updatedUsage,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar estatísticas de uso:', error);
    next(error);
  }
};

/**
 * GET /api/subscription/limits-check - Verificar limites atuais sem fazer ação
 */
export const checkCurrentLimits = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não está associado a uma organização'
      });
    }

    // Verificar todos os limites
    const [userLimitCheck, clientLimitCheck, ticketLimitCheck] = await Promise.all([
      PlanService.canAddUsers(organizationId, 1),
      PlanService.canAddClients(organizationId, 1),
      PlanService.canCreateTickets(organizationId, 1)
    ]);

    const trialDaysRemaining = await PlanService.getTrialDaysRemaining(organizationId);
    const isInTrial = await PlanService.isInTrial(organizationId);

    res.json({
      success: true,
      data: {
        limits: {
          users: userLimitCheck,
          clients: clientLimitCheck,
          tickets: ticketLimitCheck
        },
        trial: {
          isInTrial,
          daysRemaining: trialDaysRemaining
        }
      }
    });

  } catch (error) {
    console.error('Erro ao verificar limites:', error);
    next(error);
  }
};
