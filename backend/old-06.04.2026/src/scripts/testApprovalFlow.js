import { sequelize } from '../config/database.js';

async function testApprovalFlow() {
  console.log('🔍 Testando fluxo de aprovação...\n');

  try {
    // 1. Buscar solicitações pendentes
    const [pendingRequests] = await sequelize.query(`
      SELECT 
        sr.id,
        sr.status as request_status,
        sr.ticket_id,
        t.ticket_number,
        t.status as ticket_status,
        ci.name as item_name,
        ci.requires_approval
      FROM service_requests sr
      LEFT JOIN tickets t ON sr.ticket_id = t.id
      LEFT JOIN catalog_items ci ON sr.catalog_item_id = ci.id
      WHERE sr.status = 'pending'
      ORDER BY sr.created_at DESC
      LIMIT 10
    `);

    console.log(`📊 Solicitações pendentes: ${pendingRequests.length}\n`);

    if (pendingRequests.length === 0) {
      console.log('ℹ️  Não há solicitações pendentes no momento.\n');
      console.log('💡 Para testar:');
      console.log('   1. Acesse o portal do cliente (localhost:5174)');
      console.log('   2. Solicite um item que REQUER APROVAÇÃO');
      console.log('   3. Verifique se aparece em Aprovações (localhost:5173/catalog/approvals)\n');
      return;
    }

    pendingRequests.forEach((req, index) => {
      console.log(`${index + 1}. 📝 Solicitação ID: ${req.id}`);
      console.log(`   Item: ${req.item_name}`);
      console.log(`   Requer Aprovação: ${req.requires_approval ? '✓ Sim' : '✗ Não'}`);
      console.log(`   Status da Solicitação: ${req.request_status}`);
      console.log(`   Ticket: ${req.ticket_number || 'N/A'}`);
      console.log(`   Status do Ticket: ${req.ticket_status || 'N/A'}`);
      console.log('');
    });

    // 2. Verificar tickets aguardando aprovação
    const [pendingTickets] = await sequelize.query(`
      SELECT 
        t.id,
        t.ticket_number,
        t.status,
        sr.id as request_id,
        ci.name as item_name
      FROM tickets t
      INNER JOIN service_requests sr ON t.id = sr.ticket_id
      INNER JOIN catalog_items ci ON sr.catalog_item_id = ci.id
      WHERE t.status = 'aguardando_aprovacao'
      ORDER BY t.created_at DESC
    `);

    console.log(`\n🎫 Tickets aguardando aprovação: ${pendingTickets.length}`);
    
    if (pendingTickets.length > 0) {
      console.log('');
      pendingTickets.forEach((ticket, index) => {
        console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.item_name}`);
      });
    }

    console.log('\n✅ Resumo:');
    console.log(`   - Solicitações pendentes: ${pendingRequests.length}`);
    console.log(`   - Tickets aguardando aprovação: ${pendingTickets.length}`);
    
    if (pendingRequests.length > 0 && pendingTickets.length > 0) {
      console.log('\n✓ Sistema funcionando corretamente!');
      console.log('  Solicitações com aprovação estão gerando tickets com status "aguardando_aprovacao"');
    } else if (pendingRequests.length > 0 && pendingTickets.length === 0) {
      console.log('\n⚠️  ATENÇÃO: Há solicitações pendentes mas nenhum ticket aguardando aprovação!');
      console.log('   Verifique se os items têm "requires_approval = true"');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

testApprovalFlow();
