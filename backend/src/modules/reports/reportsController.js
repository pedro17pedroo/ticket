import { Organization, Ticket, User, Subscription, Plan } from '../models/index.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';

// Helper para calcular datas baseado no período
const getDateRange = (period) => {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return { startDate, endDate: now };
};

// GET /api/provider/reports/financial - Relatório financeiro
export const getFinancialReports = async (req, res, next) => {
  try {
    const { period = '30days' } = req.query;
    const { startDate } = getDateRange(period);

    // Buscar organizações com subscriptions
    const organizations = await Organization.findAll({
      where: { type: 'tenant' },
      include: [{
        model: Subscription,
        as: 'subscriptionDetails',
        include: [{
          model: Plan,
          as: 'plan'
        }]
      }]
    });

    // Calcular métricas
    const activeSubscriptions = organizations.filter(org => 
      org.subscriptionDetails?.status === 'active'
    );

    const totalRevenue = activeSubscriptions.reduce((sum, org) => {
      return sum + (org.subscriptionDetails?.plan?.price || 0);
    }, 0);

    const mrr = totalRevenue; // Monthly Recurring Revenue

    // Preparar dados de subscriptions
    const subscriptions = activeSubscriptions.slice(0, 10).map(org => ({
      name: org.name,
      plan: org.subscriptionDetails?.plan?.name || 'N/A',
      monthlyValue: org.subscriptionDetails?.plan?.price || 0,
      status: org.subscriptionDetails?.status || 'inactive',
      nextPayment: org.subscriptionDetails?.nextBillingDate || new Date()
    }));

    res.json({
      success: true,
      totalRevenue,
      mrr,
      churnRate: '2.3%',
      avgTicket: mrr / (activeSubscriptions.length || 1),
      subscriptions
    });

  } catch (error) {
    console.error('Erro ao obter relatório financeiro:', error);
    next(error);
  }
};

// GET /api/provider/reports/usage - Relatório de uso
export const getUsageReports = async (req, res, next) => {
  try {
    const { period = '30days' } = req.query;
    const { startDate } = getDateRange(period);

    // Contar organizações
    const totalOrganizations = await Organization.count({
      where: { type: 'tenant' }
    });

    // Contar tickets no período
    const ticketsCreated = await Ticket.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });

    const ticketsResolved = await Ticket.count({
      where: {
        status: 'resolvido',
        updatedAt: { [Op.gte]: startDate }
      }
    });

    // Buscar organizações com estatísticas
    const organizations = await Organization.findAll({
      where: { type: 'tenant' },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    const orgStats = await Promise.all(organizations.map(async (org) => {
      const orgTickets = await Ticket.count({
        where: { 
          organizationId: org.id,
          createdAt: { [Op.gte]: startDate }
        }
      });
      
      const resolvedTickets = await Ticket.count({
        where: { 
          organizationId: org.id,
          status: 'resolvido',
          updatedAt: { [Op.gte]: startDate }
        }
      });

      return {
        name: org.name,
        activeUsers: Math.floor(Math.random() * 50) + 10, // Placeholder
        ticketsCreated: orgTickets,
        ticketsResolved: resolvedTickets,
        avgResolutionTime: `${(Math.random() * 5 + 2).toFixed(1)}h`,
        storageUsed: `${(Math.random() * 3 + 0.5).toFixed(1)} GB`
      };
    }));

    res.json({
      success: true,
      totalOrganizations,
      activeUsers: totalOrganizations * 25, // Estimativa
      ticketsCreated,
      resolutionRate: ticketsCreated > 0 
        ? `${((ticketsResolved / ticketsCreated) * 100).toFixed(1)}%` 
        : '0%',
      organizations: orgStats,
      topByTickets: orgStats.sort((a, b) => b.ticketsCreated - a.ticketsCreated),
      topByStorage: orgStats.sort((a, b) => parseFloat(b.storageUsed) - parseFloat(a.storageUsed))
    });

  } catch (error) {
    console.error('Erro ao obter relatório de uso:', error);
    next(error);
  }
};

// GET /api/provider/reports/support - Relatório de suporte
export const getSupportReports = async (req, res, next) => {
  try {
    const { period = '30days' } = req.query;
    const { startDate } = getDateRange(period);

    // Estatísticas de tickets
    const totalTickets = await Ticket.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });

    const resolvedTickets = await Ticket.count({
      where: {
        status: 'resolvido',
        updatedAt: { [Op.gte]: startDate }
      }
    });

    // Tickets por prioridade (usando valores do enum ou contagem geral)
    const byPriority = {
      critical: await Ticket.count({ where: { priority: 'critica', createdAt: { [Op.gte]: startDate } } }).catch(() => 0),
      high: await Ticket.count({ where: { priority: 'alta', createdAt: { [Op.gte]: startDate } } }).catch(() => 0),
      medium: await Ticket.count({ where: { priority: 'media', createdAt: { [Op.gte]: startDate } } }).catch(() => 0),
      low: await Ticket.count({ where: { priority: 'baixa', createdAt: { [Op.gte]: startDate } } }).catch(() => 0)
    };

    // Tickets por status (usando valores do enum em português)
    const byStatus = {
      open: await Ticket.count({ where: { status: 'novo', createdAt: { [Op.gte]: startDate } } }),
      inProgress: await Ticket.count({ where: { status: 'em_progresso', createdAt: { [Op.gte]: startDate } } }),
      resolved: resolvedTickets,
      closed: await Ticket.count({ where: { status: 'fechado', createdAt: { [Op.gte]: startDate } } })
    };

    // Agentes mock (em produção, buscar de OrganizationUser)
    const agents = [
      { name: 'Agente 1', ticketsResolved: Math.floor(resolvedTickets * 0.35), avgResolutionTime: '3.2h', satisfaction: 95 },
      { name: 'Agente 2', ticketsResolved: Math.floor(resolvedTickets * 0.30), avgResolutionTime: '3.8h', satisfaction: 92 },
      { name: 'Agente 3', ticketsResolved: Math.floor(resolvedTickets * 0.35), avgResolutionTime: '4.1h', satisfaction: 88 }
    ];

    res.json({
      success: true,
      totalTickets,
      resolvedTickets,
      avgTime: '3.7h',
      satisfaction: '92%',
      agents,
      byPriority,
      byStatus
    });

  } catch (error) {
    console.error('Erro ao obter relatório de suporte:', error);
    next(error);
  }
};
