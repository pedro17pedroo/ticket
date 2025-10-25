import { TimeTracking } from './timeTrackingModel.js';
import { Ticket, User, HoursBank, HoursTransaction } from '../models/index.js';
import logger from '../../config/logger.js';

// Iniciar timer no ticket
export const startTimer = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { description } = req.body;

    // Verificar se ticket existe
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Verificar se já existe timer ativo para este usuário neste ticket
    const activeTimer = await TimeTracking.findOne({
      where: {
        ticketId,
        userId: req.user.id,
        status: ['running', 'paused']
      }
    });

    if (activeTimer) {
      return res.status(400).json({ 
        error: 'Já existe um timer ativo para este ticket',
        timer: activeTimer
      });
    }

    // Criar novo timer
    const timer = await TimeTracking.create({
      ticketId,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      startTime: new Date(),
      description: description || null,
      status: 'running'
    });

    logger.info(`Timer iniciado para ticket ${ticketId} por ${req.user.name}`);

    res.json({
      success: true,
      timer
    });
  } catch (error) {
    next(error);
  }
};

// Pausar timer
export const pauseTimer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timer = await TimeTracking.findOne({
      where: {
        id,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        status: 'running'
      }
    });

    if (!timer) {
      return res.status(404).json({ error: 'Timer não encontrado ou já pausado' });
    }

    await timer.update({
      pausedAt: new Date(),
      status: 'paused'
    });

    res.json({
      success: true,
      timer
    });
  } catch (error) {
    next(error);
  }
};

// Retomar timer pausado
export const resumeTimer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timer = await TimeTracking.findOne({
      where: {
        id,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        status: 'paused'
      }
    });

    if (!timer) {
      return res.status(404).json({ error: 'Timer não encontrado ou não está pausado' });
    }

    // Calcular tempo pausado
    const pausedSeconds = Math.floor((new Date() - new Date(timer.pausedAt)) / 1000);

    await timer.update({
      totalPausedTime: timer.totalPausedTime + pausedSeconds,
      pausedAt: null,
      status: 'running'
    });

    res.json({
      success: true,
      timer
    });
  } catch (error) {
    next(error);
  }
};

// Parar timer
export const stopTimer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timer = await TimeTracking.findOne({
      where: {
        id,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        status: ['running', 'paused']
      }
    });

    if (!timer) {
      return res.status(404).json({ error: 'Timer não encontrado' });
    }

    const now = new Date();
    let totalPausedTime = timer.totalPausedTime;

    // Se estava pausado, adicionar tempo da última pausa
    if (timer.status === 'paused' && timer.pausedAt) {
      const lastPausedSeconds = Math.floor((now - new Date(timer.pausedAt)) / 1000);
      totalPausedTime += lastPausedSeconds;
    }

    // Calcular tempo total
    const totalElapsed = Math.floor((now - new Date(timer.startTime)) / 1000);
    const totalSeconds = totalElapsed - totalPausedTime;

    await timer.update({
      endTime: now,
      status: 'stopped',
      totalSeconds,
      totalPausedTime
    });

    logger.info(`Timer parado: ${totalSeconds}s (${(totalSeconds / 3600).toFixed(2)}h)`);

    res.json({
      success: true,
      timer,
      totalHours: (totalSeconds / 3600).toFixed(2)
    });
  } catch (error) {
    next(error);
  }
};

// Obter timer ativo do usuário em um ticket
export const getActiveTimer = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const timer = await TimeTracking.findOne({
      where: {
        ticketId,
        userId: req.user.id,
        status: ['running', 'paused']
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      success: true,
      timer
    });
  } catch (error) {
    next(error);
  }
};

// Listar todos os timers de um ticket
export const getTicketTimers = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const timers = await TimeTracking.findAll({
      where: {
        ticketId,
        organizationId: req.user.organizationId
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Calcular total de horas
    const totalSeconds = timers
      .filter(t => t.status === 'stopped')
      .reduce((sum, t) => sum + (t.totalSeconds || 0), 0);

    res.json({
      success: true,
      timers,
      totalHours: (totalSeconds / 3600).toFixed(2),
      totalSeconds
    });
  } catch (error) {
    next(error);
  }
};

// Auto-consumir tempo ao concluir ticket
export const autoConsumeOnTicketComplete = async (ticketId, userId, organizationId) => {
  try {
    // Buscar todos os timers parados e não consumidos do ticket
    const timers = await TimeTracking.findAll({
      where: {
        ticketId,
        status: 'stopped',
        autoConsumed: false
      }
    });

    if (timers.length === 0) {
      return { success: false, message: 'Nenhum timer para consumir' };
    }

    // Buscar ticket para pegar clientId
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket || !ticket.requesterId) {
      return { success: false, message: 'Ticket sem cliente associado' };
    }

    // Buscar bolsa de horas ativa do cliente
    const hoursBank = await HoursBank.findOne({
      where: {
        clientId: ticket.requesterId,
        organizationId,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });

    if (!hoursBank) {
      logger.info(`Ticket ${ticketId} concluído, mas cliente sem bolsa de horas ativa`);
      return { success: false, message: 'Cliente sem bolsa de horas ativa' };
    }

    // Calcular total de horas
    const totalSeconds = timers.reduce((sum, t) => sum + (t.totalSeconds || 0), 0);
    const totalHours = totalSeconds / 3600;

    // Verificar saldo
    const available = parseFloat(hoursBank.totalHours) - parseFloat(hoursBank.usedHours);
    const newUsedHours = parseFloat(hoursBank.usedHours) + totalHours;
    const newBalance = parseFloat(hoursBank.totalHours) - newUsedHours;

    // Validar saldo negativo
    if (newBalance < 0 && !hoursBank.allowNegativeBalance) {
      logger.warn(`Saldo insuficiente para auto-consumo. Disponível: ${available}h, Necessário: ${totalHours.toFixed(2)}h`);
      return { 
        success: false, 
        message: `Saldo insuficiente. Disponível: ${available.toFixed(2)}h, Necessário: ${totalHours.toFixed(2)}h` 
      };
    }

    // Validar limite mínimo
    if (hoursBank.allowNegativeBalance && hoursBank.minBalance !== null) {
      if (newBalance < parseFloat(hoursBank.minBalance)) {
        return { 
          success: false, 
          message: `Saldo mínimo atingido. Limite: ${hoursBank.minBalance}h` 
        };
      }
    }

    // Consumir horas
    await hoursBank.update({
      usedHours: newUsedHours
    });

    // Criar transação
    await HoursTransaction.create({
      hoursBankId: hoursBank.id,
      ticketId,
      hours: totalHours,
      type: 'consumo',
      description: `Auto-consumo do ticket #${ticket.ticketNumber} - Tempo rastreado: ${totalHours.toFixed(2)}h`,
      performedById: userId
    });

    // Marcar timers como consumidos
    await Promise.all(timers.map(timer => 
      timer.update({ 
        autoConsumed: true,
        hoursBankId: hoursBank.id
      })
    ));

    logger.info(`Auto-consumo: ${totalHours.toFixed(2)}h do ticket ${ticketId} na bolsa ${hoursBank.id}`);

    return { 
      success: true, 
      consumedHours: totalHours.toFixed(2),
      hoursBankId: hoursBank.id 
    };
  } catch (error) {
    logger.error('Erro no auto-consumo:', error);
    return { success: false, message: error.message };
  }
};

export default {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getActiveTimer,
  getTicketTimers,
  autoConsumeOnTicketComplete
};
