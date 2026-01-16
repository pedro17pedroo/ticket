import express from 'express';
import { sequelize } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * Endpoint para corrigir tickets sem clientId
 * Preenche o clientId baseado no requesterClientUserId
 * NOTA: Em produção, adicionar autenticação
 */
router.post('/fix-tickets-clientid', async (req, res) => {
  try {
    logger.info(`🔧 Iniciando correção de tickets sem clientId`);
    
    // Contar tickets antes da correção
    const [beforeCount] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE requester_type = 'client'
        AND client_id IS NULL
        AND requester_client_user_id IS NOT NULL
    `);
    
    logger.info(`📊 Tickets a corrigir: ${beforeCount[0].count}`);
    
    // Atualizar tickets - preencher clientId baseado no requesterClientUserId
    const [results] = await sequelize.query(`
      UPDATE tickets t
      SET client_id = cu.client_id
      FROM client_users cu
      WHERE t.requester_client_user_id = cu.id
        AND t.client_id IS NULL
        AND t.requester_type = 'client'
        AND cu.client_id IS NOT NULL
    `);
    
    const updatedCount = results?.rowCount || parseInt(beforeCount[0].count);
    logger.info(`✅ ${updatedCount} tickets atualizados`);
    
    // Verificar tickets corrigidos
    const [corrected] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM tickets t
      WHERE t.requester_type = 'client'
        AND t.client_id IS NOT NULL
    `);
    
    const correctedCount = parseInt(corrected[0].count);
    logger.info(`✅ Total de tickets de clientes com clientId: ${correctedCount}`);
    
    // Verificar se ainda há tickets sem clientId
    const [remaining] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE requester_type = 'client'
        AND client_id IS NULL
    `);
    
    const remainingCount = parseInt(remaining[0].count);
    logger.info(`⚠️  Tickets ainda sem clientId: ${remainingCount}`);
    
    let problematicTickets = [];
    if (remainingCount > 0) {
      // Listar tickets problemáticos
      const [problematic] = await sequelize.query(`
        SELECT 
          t.id,
          t.ticket_number,
          t.requester_type,
          t.requester_client_user_id,
          cu.email as requester_email,
          cu.client_id as requester_client_id
        FROM tickets t
        LEFT JOIN client_users cu ON t.requester_client_user_id = cu.id
        WHERE t.requester_type = 'client'
          AND t.client_id IS NULL
        LIMIT 10
      `);
      
      problematicTickets = problematic;
      logger.warn('⚠️  Tickets problemáticos encontrados:', problematic);
    }
    
    res.json({
      success: true,
      message: 'Correção executada com sucesso',
      stats: {
        ticketsToFix: parseInt(beforeCount[0].count),
        updated: updatedCount,
        totalWithClientId: correctedCount,
        remaining: remainingCount
      },
      problematicTickets: problematicTickets.length > 0 ? problematicTickets : undefined
    });
  } catch (error) {
    logger.error('❌ Erro ao corrigir tickets:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Endpoint para verificar status dos campos legados
 */
router.get('/check-legacy-fields', async (req, res) => {
  try {
    // Verificar uso de requesterId vs campos polimórficos
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(requester_id) as with_requester_id,
        COUNT(requester_user_id) as with_requester_user_id,
        COUNT(requester_org_user_id) as with_requester_org_user_id,
        COUNT(requester_client_user_id) as with_requester_client_user_id,
        COUNT(client_id) as with_client_id,
        COUNT(CASE WHEN requester_type = 'client' THEN 1 END) as client_tickets,
        COUNT(CASE WHEN requester_type = 'organization' THEN 1 END) as org_tickets,
        COUNT(CASE WHEN requester_type = 'provider' THEN 1 END) as provider_tickets
      FROM tickets
    `);
    
    // Verificar tickets com requesterId mas sem campos polimórficos
    const [orphaned] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE requester_id IS NOT NULL
        AND requester_user_id IS NULL
        AND requester_org_user_id IS NULL
        AND requester_client_user_id IS NULL
    `);
    
    res.json({
      stats: stats[0],
      orphanedTickets: parseInt(orphaned[0].count),
      recommendation: parseInt(orphaned[0].count) === 0 
        ? 'Campos legados podem ser removidos com segurança'
        : 'Existem tickets que ainda dependem do campo requesterId legado'
    });
  } catch (error) {
    logger.error('❌ Erro ao verificar campos legados:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
