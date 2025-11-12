import express from 'express';
import { Ticket } from '../modules/models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * Debug endpoint para testar queries de tickets
 */
router.get('/debug/tickets', async (req, res) => {
  try {
    const { startDate, endDate, organizationId } = req.query;
    
    console.log('🔍 Debug Tickets Query:', {
      startDate,
      endDate,
      organizationId
    });

    // Query básica - todos os tickets
    const allTickets = await Ticket.findAll({
      attributes: ['id', 'ticketNumber', 'status', 'createdAt', 'organizationId'],
      order: [['createdAt', 'DESC']]
    });

    console.log('📊 Todos os tickets:', allTickets.map(t => ({
      ticketNumber: t.ticketNumber,
      status: t.status,
      createdAt: t.createdAt,
      organizationId: t.organizationId
    })));

    // Query com filtros
    const where = {};
    
    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    console.log('🔍 Where clause:', where);

    const filteredTickets = await Ticket.findAll({
      where,
      attributes: ['id', 'ticketNumber', 'status', 'createdAt', 'organizationId'],
      order: [['createdAt', 'DESC']]
    });

    console.log('✅ Tickets filtrados:', filteredTickets.map(t => ({
      ticketNumber: t.ticketNumber,
      status: t.status,
      createdAt: t.createdAt,
      organizationId: t.organizationId
    })));

    // Contar por status
    const counts = {
      total: await Ticket.count({ where }),
      novo: await Ticket.count({ where: { ...where, status: 'novo' } }),
      em_progresso: await Ticket.count({ where: { ...where, status: 'em_progresso' } }),
      resolvido: await Ticket.count({ where: { ...where, status: 'resolvido' } }),
      fechado: await Ticket.count({ where: { ...where, status: 'fechado' } }),
    };

    console.log('📊 Contadores:', counts);

    res.json({
      success: true,
      debug: {
        query: { startDate, endDate, organizationId },
        where,
        allTickets: allTickets.length,
        filteredTickets: filteredTickets.length,
        counts,
        tickets: filteredTickets.map(t => ({
          ticketNumber: t.ticketNumber,
          status: t.status,
          createdAt: t.createdAt,
          organizationId: t.organizationId
        }))
      }
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
