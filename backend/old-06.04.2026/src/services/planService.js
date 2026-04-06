import { Plan, Subscription, Organization, OrganizationUser, Client, Ticket } from '../modules/models/index.js';
import { Op } from 'sequelize';

class PlanService {
  /**
   * Buscar plano ativo por nome
   */
  static async getPlanByName(name) {
    return await Plan.findOne({
      where: { 
        name, 
        isActive: true 
      }
    });
  }

  /**
   * Buscar todos os planos ativos
   */
  static async getActivePlans() {
    return await Plan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']]
    });
  }

  /**
   * Buscar subscription de uma organização
   */
  static async getOrganizationSubscription(organizationId) {
    return await Subscription.findOne({
      where: { organizationId },
      include: [{
        model: Plan,
        as: 'plan'
      }]
    });
  }

  /**
   * Verificar se organização pode adicionar mais usuários
   */
  static async canAddUsers(organizationId, quantityToAdd = 1) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription) return { allowed: false, reason: 'Subscription não encontrada' };

    const currentUsers = await OrganizationUser.count({
      where: { organizationId, isActive: true }
    });

    const newTotal = currentUsers + quantityToAdd;
    
    if (newTotal > subscription.plan.maxUsers) {
      return {
        allowed: false,
        reason: `Limite de usuários excedido. Plano ${subscription.plan.displayName} permite ${subscription.plan.maxUsers} usuários, você tem ${currentUsers} e está tentando adicionar ${quantityToAdd}.`,
        current: currentUsers,
        limit: subscription.plan.maxUsers,
        plan: subscription.plan.displayName
      };
    }

    return { allowed: true };
  }

  /**
   * Verificar se organização pode adicionar mais clientes
   */
  static async canAddClients(organizationId, quantityToAdd = 1) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription) return { allowed: false, reason: 'Subscription não encontrada' };

    const currentClients = await Client.count({
      where: { organizationId, isActive: true }
    });

    const newTotal = currentClients + quantityToAdd;
    
    if (newTotal > subscription.plan.maxClients) {
      return {
        allowed: false,
        reason: `Limite de clientes excedido. Plano ${subscription.plan.displayName} permite ${subscription.plan.maxClients} clientes, você tem ${currentClients} e está tentando adicionar ${quantityToAdd}.`,
        current: currentClients,
        limit: subscription.plan.maxClients,
        plan: subscription.plan.displayName
      };
    }

    return { allowed: true };
  }

  /**
   * Verificar limite de tickets no mês atual
   */
  static async canCreateTickets(organizationId, quantityToAdd = 1) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription || !subscription.plan.maxTicketsPerMonth) {
      return { allowed: true }; // Sem limite ou ilimitado
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const currentTickets = await Ticket.count({
      where: { 
        organizationId,
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    const newTotal = currentTickets + quantityToAdd;
    
    if (newTotal > subscription.plan.maxTicketsPerMonth) {
      return {
        allowed: false,
        reason: `Limite de tickets mensais excedido. Plano ${subscription.plan.displayName} permite ${subscription.plan.maxTicketsPerMonth} tickets por mês, você criou ${currentTickets} este mês.`,
        current: currentTickets,
        limit: subscription.plan.maxTicketsPerMonth,
        plan: subscription.plan.displayName
      };
    }

    return { allowed: true };
  }

  /**
   * Verificar se uma feature está habilitada no plano
   */
  static async hasFeature(organizationId, featureName) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription) return false;

    return subscription.plan.features[featureName] === true;
  }

  /**
   * Atualizar uso atual da organização
   */
  static async updateCurrentUsage(organizationId) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription) return null;

    // Contar usuários ativos
    const users = await OrganizationUser.count({
      where: { organizationId, isActive: true }
    });

    // Contar clientes ativos
    const clients = await Client.count({
      where: { organizationId, isActive: true }
    });

    // Contar tickets do mês atual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const ticketsThisMonth = await Ticket.count({
      where: { 
        organizationId,
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    // Atualizar subscription
    const updatedUsage = {
      users,
      clients,
      ticketsThisMonth,
      storageUsedGB: subscription.currentUsage.storageUsedGB || 0 // Manter valor atual
    };

    await subscription.update({ currentUsage: updatedUsage });
    
    return updatedUsage;
  }

  /**
   * Verificar se subscription está em trial
   */
  static async isInTrial(organizationId) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription) return false;

    return subscription.status === 'trial' && 
           subscription.trialEndsAt && 
           subscription.trialEndsAt > new Date();
  }

  /**
   * Verificar quantos dias restam no trial
   */
  static async getTrialDaysRemaining(organizationId) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription || subscription.status !== 'trial' || !subscription.trialEndsAt) {
      return 0;
    }

    const now = new Date();
    const trialEnd = subscription.trialEndsAt;
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Buscar resumo completo do plano da organização
   */
  static async getOrganizationPlanSummary(organizationId) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    if (!subscription) return null;

    const currentUsage = await this.updateCurrentUsage(organizationId);
    const trialDaysRemaining = await this.getTrialDaysRemaining(organizationId);
    const isInTrial = await this.isInTrial(organizationId);

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        isInTrial,
        trialDaysRemaining,
        trialEndsAt: subscription.trialEndsAt,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        currency: subscription.currency
      },
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        displayName: subscription.plan.displayName,
        description: subscription.plan.description,
        limits: {
          maxUsers: subscription.plan.maxUsers,
          maxClients: subscription.plan.maxClients,
          maxTicketsPerMonth: subscription.plan.maxTicketsPerMonth,
          maxStorageGB: subscription.plan.maxStorageGB,
          maxAttachmentSizeMB: subscription.plan.maxAttachmentSizeMB
        },
        features: subscription.plan.features
      },
      usage: {
        current: currentUsage,
        percentages: {
          users: Math.round((currentUsage.users / subscription.plan.maxUsers) * 100),
          clients: Math.round((currentUsage.clients / subscription.plan.maxClients) * 100),
          tickets: subscription.plan.maxTicketsPerMonth 
            ? Math.round((currentUsage.ticketsThisMonth / subscription.plan.maxTicketsPerMonth) * 100)
            : 0
        }
      }
    };
  }
}

export default PlanService;
