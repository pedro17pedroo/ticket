import { sequelize } from '../config/database.js';

async function resetData() {
  try {
    console.log('\n🗑️  LIMPANDO DADOS DO SISTEMA\n');
    console.log('='.repeat(80));

    // 1. Limpar Service Requests
    console.log('\n1️⃣  Limpando Service Requests...');
    const [deletedRequests] = await sequelize.query(`
      DELETE FROM service_requests
      RETURNING id
    `);
    console.log(`   ✅ ${deletedRequests.length} service requests removidos`);

    // 2. Limpar Tickets
    console.log('\n2️⃣  Limpando Tickets...');
    const [deletedTickets] = await sequelize.query(`
      DELETE FROM tickets
      RETURNING id
    `);
    console.log(`   ✅ ${deletedTickets.length} tickets removidos`);

    // 3. Limpar Comments
    console.log('\n3️⃣  Limpando Comments...');
    const [deletedComments] = await sequelize.query(`
      DELETE FROM comments
      RETURNING id
    `);
    console.log(`   ✅ ${deletedComments.length} comentários removidos`);

    // 4. Limpar Activities (se existir)
    console.log('\n4️⃣  Limpando Activities...');
    try {
      const [deletedActivities] = await sequelize.query(`
        DELETE FROM activities
        RETURNING id
      `);
      console.log(`   ✅ ${deletedActivities.length} atividades removidas`);
    } catch (error) {
      console.log(`   ⚠️  Tabela activities não existe ou está vazia`);
    }

    // 5. Limpar Attachments relacionados a tickets
    console.log('\n5️⃣  Limpando Attachments de tickets...');
    const [deletedAttachments] = await sequelize.query(`
      DELETE FROM attachments
      WHERE ticket_id IS NOT NULL
      RETURNING id
    `);
    console.log(`   ✅ ${deletedAttachments.length} anexos removidos`);

    // 6. Limpar Notifications (se existir)
    console.log('\n6️⃣  Limpando Notifications...');
    try {
      const [deletedNotifications] = await sequelize.query(`
        DELETE FROM notifications
        RETURNING id
      `);
      console.log(`   ✅ ${deletedNotifications.length} notificações removidas`);
    } catch (error) {
      console.log(`   ⚠️  Tabela notifications não existe ou está vazia`);
    }

    // 7. Resetar sequências
    console.log('\n7️⃣  Resetando sequências...');
    await sequelize.query(`
      SELECT setval(pg_get_serial_sequence('tickets', 'id'), 1, false);
    `);
    console.log('   ✅ Sequência de tickets resetada');

    // 8. Verificar dados mantidos
    console.log('\n8️⃣  Verificando dados mantidos...');
    
    const [users] = await sequelize.query(`SELECT COUNT(*) as count FROM users`);
    console.log(`   👥 Usuários mantidos: ${users[0].count}`);
    
    const [orgs] = await sequelize.query(`SELECT COUNT(*) as count FROM organizations`);
    console.log(`   🏢 Organizações mantidas: ${orgs[0].count}`);
    
    const [clients] = await sequelize.query(`SELECT COUNT(*) as count FROM clients`);
    console.log(`   🏪 Clientes mantidos: ${clients[0].count}`);
    
    const [catalogItems] = await sequelize.query(`SELECT COUNT(*) as count FROM catalog_items`);
    console.log(`   📋 Items do Catálogo mantidos: ${catalogItems[0].count}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Limpeza concluída! O sistema está pronto para novos dados.\n');
    console.log('📝 Mantidos: Usuários, Organizações, Clientes e Catálogo de Serviços');
    console.log('🗑️  Removidos: Tickets, Service Requests, Comentários, Atividades e Notificações\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

resetData();
