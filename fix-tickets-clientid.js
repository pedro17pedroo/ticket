import { sequelize } from './backend/src/config/database.js';

async function fixTicketsClientId() {
  try {
    console.log('🔧 Corrigindo tickets sem clientId...');
    
    // Atualizar tickets
    const [results] = await sequelize.query(`
      UPDATE tickets t
      SET client_id = cu.client_id
      FROM client_users cu
      WHERE t.requester_client_user_id = cu.id
        AND t.client_id IS NULL
        AND t.requester_type = 'client'
    `);
    
    console.log(`✅ ${results.rowCount || 0} tickets atualizados`);
    
    // Verificar tickets corrigidos
    const [corrected] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM tickets t
      JOIN client_users cu ON t.requester_client_user_id = cu.id
      WHERE t.requester_type = 'client'
        AND t.client_id = cu.client_id
    `);
    
    console.log(`✅ Total de tickets com clientId correto: ${corrected[0].count}`);
    
    // Verificar se ainda há tickets sem clientId
    const [remaining] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE requester_type = 'client'
        AND client_id IS NULL
    `);
    
    console.log(`⚠️  Tickets ainda sem clientId: ${remaining[0].count}`);
    
    if (remaining[0].count > 0) {
      // Listar tickets problemáticos
      const [problematic] = await sequelize.query(`
        SELECT 
          t.id,
          t.ticket_number,
          t.requester_client_user_id,
          cu.email as requester_email,
          cu.client_id as requester_client_id
        FROM tickets t
        LEFT JOIN client_users cu ON t.requester_client_user_id = cu.id
        WHERE t.requester_type = 'client'
          AND t.client_id IS NULL
        LIMIT 5
      `);
      
      console.log('\n⚠️  Tickets problemáticos (primeiros 5):');
      problematic.forEach(t => {
        console.log(`  - ${t.ticket_number}: requester=${t.requester_email}, clientId=${t.requester_client_id}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixTicketsClientId();
