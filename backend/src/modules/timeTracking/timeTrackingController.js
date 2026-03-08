import TimeEntry from '../tickets/timeEntryModel.js';
import { Ticket, User, OrganizationUser, HoursBank, HoursTransaction } from '../models/index.js';
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

    // 🔔 NOTIFICAR WATCHERS SOBRE CRONÔMETRO INICIADO
    try {
      // Carregar ticket completo com relacionamentos
      const fullTicket = await Ticket.findByPk(ticketId, {
        include: [
          { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
        ]
      });

      if (fullTicket) {
        const { notifyTicketWatchers } = await import('../../services/watcherNotificationService.js');
        await notifyTicketWatchers(fullTicket, 'timer_started', { 
          startedBy: req.user.name,
          description: description || null
        });
        logger.info(`✅ Watchers notificados sobre cronômetro iniciado no ticket ${fullTicket.ticketNumber}`);
      }
    } catch (error) {
      logger.error(`❌ Erro ao notificar watchers sobre cronômetro iniciado:`, error);
    }

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
      lastPauseAt: new Date()
    });
    
    // Recarregar para pegar valores atualizados
    await timer.reload();

    logger.info(`Timer pausado: ${id} por ${req.user.name}`);

    // 🔔 NOTIFICAR WATCHERS SOBRE CRONÔMETRO PAUSADO
    try {
      // Carregar ticket completo com relacionamentos
      const fullTicket = await Ticket.findByPk(timer.ticketId, {
        include: [
          { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
        ]
      });

      if (fullTicket) {
        const { notifyTicketWatchers } = await import('../../services/watcherNotificationService.js');
        await notifyTicketWatchers(fullTicket, 'timer_paused', { 
          pausedBy: req.user.name
        });
        logger.info(`✅ Watchers notificados sobre cronômetro pausado no ticket ${fullTicket.ticketNumber}`);
      }
    } catch (error) {
      logger.error(`❌ Erro ao notificar watchers sobre cronômetro pausado:`, error);
    }

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
    const pauseStart = new Date(timer.lastPauseAt);
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
      lastPauseAt: null,
      lastResumeAt: now
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
    if (timer.status === 'paused' && timer.lastPauseAt) {
      const pauseStart = new Date(timer.lastPauseAt);
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

    // 🔔 NOTIFICAR WATCHERS SOBRE CRONÔMETRO PARADO
    try {
      // Carregar ticket completo com relacionamentos
      const fullTicket = await Ticket.findByPk(timer.ticketId, {
        include: [
          { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
        ]
      });

      if (fullTicket) {
        const { notifyTicketWatchers } = await import('../../services/watcherNotificationService.js');
        await notifyTicketWatchers(fullTicket, 'timer_stopped', { 
          stoppedBy: req.user.name,
          duration: duration,
          totalHours: (duration / 3600).toFixed(2)
        });
        logger.info(`✅ Watchers notificados sobre cronômetro parado no ticket ${fullTicket.ticketNumber} - ${(duration / 3600).toFixed(2)}h trabalhadas`);
      }
    } catch (error) {
      logger.error(`❌ Erro ao notificar watchers sobre cronômetro parado:`, error);
    }

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

// Listar todos os timers de um ticket (com informações do usuário)
export const getTicketTimers = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    // Importar OrganizationUser dinamicamente
    const { OrganizationUser } = await import('../models/index.js');

    const timers = await TimeEntry.findAll({
      where: {
        ticketId,
        organizationId: req.user.organizationId,
        isActive: false // Apenas timers finalizados
      },
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calcular total de horas
    const totalSeconds = timers
      .filter(t => t.duration)
      .reduce((sum, t) => sum + (t.duration || 0), 0);

    res.json({
      success: true,
      entries: timers,
      totalHours: (totalSeconds / 3600).toFixed(2),
      totalSeconds
    });
  } catch (error) {
    next(error);
  }
};

// Adicionar tempo manualmente
export const addManualTime = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { hours, description } = req.body;

    // Importar OrganizationUser dinamicamente
    const { OrganizationUser } = await import('../models/index.js');

    // Validar entrada
    if (!hours || parseFloat(hours) <= 0) {
      return res.status(400).json({ error: 'Tempo inválido. Deve ser maior que 0.' });
    }

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
        error: 'Não é possível adicionar tempo em ticket concluído',
        reason: 'ticket_closed',
        status: ticket.status
      });
    }

    // Converter horas para segundos
    const durationInSeconds = Math.floor(parseFloat(hours) * 3600);
    const now = new Date();

    // Criar registro de tempo manual
    const timeEntry = await TimeEntry.create({
      ticketId,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      description: description || 'Tempo adicionado manualmente',
      startTime: now,
      endTime: now,
      duration: durationInSeconds,
      isActive: false,
      status: 'stopped',
      totalPausedTime: 0
    });

    // Recarregar com informações do usuário
    await timeEntry.reload({
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    logger.info(`Tempo manual adicionado: ${hours}h no ticket ${ticketId} por ${req.user.name}`);

    // 🔔 NOTIFICAR WATCHERS SOBRE TEMPO MANUAL ADICIONADO
    try {
      const fullTicket = await Ticket.findByPk(ticketId, {
        include: [
          { model: OrganizationUser, as: 'assignee', attributes: ['id', 'name', 'email'] }
        ]
      });

      if (fullTicket) {
        const { notifyTicketWatchers } = await import('../../services/watcherNotificationService.js');
        await notifyTicketWatchers(fullTicket, 'time_added_manually', {
          addedBy: req.user.name,
          hours: parseFloat(hours).toFixed(2),
          description: description || null
        });
        logger.info(`✅ Watchers notificados sobre tempo manual adicionado no ticket ${fullTicket.ticketNumber}`);
      }
    } catch (error) {
      logger.error(`❌ Erro ao notificar watchers sobre tempo manual:`, error);
    }

    res.json({
      success: true,
      entry: timeEntry,
      totalHours: parseFloat(hours).toFixed(2)
    });
  } catch (error) {
    next(error);
  }
}

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

// Listar registros de tempo finalizados (histórico)
export const getTimeEntries = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    // Importar OrganizationUser dinamicamente
    const { OrganizationUser } = await import('../models/index.js');

    // Verificar se ticket existe e pertence à organização
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        organizationId: req.user.organizationId
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Buscar apenas registros finalizados (isActive: false)
    const entries = await TimeEntry.findAll({
      where: {
        ticketId,
        organizationId: req.user.organizationId,
        isActive: false,
        status: 'stopped'
      },
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calcular total de tempo
    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    res.json({
      success: true,
      entries,
      totalSeconds,
      totalHours: (totalSeconds / 3600).toFixed(2)
    });
  } catch (error) {
    next(error);
  }
};


export default {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getActiveTimer,
  getTicketTimers,
  getTimeEntries,
  addManualTime,
  autoConsumeOnTicketComplete
};
