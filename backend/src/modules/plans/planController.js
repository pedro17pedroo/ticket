import { Plan, Subscription, Organization } from '../models/index.js';
import { Op } from 'sequelize';

// Mapeamento de símbolos de moeda
const currencySymbols = {
  EUR: '€',
  USD: '$',
  BRL: 'R$',
  AOA: 'Kz',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥'
};

// GET /api/plans - Listar todos os planos
export const getPlans = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;

    const where = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { displayName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const plans = await Plan.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['monthlyPrice', 'ASC']],
      attributes: {
        include: [
          // Contar organizações usando este plano
          [
            Plan.sequelize.literal(`(
              SELECT COUNT(*)::int 
              FROM subscriptions 
              WHERE subscriptions."plan_id" = "Plan".id
            )`),
            'organizationCount'
          ]
        ]
      }
    });

    const symbol = (currency) => currencySymbols[currency] || currency;

    res.json({
      success: true,
      plans: plans.map(plan => ({
        ...plan.toJSON(),
        price: plan.monthlyPrice,
        priceFormatted: `${symbol(plan.currency)} ${parseFloat(plan.monthlyPrice).toFixed(2)}`,
        currencySymbol: symbol(plan.currency),
        billingCycle: 'month',
        limits: {
          maxUsers: plan.maxUsers,
          maxClients: plan.maxClients,
          maxStorage: plan.maxStorageGB,
          maxTicketsPerMonth: plan.maxTicketsPerMonth
        }
      }))
    });

  } catch (error) {
    console.error('Erro ao listar planos:', error);
    next(error);
  }
};

// GET /api/plans/public - Listar planos ativos (público, para landing page)
export const getPublicPlans = async (req, res, next) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['monthlyPrice', 'ASC']],
      attributes: ['id', 'name', 'displayName', 'description', 'monthlyPrice', 'yearlyPrice', 
                   'currency', 'maxUsers', 'maxClients', 'maxStorageGB', 'maxTicketsPerMonth', 
                   'features', 'featuresText', 'trialDays', 'isDefault']
    });

    // Formatar para exibição na landing page
    const formattedPlans = plans.map((plan, index) => {
      const symbol = currencySymbols[plan.currency] || plan.currency;
      const priceValue = parseFloat(plan.monthlyPrice);
      
      // Usar featuresText se disponível, senão gerar automaticamente
      let features = [];
      if (plan.featuresText && Array.isArray(plan.featuresText) && plan.featuresText.length > 0) {
        features = plan.featuresText;
      } else {
        // Gerar features automaticamente baseado nos limites
        features = [
          plan.maxUsers === -1 ? 'Usuários ilimitados' : `Até ${plan.maxUsers} usuários`,
          plan.maxTicketsPerMonth === null || plan.maxTicketsPerMonth === -1 
            ? 'Tickets ilimitados' 
            : `${plan.maxTicketsPerMonth} tickets/mês`,
          ...getEnabledFeatures(plan.features)
        ];
      }

      return {
        id: plan.id,
        name: plan.displayName,
        planId: plan.name,
        price: priceValue === 0 ? 'Grátis' : (priceValue === -1 ? 'Contacte-nos' : `${symbol}${priceValue}`),
        priceValue: priceValue,
        currency: plan.currency,
        currencySymbol: symbol,
        yearlyPrice: plan.yearlyPrice ? `${symbol}${parseFloat(plan.yearlyPrice)}` : null,
        features: features,
        highlighted: plan.isDefault || index === 1,
        trialDays: plan.trialDays,
        maxUsers: plan.maxUsers,
        maxClients: plan.maxClients,
        maxStorageGB: plan.maxStorageGB,
        maxTicketsPerMonth: plan.maxTicketsPerMonth
      };
    });

    res.json({
      success: true,
      plans: formattedPlans
    });

  } catch (error) {
    console.error('Erro ao listar planos públicos:', error);
    next(error);
  }
};

// Helper para obter features habilitadas
function getEnabledFeatures(features) {
  if (!features || typeof features !== 'object') return [];
  
  const featureLabels = {
    basicTicketing: 'Tickets básicos',
    emailIntegration: 'Integração de email',
    knowledgeBase: 'Base de conhecimento',
    slaManagement: 'Gestão de SLA',
    reporting: 'Relatórios',
    automation: 'Automações',
    apiAccess: 'Acesso à API',
    whiteLabel: 'White-label',
    prioritySupport: 'Suporte prioritário',
    customFields: 'Campos personalizados',
    workflows: 'Workflows',
    integrations: 'Integrações avançadas'
  };

  return Object.entries(features)
    .filter(([key, value]) => value === true && featureLabels[key])
    .map(([key]) => featureLabels[key]);
}

// GET /api/plans/:id - Obter plano por ID
export const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado'
      });
    }

    // Contar organizações usando este plano
    const organizationCount = await Subscription.count({
      where: { planId: id }
    });

    res.json({
      success: true,
      plan: {
        ...plan.toJSON(),
        organizationCount
      }
    });

  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    next(error);
  }
};

// POST /api/plans - Criar novo plano
export const createPlan = async (req, res, next) => {
  try {
    const {
      name,
      displayName,
      description,
      monthlyPrice,
      yearlyPrice,
      currency = 'EUR',
      maxUsers,
      maxClients,
      maxStorageGB,
      maxTicketsPerMonth,
      maxAttachmentSizeMB = 25,
      features = {},
      featuresText = [],
      trialDays = 14,
      isDefault = false,
      sortOrder
    } = req.body;

    // Validações
    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Nome e nome de exibição são obrigatórios'
      });
    }

    // Verificar se nome já existe
    const existing = await Plan.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um plano com este nome'
      });
    }

    // Se este plano for o padrão, remover flag dos outros
    if (isDefault) {
      await Plan.update({ isDefault: false }, { where: {} });
    }

    const plan = await Plan.create({
      name,
      displayName,
      description,
      monthlyPrice: monthlyPrice || 0,
      yearlyPrice: yearlyPrice || (monthlyPrice ? monthlyPrice * 10 : 0),
      currency,
      maxUsers: maxUsers || 10,
      maxClients: maxClients || 50,
      maxStorageGB: maxStorageGB || 5,
      maxTicketsPerMonth: maxTicketsPerMonth || 500,
      maxAttachmentSizeMB,
      features,
      featuresText,
      trialDays,
      isDefault,
      isActive: true,
      sortOrder: sortOrder || 0
    });

    console.log(`✅ Plano criado: ${plan.displayName}`);

    res.status(201).json({
      success: true,
      message: 'Plano criado com sucesso',
      plan
    });

  } catch (error) {
    console.error('Erro ao criar plano:', error);
    next(error);
  }
};

// PUT /api/plans/:id - Atualizar plano
export const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado'
      });
    }

    // Se este plano for o padrão, remover flag dos outros
    if (updates.isDefault) {
      await Plan.update({ isDefault: false }, { where: { id: { [Op.ne]: id } } });
    }

    await plan.update(updates);

    console.log(`✅ Plano atualizado: ${plan.displayName}`);

    res.json({
      success: true,
      message: 'Plano atualizado com sucesso',
      plan
    });

  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    next(error);
  }
};

// DELETE /api/plans/:id - Deletar plano (soft delete - desativar)
export const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado'
      });
    }

    // Verificar se há organizações usando este plano
    const subscriptionCount = await Subscription.count({
      where: { planId: id }
    });

    if (subscriptionCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Não é possível excluir este plano. ${subscriptionCount} organização(ões) estão usando-o.`
      });
    }

    await plan.destroy();

    console.log(`✅ Plano excluído: ${plan.displayName}`);

    res.json({
      success: true,
      message: 'Plano excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir plano:', error);
    next(error);
  }
};

// PUT /api/plans/:id/activate - Ativar plano
export const activatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado'
      });
    }

    await plan.update({ isActive: true });

    res.json({
      success: true,
      message: 'Plano ativado com sucesso',
      plan
    });

  } catch (error) {
    console.error('Erro ao ativar plano:', error);
    next(error);
  }
};

// PUT /api/plans/:id/deactivate - Desativar plano
export const deactivatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado'
      });
    }

    // Verificar se há organizações usando este plano
    const subscriptionCount = await Subscription.count({
      where: { planId: id, status: { [Op.in]: ['active', 'trial'] } }
    });

    if (subscriptionCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Não é possível desativar este plano. ${subscriptionCount} organização(ões) ativas estão usando-o.`
      });
    }

    await plan.update({ isActive: false });

    res.json({
      success: true,
      message: 'Plano desativado com sucesso',
      plan
    });

  } catch (error) {
    console.error('Erro ao desativar plano:', error);
    next(error);
  }
};

// GET /api/plans/:id/subscriptions - Listar assinaturas do plano
export const getPlanSubscriptions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const where = { planId: id };
    if (status) {
      where.status = status;
    }

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where,
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'slug', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      subscriptions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar assinaturas:', error);
    next(error);
  }
};


