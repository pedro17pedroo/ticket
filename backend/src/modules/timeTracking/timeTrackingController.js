import TimeEntry from '../tickets/timeEntryModel.js';
import { Ticket, User, HoursBank, HoursTransaction } from '../models/index.js';
import logger from '../../config/logger.js';
import { isTicketClosed, isTicketAssigned } from '../../utils/ticketValidations.js';

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

    // ✅ VALIDAÇÃO: Ticket não pode estar fechado/resolvido
    if (isTicketClosed(ticket)) {
      return res.status(403).json({ 
        error: 'Não é possível iniciar cronômetro em ticket concluído',
        reason: 'ticket_closed',
        status: ticket.status
      });
    }

    // ✅ VALIDAÇÃO: Ticket deve estar atribuído
    if (!isTicketAssigned(ticket)) {
      return res.status(403).json({ 
        error: 'Ticket deve ser atribuído antes de iniciar o cronômetro',
        reason: 'ticket_not_assigned'
      });
    }

    // Verificar se já existe timer ativo para este usuário neste ticket
    const activeTimer = await TimeEntry.findOne({
      where: {
        ticketId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (activeTimer) {
      return res.status(400).json({ 
        error: 'Já existe um timer ativo para este ticket',
        timer: activeTimer
      });
    }

    // Criar novo timer
    const timer = await TimeEntry.create({
      ticketId,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      startTime: new Date(),
      description: description || null,
      isActive: true,
      status: 'running',
      totalPausedTime: 0
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

    const timer = await TimeEntry.findOne({
      where: {
        id,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        isActive: true,
        status: 'running'
      }
    });

    if (!timer) {
      return res.status(404).json({ error: 'Timer ativo não encontrado' });
    }

    // Marcar momento da pausa
    await timer.update({
      status: 'paused',
      lastPauseStart: new Date()
    });
    
    // Recarregar para pegar valores atualizados
    await timer.reload();

    logger.info(`Timer pausado: ${id} por ${req.user.name}`);

    res.json({
      success: true,
      timer
    });
  } catch (error) {
    next(error);
  }
};

// Retomar timer
export const resumeTimer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timer = await TimeEntry.findOne({
      where: {
        id,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        isActive: true,
        status: 'paused'
      }
    });

    if (!timer) {
      return res.status(404).json({ error: 'Timer pausado não encontrado' });
    }

    // Calcular tempo pausado
    const now = new Date();
    const pauseStart = new Date(timer.lastPauseStart);
    const pausedSeconds = Math.floor((now - pauseStart) / 1000);
    let newTotalPausedTime = (timer.totalPausedTime || 0) + pausedSeconds;
    
    // Validação: totalPausedTime não pode ser maior que tempo total decorrido
    const totalElapsed = Math.floor((now - new Date(timer.startTime)) / 1000);
    if (newTotalPausedTime >= totalElapsed) {
      logger.warn(`⚠️ totalPausedTime (${newTotalPausedTime}s) >= totalElapsed (${totalElapsed}s). Ajustando para evitar timer negativo.`);
      // Deixar pelo menos 1 segundo de trabalho efetivo
      newTotalPausedTime = Math.max(0, totalElapsed - 1);
    }

    // Retomar timer
    await timer.update({
      status: 'running',
      totalPausedTime: newTotalPausedTime,
      lastPauseStart: null
    });
    
    // Recarregar para pegar valores atualizados
    await timer.reload();

    logger.info(`Timer retomado: ${id} por ${req.user.name}. Pausado por ${pausedSeconds}s`);

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

    const timer = await TimeEntry.findOne({
      where: {
        id,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        isActive: true
      }
    });

    if (!timer) {
      return res.status(404).json({ error: 'Timer não encontrado' });
    }

    const now = new Date();
    
    // Se estava pausado, calcular tempo da última pausa
    let finalPausedTime = timer.totalPausedTime || 0;
    if (timer.status === 'paused' && timer.lastPauseStart) {
      const pauseStart = new Date(timer.lastPauseStart);
      const lastPauseDuration = Math.floor((now - pauseStart) / 1000);
      finalPausedTime += lastPauseDuration;
    }
    
    // Calcular duração total (descontando pausas)
    const totalElapsed = Math.floor((now - new Date(timer.startTime)) / 1000);
    const duration = totalElapsed - finalPausedTime;

    await timer.update({
      endTime: now,
      duration,
      totalPausedTime: finalPausedTime,
      isActive: false,
      status: 'stopped'
    });
    
    // Recarregar para pegar valores atualizados
    await timer.reload();

    logger.info(`Timer parado: ${duration}s (${(duration / 3600).toFixed(2)}h)`);

    res.json({
      success: true,
      timer,
      totalHours: (duration / 3600).toFixed(2)
    });
  } catch (error) {
    next(error);
  }
};

// Obter timer ativo do usuário em um ticket
export const getActiveTimer = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const timer = await TimeEntry.findOne({
      where: {
        ticketId,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });

    // Validar e corrigir timer corrompido
    if (timer) {
      const now = new Date();
      const totalElapsed = Math.floor((now - new Date(timer.startTime)) / 1000);
      const totalPausedTime = timer.totalPausedTime || 0;
      
      // Se totalPausedTime > 50% do totalElapsed, timer está corrompido
      // (Timer pausado por mais da metade do tempo é suspeito)
      if (totalPausedTime > totalElapsed * 0.5) {
        logger.error(
          `🔴 Timer CORROMPIDO detectado: ${timer.id}. ` +
          `totalPausedTime=${totalPausedTime}s (${(totalPausedTime/totalElapsed*100).toFixed(0)}%), ` +
          `totalElapsed=${totalElapsed}s. ` +
          `DELETANDO timer corrompido.`
        );
        
        // Parar e desativar timer corrompido
        await timer.update({ 
          isActive: false,
          status: 'stopped',
          endTime: now,
          duration: Math.max(1, totalElapsed - totalPausedTime)
        });
        
        // Retornar null para frontend saber que timer foi removido
        return res.json({ timer: null });
      }
    }

    res.json({
      timer: timer || null
    });
  } catch (error) {
    next(error);
  }
};

// Listar todos os timers de um ticket
export const getTicketTimers = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const timers = await TimeEntry.findAll({
      where: {
        ticketId,
        organizationId: req.user.organizationId
      },
      order: [['createdAt', 'DESC']]
    });

    // Calcular total de horas
    const totalSeconds = timers
      .filter(t => !t.isActive && t.duration)
      .reduce((sum, t) => sum + (t.duration || 0), 0);

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
    // Buscar todos os timers parados do ticket
    const timers = await TimeEntry.findAll({
      where: {
        ticketId,
        isActive: false
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
    const totalSeconds = timers.reduce((sum, t) => sum + (t.duration || 0), 0);
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

    // Timers já foram consumidos (marcados como isActive: false)

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
