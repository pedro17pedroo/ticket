import { HoursBank, HoursTransaction } from './hoursBankModel.js';
import { User } from '../models/index.js';

// GET /api/client/hours-banks - Cliente ver suas bolsas de horas
export const getClientHoursBanks = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const hoursBanks = await HoursBank.findAll({
      where: {
        organizationId,
        clientId: userId,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calcular totais
    const totalAvailable = hoursBanks.reduce((sum, bank) => {
      return sum + (parseFloat(bank.totalHours) - parseFloat(bank.usedHours));
    }, 0);

    const totalUsed = hoursBanks.reduce((sum, bank) => {
      return sum + parseFloat(bank.usedHours);
    }, 0);

    const totalHours = hoursBanks.reduce((sum, bank) => {
      return sum + parseFloat(bank.totalHours);
    }, 0);

    res.json({
      success: true,
      hoursBanks,
      summary: {
        totalAvailable: totalAvailable.toFixed(2),
        totalUsed: totalUsed.toFixed(2),
        totalHours: totalHours.toFixed(2),
        count: hoursBanks.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/client/hours-banks/:id - Cliente ver detalhes de uma bolsa
export const getClientHoursBankById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const hoursBank = await HoursBank.findOne({
      where: {
        id,
        organizationId,
        clientId: userId
      },
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!hoursBank) {
      return res.status(404).json({
        success: false,
        error: 'Bolsa de horas não encontrada'
      });
    }

    res.json({
      success: true,
      hoursBank
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/client/hours-banks/:id/transactions - Cliente ver transações de uma bolsa
export const getClientHoursBankTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Verificar se a bolsa pertence ao cliente
    const hoursBank = await HoursBank.findOne({
      where: {
        id,
        organizationId,
        clientId: userId
      }
    });

    if (!hoursBank) {
      return res.status(404).json({
        success: false,
        error: 'Bolsa de horas não encontrada'
      });
    }

    // Buscar transações
    const { count, rows: transactions } = await HoursTransaction.findAndCountAll({
      where: { hoursBankId: id },
      include: [
        {
          model: User,
          as: 'performedBy',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
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

// GET /api/client/hours-transactions - Cliente ver todas suas transações
export const getClientAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const offset = (page - 1) * limit;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const where = {};
    if (type) where.type = type;

    const { count, rows: transactions } = await HoursTransaction.findAndCountAll({
      where,
      include: [
        {
          model: HoursBank,
          as: 'hoursBank',
          where: {
            organizationId,
            clientId: userId
          },
          attributes: ['id', 'packageType'],
          include: [{
            model: User,
            as: 'client',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'performedBy',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
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
