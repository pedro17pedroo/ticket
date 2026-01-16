import { Subscription, Plan, Organization } from '../models/index.js';
import { Op } from 'sequelize';

// Mapeamento de símbolos de moeda
const currencySymbols = {
  EUR: '€', USD: '$', BRL: 'R$', AOA: 'Kz', GBP: '£', CHF: 'CHF'
};

// GET /api/subscriptions - Listar todas as subscrições
export const getSubscriptions = async (req, res, next) => {
  try {
    const { status, planId, search, page = 1, limit = 20 } = req.query;

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (planId) {
      where.planId = planId;
    }

    const offset = (page - 1) * limit;

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'email', 'isActive'],
          where: search ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } }
            ]
          } : undefined
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'name', 'displayName', 'monthlyPrice', 'currency']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedSubscriptions = subscriptions.map(sub => {
      const symbol = currencySymbols[sub.plan?.currency] || '€';
      return {
        ...sub.toJSON(),
        planFormatted: sub.plan?.displayName || sub.plan?.name,
        priceFormatted: sub.plan ? `${symbol}${parseFloat(sub.plan.monthlyPrice).toFixed(2)}` : 'N/A'
      };
    });

    res.json({
      success: true,
      subscriptions: formattedSubscriptions,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Erro ao listar subscrições:', error);
    next(error);
  }
};

// GET /api/subscriptions/pending - Listar subscrições pendentes de aprovação
export const getPendingSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where: {
        status: { [Op.in]: ['trial', 'past_due'] }
      },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'email']
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'name', 'displayName', 'monthlyPrice', 'currency']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      subscriptions,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/subscriptions/:id - Obter subscrição por ID
export const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug', 'email', 'phone', 'isActive']
        },
        {
          model: Plan,
          as: 'plan'
        }
      ]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscrição não encontrada'
      });
    }

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subscriptions/:id/plan - Alterar plano da subscrição
export const changePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { planId, reason } = req.body;

    const subscription = await Subscription.findByPk(id, {
      include: [{ model: Plan, as: 'plan' }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscrição não encontrada'
      });
    }

    const newPlan = await Plan.findByPk(planId);
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado'
      });
    }

    const oldPlanName = subscription.plan?.displayName || subscription.plan?.name;

    await subscription.update({
      planId,
      // Atualizar limites baseado no novo plano
      currentUsage: {
        ...subscription.currentUsage,
        maxUsers: newPlan.maxUsers,
        maxClients: newPlan.maxClients,
        maxStorageGB: newPlan.maxStorageGB,
        maxTicketsPerMonth: newPlan.maxTicketsPerMonth
      }
    });

    console.log(`✅ Plano alterado: ${oldPlanName} → ${newPlan.displayName} (Motivo: ${reason || 'N/A'})`);

    res.json({
      success: true,
      message: `Plano alterado de ${oldPlanName} para ${newPlan.displayName}`,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subscriptions/:id/approve - Aprovar subscrição (pagamento manual)
export const approveSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentReference, notes } = req.body;

    const subscription = await Subscription.findByPk(id, {
      include: [
        { model: Organization, as: 'organization' },
        { model: Plan, as: 'plan' }
      ]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscrição não encontrada'
      });
    }

    // Calcular próximo período
    const now = new Date();
    const nextPeriodEnd = new Date(now);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

    await subscription.update({
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: nextPeriodEnd,
      paymentMethod: 'manual',
      paymentReference,
      approvedAt: now,
      approvedBy: req.user.id,
      notes: notes || subscription.notes
    });

    console.log(`✅ Subscrição aprovada: ${subscription.organization?.name} - ${subscription.plan?.displayName}`);

    res.json({
      success: true,
      message: 'Subscrição aprovada com sucesso',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subscriptions/:id/reject - Rejeitar subscrição
export const rejectSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscrição não encontrada'
      });
    }

    await subscription.update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: req.user.id,
      rejectionReason: reason
    });

    res.json({
      success: true,
      message: 'Subscrição rejeitada',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subscriptions/:id/cancel - Cancelar subscrição
export const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, immediate = false } = req.body;

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscrição não encontrada'
      });
    }

    if (immediate) {
      await subscription.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      });
    } else {
      // Cancelar no fim do período atual
      await subscription.update({
        cancelAtPeriodEnd: true,
        cancellationReason: reason
      });
    }

    res.json({
      success: true,
      message: immediate ? 'Subscrição cancelada imediatamente' : 'Subscrição será cancelada no fim do período',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subscriptions/:id/reactivate - Reativar subscrição cancelada
export const reactivateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscrição não encontrada'
      });
    }

    await subscription.update({
      status: 'active',
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      cancellationReason: null
    });

    res.json({
      success: true,
      message: 'Subscrição reativada com sucesso',
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subscriptions/:id/extend-trial - Estender período de trial
export const extendTrial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days } = req.body;

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscrição não encontrada'
      });
    }

    if (subscription.status !== 'trial') {
      return res.status(400).json({
        success: false,
        error: 'Apenas subscrições em trial podem ser estendidas'
      });
    }

    const newTrialEnd = new Date(subscription.trialEndsAt);
    newTrialEnd.setDate(newTrialEnd.getDate() + (days || 7));

    await subscription.update({
      trialEndsAt: newTrialEnd
    });

    res.json({
      success: true,
      message: `Trial estendido por ${days || 7} dias`,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/subscriptions/stats - Estatísticas de subscrições
export const getSubscriptionStats = async (req, res, next) => {
  try {
    const stats = {
      total: await Subscription.count(),
      byStatus: {
        active: await Subscription.count({ where: { status: 'active' } }),
        trial: await Subscription.count({ where: { status: 'trial' } }),
        past_due: await Subscription.count({ where: { status: 'past_due' } }),
        cancelled: await Subscription.count({ where: { status: 'cancelled' } }),
        suspended: await Subscription.count({ where: { status: 'suspended' } })
      },
      trialsEndingSoon: await Subscription.count({
        where: {
          status: 'trial',
          trialEndsAt: {
            [Op.between]: [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
          }
        }
      })
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};
