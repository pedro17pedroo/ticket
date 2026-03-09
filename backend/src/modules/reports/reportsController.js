import { Op, fn, col } from 'sequelize';
import { sequelize } from '../../config/database.js';
import TimeTracking from '../timeTracking/timeTrackingModel.js';
import { Ticket, OrganizationUser, Client } from '../models/index.js';

/**
 * Relatório de horas por ticket
 * Mostra quantas horas foram consumidas em cada ticket e quantas pessoas foram envolvidas
 */
export const getHoursByTicket = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    const { startDate, endDate, ticketId, status } = req.query;

    const whereClause = { organizationId };
    
    if (ticketId) {
      whereClause.ticketId = ticketId;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime[Op.gte] = new Date(startDate);
      if (endDate) whereClause.startTime[Op.lte] = new Date(endDate);
    }

    const ticketWhere = {};
    if (status) {
      ticketWhere.status = status;
    }

    const report = await TimeTracking.findAll({
      where: whereClause,
      attributes: [
        'ticketId',
        [fn('COUNT', fn('DISTINCT', col('TimeTracking.user_id'))), 'totalUsers'],
        [fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
        [fn('COUNT', col('TimeTracking.id')), 'totalSessions']
      ],
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority', 'clientId'],
          where: ticketWhere,
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        }
      ],
      group: ['ticketId', 'ticket.id', 'ticket->client.id'],
      order: [[fn('SUM', col('TimeTracking.total_seconds')), 'DESC']]
    });

    // Formatar resultado
    const formattedReport = report.map(item => {
      const totalSeconds = parseInt(item.dataValues.totalSeconds) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return {
        ticket: {
          id: item.ticket.id,
          ticketNumber: item.ticket.ticketNumber,
          subject: item.ticket.subject,
          status: item.ticket.status,
          priority: item.ticket.priority,
          client: item.ticket.client
        },
        totalUsers: parseInt(item.dataValues.totalUsers),
        totalSessions: parseInt(item.dataValues.totalSessions),
        totalSeconds,
        totalHours: hours,
        totalMinutes: minutes,
        formattedTime: `${hours}h ${minutes}m`
      };
    });

    res.json({
      success: true,
      data: formattedReport,
      summary: {
        totalTickets: formattedReport.length,
        totalHours: formattedReport.reduce((sum, item) => sum + item.totalHours, 0),
        totalUsers: new Set(formattedReport.map(item => item.totalUsers)).size
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Relatório de horas por usuário
 * Mostra o total de horas trabalhadas por cada usuário
 */
export const getHoursByUser = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    const { startDate, endDate, userId } = req.query;

    const whereClause = { organizationId };
    
    if (userId) {
      whereClause.userId = userId;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime[Op.gte] = new Date(startDate);
      if (endDate) whereClause.startTime[Op.lte] = new Date(endDate);
    }

    const report = await TimeTracking.findAll({
      where: whereClause,
      attributes: [
        'userId',
        [fn('COUNT', fn('DISTINCT', col('TimeTracking.ticket_id'))), 'totalTickets'],
        [fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
        [fn('COUNT', col('TimeTracking.id')), 'totalSessions']
      ],
      include: [
        {
          model: OrganizationUser,
          as: 'organizationUser',
          attributes: ['id', 'name', 'email', 'avatar', 'role']
        }
      ],
      group: ['userId', 'organizationUser.id'],
      order: [[fn('SUM', col('TimeTracking.total_seconds')), 'DESC']]
    });

    // Formatar resultado
    const formattedReport = report.map(item => {
      const totalSeconds = parseInt(item.dataValues.totalSeconds) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return {
        user: item.organizationUser,
        totalTickets: parseInt(item.dataValues.totalTickets),
        totalSessions: parseInt(item.dataValues.totalSessions),
        totalSeconds,
        totalHours: hours,
        totalMinutes: minutes,
        formattedTime: `${hours}h ${minutes}m`
      };
    });

    res.json({
      success: true,
      data: formattedReport,
      summary: {
        totalUsers: formattedReport.length,
        totalHours: formattedReport.reduce((sum, item) => sum + item.totalHours, 0),
        totalTickets: formattedReport.reduce((sum, item) => sum + item.totalTickets, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Relatório mensal por usuário
 * Agrupa horas por mês para cada usuário
 */
export const getMonthlyReportByUser = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    const { year, userId } = req.query;

    const whereClause = { organizationId };
    
    if (userId) {
      whereClause.userId = userId;
    }

    if (year) {
      whereClause.startTime = {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lte]: new Date(`${year}-12-31 23:59:59`)
      };
    }

    const report = await sequelize.query(`
      SELECT 
        tt.user_id,
        ou.name as user_name,
        ou.email as user_email,
        EXTRACT(YEAR FROM tt.start_time) as year,
        EXTRACT(MONTH FROM tt.start_time) as month,
        COUNT(DISTINCT tt.ticket_id) as total_tickets,
        COUNT(tt.id) as total_sessions,
        SUM(tt.total_seconds) as total_seconds
      FROM time_tracking tt
      LEFT JOIN organization_users ou ON tt.user_id = ou.id
      WHERE tt.organization_id = :organizationId
        ${userId ? 'AND tt.user_id = :userId' : ''}
        ${year ? 'AND EXTRACT(YEAR FROM tt.start_time) = :year' : ''}
      GROUP BY tt.user_id, ou.name, ou.email, year, month
      ORDER BY year DESC, month DESC, total_seconds DESC
    `, {
      replacements: { organizationId, userId, year },
      type: sequelize.QueryTypes.SELECT
    });

    // Formatar resultado
    const formattedReport = report.map(item => {
      const totalSeconds = parseInt(item.total_seconds) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return {
        userId: item.user_id,
        userName: item.user_name,
        userEmail: item.user_email,
        year: parseInt(item.year),
        month: parseInt(item.month),
        monthName: new Date(item.year, item.month - 1).toLocaleString('pt-BR', { month: 'long' }),
        totalTickets: parseInt(item.total_tickets),
        totalSessions: parseInt(item.total_sessions),
        totalSeconds,
        totalHours: hours,
        totalMinutes: minutes,
        formattedTime: `${hours}h ${minutes}m`
      };
    });

    res.json({
      success: true,
      data: formattedReport,
      summary: {
        totalMonths: new Set(formattedReport.map(item => `${item.year}-${item.month}`)).size,
        totalHours: formattedReport.reduce((sum, item) => sum + item.totalHours, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Relatório por cliente empresa
 * Mostra horas consumidas por cada cliente
 */
export const getHoursByClient = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    const { startDate, endDate, clientId } = req.query;

    const whereClause = { organizationId };
    
    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime[Op.gte] = new Date(startDate);
      if (endDate) whereClause.startTime[Op.lte] = new Date(endDate);
    }

    const ticketWhere = {};
    if (clientId) {
      ticketWhere.clientId = clientId;
    }

    const report = await TimeTracking.findAll({
      where: whereClause,
      attributes: [
        [fn('COUNT', fn('DISTINCT', col('ticket.id'))), 'totalTickets'],
        [fn('COUNT', fn('DISTINCT', col('TimeTracking.user_id'))), 'totalUsers'],
        [fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
        [fn('COUNT', col('TimeTracking.id')), 'totalSessions']
      ],
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['clientId'],
          where: ticketWhere,
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'name', 'email', 'phone', 'address']
            }
          ]
        }
      ],
      group: ['ticket.client_id', 'ticket->client.id'],
      order: [[fn('SUM', col('TimeTracking.total_seconds')), 'DESC']],
      raw: true,
      subQuery: false
    });

    // Formatar resultado
    const formattedReport = report.map(item => {
      const totalSeconds = parseInt(item.dataValues.totalSeconds) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return {
        client: item.ticket.client,
        totalTickets: parseInt(item.dataValues.totalTickets),
        totalUsers: parseInt(item.dataValues.totalUsers),
        totalSessions: parseInt(item.dataValues.totalSessions),
        totalSeconds,
        totalHours: hours,
        totalMinutes: minutes,
        formattedTime: `${hours}h ${minutes}m`
      };
    });

    res.json({
      success: true,
      data: formattedReport,
      summary: {
        totalClients: formattedReport.length,
        totalHours: formattedReport.reduce((sum, item) => sum + item.totalHours, 0),
        totalTickets: formattedReport.reduce((sum, item) => sum + item.totalTickets, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Relatório de horas por dia
 * Agrupa horas por dia, com filtros por usuário e cliente
 */
export const getDailyReport = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    const { startDate, endDate, userId, clientId } = req.query;

    const whereClause = { organizationId };
    
    if (userId) {
      whereClause.userId = userId;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime[Op.gte] = new Date(startDate);
      if (endDate) whereClause.startTime[Op.lte] = new Date(endDate);
    }

    const ticketWhere = {};
    if (clientId) {
      ticketWhere.clientId = clientId;
    }

    const report = await sequelize.query(`
      SELECT 
        DATE(tt.start_time) as date,
        COUNT(DISTINCT tt.ticket_id) as total_tickets,
        COUNT(DISTINCT tt.user_id) as total_users,
        COUNT(tt.id) as total_sessions,
        SUM(tt.total_seconds) as total_seconds,
        ${clientId ? `c.id as client_id, c.name as client_name,` : ''}
        ${userId ? `ou.id as user_id, ou.name as user_name,` : ''}
        1 as placeholder
      FROM time_tracking tt
      LEFT JOIN tickets t ON tt.ticket_id = t.id
      ${clientId ? 'LEFT JOIN clients c ON t.client_id = c.id' : ''}
      ${userId ? 'LEFT JOIN organization_users ou ON tt.user_id = ou.id' : ''}
      WHERE tt.organization_id = :organizationId
        ${userId ? 'AND tt.user_id = :userId' : ''}
        ${clientId ? 'AND t.client_id = :clientId' : ''}
        ${startDate ? 'AND tt.start_time >= :startDate' : ''}
        ${endDate ? 'AND tt.start_time <= :endDate' : ''}
      GROUP BY DATE(tt.start_time)
        ${clientId ? ', c.id, c.name' : ''}
        ${userId ? ', ou.id, ou.name' : ''}
      ORDER BY date DESC
    `, {
      replacements: { organizationId, userId, clientId, startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    // Formatar resultado
    const formattedReport = report.map(item => {
      const totalSeconds = parseInt(item.total_seconds) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      const result = {
        date: item.date,
        totalTickets: parseInt(item.total_tickets),
        totalUsers: parseInt(item.total_users),
        totalSessions: parseInt(item.total_sessions),
        totalSeconds,
        totalHours: hours,
        totalMinutes: minutes,
        formattedTime: `${hours}h ${minutes}m`
      };

      if (clientId) {
        result.client = {
          id: item.client_id,
          name: item.client_name
        };
      }

      if (userId) {
        result.user = {
          id: item.user_id,
          name: item.user_name
        };
      }

      return result;
    });

    res.json({
      success: true,
      data: formattedReport,
      summary: {
        totalDays: formattedReport.length,
        totalHours: formattedReport.reduce((sum, item) => sum + item.totalHours, 0),
        averageHoursPerDay: formattedReport.length > 0 
          ? (formattedReport.reduce((sum, item) => sum + item.totalHours, 0) / formattedReport.length).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resumo básico por cliente
 * Informações consolidadas de cada cliente
 */
export const getClientSummary = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    const { clientId } = req.query;

    const ticketWhere = { organizationId };
    if (clientId) {
      ticketWhere.clientId = clientId;
    }

    const summary = await sequelize.query(`
      SELECT 
        c.id as client_id,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        COUNT(DISTINCT t.id) as total_tickets,
        COUNT(DISTINCT CASE WHEN t.status = 'novo' THEN t.id END) as open_tickets,
        COUNT(DISTINCT CASE WHEN t.status = 'em_progresso' THEN t.id END) as in_progress_tickets,
        COUNT(DISTINCT CASE WHEN t.status = 'fechado' THEN t.id END) as closed_tickets,
        COUNT(DISTINCT tt.user_id) as total_users_involved,
        COALESCE(SUM(tt.total_seconds), 0) as total_seconds,
        COUNT(tt.id) as total_time_sessions
      FROM clients c
      LEFT JOIN tickets t ON c.id = t.client_id AND t.organization_id = :organizationId
      LEFT JOIN time_tracking tt ON t.id = tt.ticket_id
      WHERE c.organization_id = :organizationId
        ${clientId ? 'AND c.id = :clientId' : ''}
      GROUP BY c.id, c.name, c.email, c.phone
      ORDER BY total_seconds DESC
    `, {
      replacements: { organizationId, clientId },
      type: sequelize.QueryTypes.SELECT
    });

    // Formatar resultado
    const formattedSummary = summary.map(item => {
      const totalSeconds = parseInt(item.total_seconds) || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return {
        client: {
          id: item.client_id,
          name: item.client_name,
          email: item.client_email,
          phone: item.client_phone
        },
        tickets: {
          total: parseInt(item.total_tickets),
          open: parseInt(item.open_tickets),
          inProgress: parseInt(item.in_progress_tickets),
          closed: parseInt(item.closed_tickets)
        },
        timeTracking: {
          totalUsersInvolved: parseInt(item.total_users_involved),
          totalSessions: parseInt(item.total_time_sessions),
          totalSeconds,
          totalHours: hours,
          totalMinutes: minutes,
          formattedTime: `${hours}h ${minutes}m`
        }
      };
    });

    res.json({
      success: true,
      data: formattedSummary,
      summary: {
        totalClients: formattedSummary.length,
        totalHours: formattedSummary.reduce((sum, item) => sum + item.timeTracking.totalHours, 0),
        totalTickets: formattedSummary.reduce((sum, item) => sum + item.tickets.total, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Relatório detalhado de um ticket específico
 * Mostra todas as sessões de tempo de um ticket
 */
export const getTicketDetailedReport = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    const { ticketId } = req.params;

    const sessions = await TimeTracking.findAll({
      where: {
        organizationId,
        ticketId
      },
      include: [
        {
          model: OrganizationUser,
          as: 'organizationUser',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'ticketNumber', 'subject', 'status']
        }
      ],
      order: [['startTime', 'DESC']]
    });

    // Formatar resultado
    const formattedSessions = sessions.map(session => {
      const totalSeconds = session.totalSeconds || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return {
        id: session.id,
        user: session.organizationUser,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        description: session.description,
        totalSeconds,
        totalHours: hours,
        totalMinutes: minutes,
        formattedTime: `${hours}h ${minutes}m`,
        pausedTime: session.totalPausedTime
      };
    });

    const totalSeconds = formattedSessions.reduce((sum, s) => sum + s.totalSeconds, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    res.json({
      success: true,
      ticket: sessions[0]?.ticket || null,
      sessions: formattedSessions,
      summary: {
        totalSessions: formattedSessions.length,
        totalUsers: new Set(formattedSessions.map(s => s.user.id)).size,
        totalSeconds,
        totalHours,
        totalMinutes,
        formattedTime: `${totalHours}h ${totalMinutes}m`
      }
    });
  } catch (error) {
    next(error);
  }
};
