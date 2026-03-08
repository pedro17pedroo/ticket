import { HoursBank, HoursTransaction } from './hoursBankModel.js';

import { User, Ticket, Client, OrganizationUser } from '../models/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import logger from '../../config/logger.js';

// ==================== HOURS BANKS ====================

// Listar bolsas de horas
export const getHoursBanks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, clientId, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = { organizationId: req.user.organizationId };

    if (clientId) where.clientId = clientId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows: hoursBanks } = await HoursBank.findAndCountAll({
      where,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      hoursBanks,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obter bolsa de horas por ID
export const getHoursBankById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hoursBank = await HoursBank.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!hoursBank) {
      return res.status(404).json({ error: 'Bolsa de horas não encontrada' });
    }

    // Buscar transações
    const transactions = await HoursTransaction.findAll({
      where: { hoursBankId: id },
      include: [
        {
          model: User,
          as: 'performedBy',
          attributes: ['id', 'name']
        },
        {
          model: OrganizationUser,
          as: 'performedByOrgUser',
          attributes: ['id', 'name']
        },
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'ticketNumber', 'subject']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      hoursBank,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// Criar bolsa de horas
export const createHoursBank = async (req, res, next) => {
  try {
    const { clientId, totalHours, packageType, startDate, endDate, allowNegativeBalance, minBalance, notes } = req.body;

    // Verificar se cliente existe e pertence à organização
    const client = await Client.findOne({
      where: {
        id: clientId,
        organizationId: req.user.organizationId
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Validar minBalance se saldo negativo permitido
    if (allowNegativeBalance && minBalance !== undefined && minBalance > 0) {
      return res.status(400).json({
        error: 'Saldo mínimo deve ser negativo ou zero quando saldo negativo é permitido'
      });
    }

    // Criar bolsa de horas
    const hoursBank = await HoursBank.create({
      organizationId: req.user.organizationId,
      clientId,
      totalHours,
      packageType,
      startDate: startDate || null,
      endDate: endDate || null,
      allowNegativeBalance: allowNegativeBalance || false,
      minBalance: allowNegativeBalance ? (minBalance || null) : null,
      notes,
      isActive: true
    });

    // Criar transação de adição inicial
    await HoursTransaction.create({
      hoursBankId: hoursBank.id,
      hours: totalHours,
      type: 'adicao',
      description: `Pacote inicial criado: ${packageType || 'N/A'}`,
      performedById: req.user.id
    });

    // Recarregar com relações
    await hoursBank.reload({
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    logger.info(`Bolsa de horas criada para cliente ${client.name} - ${totalHours}h`);

    res.status(201).json({
      message: 'Bolsa de horas criada com sucesso',
      hoursBank
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar bolsa de horas
export const updateHoursBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const hoursBank = await HoursBank.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!hoursBank) {
      return res.status(404).json({ error: 'Bolsa de horas não encontrada' });
    }

    // Campos permitidos para atualização
    const allowedFields = ['packageType', 'endDate', 'notes', 'isActive'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    await hoursBank.update(updateData);

    logger.info(`Bolsa de horas ${id} atualizada`);

    res.json({
      message: 'Bolsa de horas atualizada com sucesso',
      hoursBank
    });
  } catch (error) {
    next(error);
  }
};

// Adicionar horas
export const addHours = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hours, description } = req.body;

    if (!hours || hours <= 0) {
      return res.status(400).json({ error: 'Quantidade de horas inválida' });
    }

    const hoursBank = await HoursBank.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!hoursBank) {
      return res.status(404).json({ error: 'Bolsa de horas não encontrada' });
    }

    // Adicionar horas ao total
    await hoursBank.update({
      totalHours: parseFloat(hoursBank.totalHours) + parseFloat(hours)
    });

    // Criar transação
    await HoursTransaction.create({
      hoursBankId: hoursBank.id,
      hours: parseFloat(hours),
      type: 'adicao',
      description: description || 'Adição de horas',
      performedById: req.user.id
    });

    logger.info(`${hours}h adicionadas à bolsa ${id}`);

    await hoursBank.reload();

    res.json({
      message: `${hours} hora(s) adicionada(s) com sucesso`,
      hoursBank
    });
  } catch (error) {
    next(error);
  }
};

// Consumir horas
export const consumeHours = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      hours, 
      ticketId, 
      description,
      referenceType = 'ticket',
      referenceId,
      activityName,
      originalHours,
      adjustmentNote
    } = req.body;

    if (!hours || hours <= 0) {
      return res.status(400).json({ error: 'Quantidade de horas inválida' });
    }

    // Validações por tipo de referência
    if (referenceType === 'ticket') {
      if (!referenceId && !ticketId) {
        return res.status(400).json({
          error: 'Ticket é obrigatório para consumo por ticket'
        });
      }

      const ticketIdToUse = referenceId || ticketId;

      // Verificar se ticket existe e está concluído
      const ticket = await Ticket.findOne({
        where: {
          id: ticketIdToUse,
          organizationId: req.user.organizationId
        }
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      if (!['fechado', 'resolvido'].includes(ticket.status)) {
        return res.status(400).json({
          error: 'Apenas tickets com status "Fechado" ou "Resolvido" podem ter horas registradas',
          currentStatus: ticket.status
        });
      }

      // Verificar se ticket já foi consumido nesta bolsa
      const existingConsumption = await HoursTransaction.findOne({
        where: {
          hoursBankId: id,
          referenceType: 'ticket',
          referenceId: ticketIdToUse
        }
      });

      if (existingConsumption) {
        return res.status(400).json({
          error: 'Este ticket já foi utilizado para consumo nesta bolsa de horas'
        });
      }
    } else if (referenceType === 'project') {
      if (!referenceId) {
        return res.status(400).json({
          error: 'Projeto é obrigatório para consumo por projeto'
        });
      }

      // Verificar se projeto já foi consumido
      const existingConsumption = await HoursTransaction.findOne({
        where: {
          hoursBankId: id,
          referenceType: 'project',
          referenceId
        }
      });

      if (existingConsumption) {
        return res.status(400).json({
          error: 'Este projeto já foi utilizado para consumo nesta bolsa de horas'
        });
      }
    } else if (referenceType === 'manual') {
      if (!activityName || activityName.length < 5) {
        return res.status(400).json({
          error: 'Nome da atividade é obrigatório (mínimo 5 caracteres)'
        });
      }
      if (!description || description.length < 20) {
        return res.status(400).json({
          error: 'Descrição detalhada é obrigatória para atividades manuais (mínimo 20 caracteres)'
        });
      }
    }

    const hoursBank = await HoursBank.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!hoursBank) {
      return res.status(404).json({ error: 'Bolsa de horas não encontrada' });
    }

    // Verificar saldo disponível
    const available = parseFloat(hoursBank.totalHours) - parseFloat(hoursBank.usedHours);
    const newUsedHours = parseFloat(hoursBank.usedHours) + parseFloat(hours);
    const newBalance = parseFloat(hoursBank.totalHours) - newUsedHours;

    // Validar saldo negativo
    if (newBalance < 0 && !hoursBank.allowNegativeBalance) {
      return res.status(400).json({
        error: 'Saldo insuficiente. Esta bolsa não permite saldo negativo.',
        available,
        requested: parseFloat(hours)
      });
    }

    // Se permite saldo negativo, verificar limite mínimo
    if (hoursBank.allowNegativeBalance && hoursBank.minBalance !== null) {
      if (newBalance < parseFloat(hoursBank.minBalance)) {
        return res.status(400).json({
          error: `Saldo mínimo atingido. Limite: ${hoursBank.minBalance}h`,
          available,
          requested: parseFloat(hours),
          minBalance: parseFloat(hoursBank.minBalance)
        });
      }
    }

    // Consumir horas
    await hoursBank.update({
      usedHours: newUsedHours
    });

    // Criar transação
    await HoursTransaction.create({
      hoursBankId: hoursBank.id,
      ticketId: ticketId || (referenceType === 'ticket' ? referenceId : null),
      hours: parseFloat(hours),
      type: 'consumo',
      description: description || 'Consumo de horas',
      performedById: req.user.id,
      referenceType,
      referenceId: referenceId || null,
      activityName: activityName || null,
      originalHours: originalHours ? parseFloat(originalHours) : null,
      adjustmentNote: adjustmentNote || null
    });

    logger.info(`${hours}h consumidas da bolsa ${id} (tipo: ${referenceType})`);

    await hoursBank.reload();

    res.json({
      message: `${hours} hora(s) consumida(s) com sucesso`,
      hoursBank,
      availableHours: available - parseFloat(hours)
    });
  } catch (error) {
    next(error);
  }
};

// Ajustar horas (correção)
export const adjustHours = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hours, description } = req.body;

    if (!hours || hours === 0) {
      return res.status(400).json({ error: 'Quantidade de horas inválida' });
    }

    const hoursBank = await HoursBank.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!hoursBank) {
      return res.status(404).json({ error: 'Bolsa de horas não encontrada' });
    }

    // Ajustar (pode ser positivo ou negativo)
    const adjustValue = parseFloat(hours);

    if (adjustValue > 0) {
      await hoursBank.update({
        totalHours: parseFloat(hoursBank.totalHours) + adjustValue
      });
    } else {
      await hoursBank.update({
        usedHours: parseFloat(hoursBank.usedHours) - adjustValue
      });
    }

    // Criar transação
    await HoursTransaction.create({
      hoursBankId: hoursBank.id,
      hours: Math.abs(adjustValue),
      type: 'ajuste',
      description: description || `Ajuste de horas (${adjustValue > 0 ? '+' : '-'}${Math.abs(adjustValue)}h)`,
      performedById: req.user.id
    });

    logger.info(`Ajuste de ${adjustValue}h na bolsa ${id}`);

    await hoursBank.reload();

    res.json({
      message: 'Horas ajustadas com sucesso',
      hoursBank
    });
  } catch (error) {
    next(error);
  }
};

// ==================== TRANSACTIONS ====================

// Listar transações
export const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, hoursBankId, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (hoursBankId) where.hoursBankId = hoursBankId;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: transactions } = await HoursTransaction.findAndCountAll({
      where,
      include: [
        {
          model: HoursBank,
          as: 'hoursBank',
          where: { organizationId: req.user.organizationId },
          include: [{
            model: Client,
            as: 'client',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'performedBy',
          attributes: ['id', 'name']
        },
        {
          model: OrganizationUser,
          as: 'performedByOrgUser',
          attributes: ['id', 'name']
        },
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'ticketNumber', 'subject']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Estatísticas
export const getStatistics = async (req, res, next) => {
  try {
    const { clientId, startDate, endDate } = req.query;

    const where = { organizationId: req.user.organizationId };
    if (clientId) where.clientId = clientId;

    // Total de horas por cliente
    const banks = await HoursBank.findAll({
      where,
      attributes: [
        'clientId',
        [sequelize.fn('SUM', sequelize.col('total_hours')), 'totalHours'],
        [sequelize.fn('SUM', sequelize.col('used_hours')), 'usedHours']
      ],
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'name']
      }],
      group: ['clientId', 'client.id'],
      raw: false
    });

    // Transações por tipo
    const transactionWhere = {};
    if (startDate || endDate) {
      transactionWhere.createdAt = {};
      if (startDate) transactionWhere.createdAt[Op.gte] = new Date(startDate);
      if (endDate) transactionWhere.createdAt[Op.lte] = new Date(endDate);
    }

    const transactionsByType = await HoursTransaction.findAll({
      where: transactionWhere,
      include: [{
        model: HoursBank,
        as: 'hoursBank',
        where: { organizationId: req.user.organizationId },
        attributes: []
      }],
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('HoursTransaction.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('hours')), 'totalHours']
      ],
      group: ['type'],
      raw: true
    });

    res.json({
      banks,
      transactionsByType
    });
  } catch (error) {
    next(error);
  }
};

// Buscar tickets concluídos para consumo de horas
export const getCompletedTickets = async (req, res, next) => {
  try {
    const { clientId } = req.query;

    const where = {
      organizationId: req.user.organizationId,
      status: ['fechado', 'resolvido']
    };

    if (clientId) {
      where.requesterId = clientId;
    }

    const tickets = await Ticket.findAll({
      where,
      attributes: ['id', 'ticketNumber', 'subject', 'status', 'createdAt'],
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

// Buscar tickets disponíveis para consumo (não consumidos ainda)
export const getAvailableTickets = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const { search } = req.query;

    // Verificar se a bolsa existe e pertence à organização
    const hoursBank = await HoursBank.findOne({
      where: {
        id: bankId,
        organizationId: req.user.organizationId
      }
    });

    if (!hoursBank) {
      return res.status(404).json({ error: 'Bolsa de horas não encontrada' });
    }

    // Buscar IDs de tickets já consumidos nesta bolsa
    const consumedTickets = await HoursTransaction.findAll({
      where: {
        hoursBankId: bankId,
        referenceType: 'ticket',
        referenceId: { [Op.ne]: null }
      },
      attributes: ['referenceId']
    });

    const consumedTicketIds = consumedTickets.map(t => t.referenceId);

    // Buscar tickets elegíveis
    const where = {
      organizationId: req.user.organizationId,
      status: ['fechado', 'resolvido'],
      clientId: hoursBank.clientId
    };

    // Excluir tickets já consumidos
    if (consumedTicketIds.length > 0) {
      where.id = { [Op.notIn]: consumedTicketIds };
    }

    // Adicionar busca se fornecida
    if (search) {
      where[Op.or] = [
        { ticketNumber: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const tickets = await Ticket.findAll({
      where,
      attributes: ['id', 'ticketNumber', 'subject', 'status', 'createdAt'],
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Buscar tempo trabalhado para cada ticket
    const ticketsWithTime = await Promise.all(
      tickets.map(async (ticket) => {
        const timeEntries = await sequelize.query(
          `SELECT COALESCE(SUM(duration), 0) as total_seconds 
           FROM time_entries 
           WHERE ticket_id = :ticketId AND end_time IS NOT NULL`,
          {
            replacements: { ticketId: ticket.id },
            type: sequelize.QueryTypes.SELECT
          }
        );

        const totalSeconds = parseInt(timeEntries[0]?.total_seconds || 0);
        const totalHours = (totalSeconds / 3600).toFixed(2);

        return {
          ...ticket.toJSON(),
          totalTime: totalSeconds, // em segundos
          totalHours: parseFloat(totalHours),
          hasTime: totalSeconds > 0
        };
      })
    );

    // Retornar todos os tickets, mesmo sem tempo trabalhado
    res.json({
      success: true,
      tickets: ticketsWithTime
    });
  } catch (error) {
    logger.error('Erro ao buscar tickets disponíveis:', error);
    next(error);
  }
};

// Buscar tempo total trabalhado em um ticket
export const getTicketTotalTime = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    // Verificar se o ticket existe e pertence à organização
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId
      },
      attributes: ['id', 'ticketNumber', 'subject', 'status']
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Buscar tempo total
    const timeEntries = await sequelize.query(
      `SELECT COALESCE(SUM(duration), 0) as total_seconds 
       FROM time_entries 
       WHERE ticket_id = :ticketId AND end_time IS NOT NULL`,
      {
        replacements: { ticketId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const totalSeconds = parseInt(timeEntries[0]?.total_seconds || 0);
    const totalHours = (totalSeconds / 3600).toFixed(2);

    res.json({
      success: true,
      ticket,
      totalSeconds,
      totalHours: parseFloat(totalHours)
    });
  } catch (error) {
    logger.error('Erro ao buscar tempo do ticket:', error);
    next(error);
  }
};

// Buscar projetos disponíveis para consumo
export const getAvailableProjects = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    const { search } = req.query;

    // Verificar se a bolsa existe e pertence à organização
    const hoursBank = await HoursBank.findOne({
      where: {
        id: bankId,
        organizationId: req.user.organizationId
      }
    });

    if (!hoursBank) {
      return res.status(404).json({ error: 'Bolsa de horas não encontrada' });
    }

    // Buscar IDs de projetos já consumidos nesta bolsa
    const consumedProjects = await HoursTransaction.findAll({
      where: {
        hoursBankId: bankId,
        referenceType: 'project',
        referenceId: { [Op.ne]: null }
      },
      attributes: ['referenceId']
    });

    const consumedProjectIds = consumedProjects.map(p => p.referenceId);

    // Buscar projetos elegíveis (concluídos do cliente da bolsa)
    const where = {
      organizationId: req.user.organizationId,
      status: 'completed',
      clientId: hoursBank.clientId
    };

    // Excluir projetos já consumidos
    if (consumedProjectIds.length > 0) {
      where.id = { [Op.notIn]: consumedProjectIds };
    }

    // Adicionar busca se fornecida
    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const projects = await sequelize.models.Project.findAll({
      where,
      attributes: ['id', 'code', 'name', 'description', 'status', 'startDate', 'endDate', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Calcular horas estimadas para cada projeto
    const projectsWithHours = projects.map((project) => {
      let estimatedHours = 0;
      
      if (project.startDate && project.endDate) {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Assumindo 8 horas por dia útil (aproximadamente 5 dias por semana)
        const workDays = Math.floor(diffDays * (5/7));
        estimatedHours = workDays * 8;
      }

      return {
        ...project.toJSON(),
        estimatedHours,
        hasEstimate: estimatedHours > 0
      };
    });

    res.json({
      success: true,
      projects: projectsWithHours
    });
  } catch (error) {
    logger.error('Erro ao buscar projetos disponíveis:', error);
    next(error);
  }
};

export default {
  getHoursBanks,
  getHoursBankById,
  createHoursBank,
  updateHoursBank,
  addHours,
  consumeHours,
  adjustHours,
  getTransactions,
  getStatistics,
  getCompletedTickets,
  getAvailableTickets,
  getTicketTotalTime,
  getAvailableProjects
};
