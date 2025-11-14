import PlanService from '../services/planService.js';

/**
 * Middleware para verificar limites de usuários antes de criar/ativar
 */
export const checkUserLimit = (quantityField = null) => {
  return async (req, res, next) => {
    try {
      const organizationId = req.user?.organizationId || req.body?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID não encontrado'
        });
      }

      const quantity = quantityField ? req.body[quantityField] || 1 : 1;
      const result = await PlanService.canAddUsers(organizationId, quantity);

      if (!result.allowed) {
        return res.status(402).json({
          success: false,
          error: 'Limite de plano excedido',
          details: {
            type: 'user_limit',
            message: result.reason,
            current: result.current,
            limit: result.limit,
            plan: result.plan
          }
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar limite de usuários:', error);
      next(error);
    }
  };
};

/**
 * Middleware para verificar limites de clientes antes de criar
 */
export const checkClientLimit = (quantityField = null) => {
  return async (req, res, next) => {
    try {
      const organizationId = req.user?.organizationId || req.body?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID não encontrado'
        });
      }

      const quantity = quantityField ? req.body[quantityField] || 1 : 1;
      const result = await PlanService.canAddClients(organizationId, quantity);

      if (!result.allowed) {
        return res.status(402).json({
          success: false,
          error: 'Limite de plano excedido',
          details: {
            type: 'client_limit',
            message: result.reason,
            current: result.current,
            limit: result.limit,
            plan: result.plan
          }
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar limite de clientes:', error);
      next(error);
    }
  };
};

/**
 * Middleware para verificar limites de tickets antes de criar
 */
export const checkTicketLimit = (quantityField = null) => {
  return async (req, res, next) => {
    try {
      const organizationId = req.user?.organizationId || req.body?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID não encontrado'
        });
      }

      const quantity = quantityField ? req.body[quantityField] || 1 : 1;
      const result = await PlanService.canCreateTickets(organizationId, quantity);

      if (!result.allowed) {
        return res.status(402).json({
          success: false,
          error: 'Limite de plano excedido',
          details: {
            type: 'ticket_limit',
            message: result.reason,
            current: result.current,
            limit: result.limit,
            plan: result.plan
          }
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar limite de tickets:', error);
      next(error);
    }
  };
};

/**
 * Middleware para verificar se uma feature está habilitada no plano
 */
export const checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const organizationId = req.user?.organizationId || req.body?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID não encontrado'
        });
      }

      const hasFeature = await PlanService.hasFeature(organizationId, featureName);

      if (!hasFeature) {
        return res.status(403).json({
          success: false,
          error: 'Feature não disponível no seu plano',
          details: {
            type: 'feature_unavailable',
            feature: featureName,
            message: `A feature "${featureName}" não está disponível no seu plano atual. Considere fazer upgrade.`
          }
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar feature do plano:', error);
      next(error);
    }
  };
};

/**
 * Middleware para verificar status da subscription (ativa ou trial)
 */
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId || req.body?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID não encontrado'
      });
    }

    const subscription = await PlanService.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      return res.status(402).json({
        success: false,
        error: 'Nenhuma subscription ativa encontrada',
        details: {
          type: 'no_subscription',
          message: 'Esta organização não possui uma subscription ativa.'
        }
      });
    }

    // Verificar se subscription está suspensa ou cancelada
    if (['cancelled', 'suspended'].includes(subscription.status)) {
      return res.status(402).json({
        success: false,
        error: 'Subscription inativa',
        details: {
          type: 'subscription_inactive',
          status: subscription.status,
          message: subscription.status === 'cancelled' 
            ? 'Sua subscription foi cancelada. Entre em contato para reativar.'
            : 'Sua subscription está suspensa. Verifique seu método de pagamento.'
        }
      });
    }

    // Se está em trial e expirou
    if (subscription.status === 'trial' && subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
      return res.status(402).json({
        success: false,
        error: 'Trial expirado',
        details: {
          type: 'trial_expired',
          message: 'Seu período de trial expirou. Por favor, escolha um plano para continuar.'
        }
      });
    }

    // Adicionar info da subscription ao request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Erro ao verificar status da subscription:', error);
    next(error);
  }
};

/**
 * Middleware para injetar informações do plano na resposta
 */
export const injectPlanInfo = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId || req.body?.organizationId;
    
    if (organizationId) {
      const planSummary = await PlanService.getOrganizationPlanSummary(organizationId);
      req.planSummary = planSummary;
    }

    next();
  } catch (error) {
    console.error('Erro ao injetar informações do plano:', error);
    // Não falhar a request, apenas continuar sem as informações do plano
    next();
  }
};
