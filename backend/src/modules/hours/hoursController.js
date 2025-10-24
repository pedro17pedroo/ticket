import { HoursBank, HoursTransaction } from './hoursBankModel.js';
import { User, Ticket } from '../models/index.js';
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
          attributes: ['id', 'name', 'email', 'contactPhone']
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
        pages: Math.ceil(count / limit)
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
          attributes: ['id', 'name', 'email', 'contactPhone']
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
    const { clientId, totalHours, packageType, startDate, endDate, notes } = req.body;

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

    // Criar bolsa de horas
    const hoursBank = await HoursBank.create({
      organizationId: req.user.organizationId,
      clientId,
      totalHours,
      packageType,
      startDate,
      endDate,
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
    const { hours, ticketId, description } = req.body;

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

    // Verificar saldo disponível
    const available = parseFloat(hoursBank.totalHours) - parseFloat(hoursBank.usedHours);
    if (parseFloat(hours) > available) {
      return res.status(400).json({ 
        error: 'Saldo insuficiente',
        available,
        requested: parseFloat(hours)
      });
    }

    // Consumir horas
    await hoursBank.update({
      usedHours: parseFloat(hoursBank.usedHours) + parseFloat(hours)
    });

    // Criar transação
    await HoursTransaction.create({
      hoursBankId: hoursBank.id,
      ticketId: ticketId || null,
      hours: parseFloat(hours),
      type: 'consumo',
      description: description || 'Consumo de horas',
      performedById: req.user.id
    });

    logger.info(`${hours}h consumidas da bolsa ${id}`);

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

export default {
  getHoursBanks,
  getHoursBankById,
  createHoursBank,
  updateHoursBank,
  addHours,
  consumeHours,
  adjustHours,
  getTransactions,
  getStatistics
};
