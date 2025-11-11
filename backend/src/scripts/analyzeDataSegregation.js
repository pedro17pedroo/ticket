import { sequelize } from '../config/database.js';
import { User } from '../modules/models/index.js';

async function analyzeDataSegregation() {
  try {
    console.log('\n🔍 ANÁLISE DE SEGREGAÇÃO DE DADOS\n');
    console.log('='.repeat(80));

    // 1. Verificar usuários
    console.log('\n1️⃣  USUÁRIOS');
    console.log('-'.repeat(80));
    
    const adminOrg = await User.findOne({ where: { email: 'admin@empresademo.com' } });
    const adminClient = await User.findOne({ where: { email: 'admin@acme.pt' } });

    if (adminOrg) {
      console.log('\n👤 Administrador Organização (admin@empresademo.com):');
      console.log(`   ID: ${adminOrg.id}`);
      console.log(`   Role: ${adminOrg.role}`);
      console.log(`   OrganizationId: ${adminOrg.organizationId}`);
      console.log(`   ClientId: ${adminOrg.clientId || 'null'}`);
    }

    if (adminClient) {
      console.log('\n👤 Administrador Cliente (admin@acme.pt):');
      console.log(`   ID: ${adminClient.id}`);
      console.log(`   Role: ${adminClient.role}`);
      console.log(`   OrganizationId: ${adminClient.organizationId}`);
      console.log(`   ClientId: ${adminClient.clientId || 'null'}`);
    }

    // 2. Verificar Service Requests
    console.log('\n\n2️⃣  SERVICE REQUESTS');
    console.log('-'.repeat(80));

    const [requestStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(ticket_id) as com_ticket,
        COUNT(*) - COUNT(ticket_id) as sem_ticket,
        organization_id,
        status
      FROM service_requests
      GROUP BY organization_id, status
      ORDER BY organization_id, status
    `);

    console.log('\n📊 Estatísticas por Organização e Status:');
    requestStats.forEach(stat => {
      console.log(`   Org: ${stat.organization_id}`);
      console.log(`   Status: ${stat.status}`);
      console.log(`   Total: ${stat.total} | Com Ticket: ${stat.com_ticket} | Sem Ticket: ${stat.sem_ticket}`);
      console.log();
    });

    // Detalhes dos requests do cliente ACME
    if (adminClient && adminClient.clientId) {
      const [clientRequests] = await sequelize.query(`
        SELECT 
          sr.id,
          sr.status,
          sr.ticket_id,
          sr.user_id,
          sr.organization_id,
          sr.created_at,
          u.email as user_email,
          u.client_id as user_client_id
        FROM service_requests sr
        LEFT JOIN users u ON sr.user_id = u.id
        WHERE u.client_id = :clientId
        ORDER BY sr.created_at DESC
        LIMIT 5
      `, {
        replacements: { clientId: adminClient.clientId }
      });

      console.log('\n📝 Primeiras 5 solicitações do cliente ACME:');
      clientRequests.forEach((req, idx) => {
        console.log(`   ${idx + 1}. ID: ${req.id.substring(0, 8)}...`);
        console.log(`      User: ${req.user_email}`);
        console.log(`      Status: ${req.status}`);
        console.log(`      TicketId: ${req.ticket_id ? req.ticket_id.substring(0, 8) + '...' : 'NULL'}`);
        console.log(`      OrgId: ${req.organization_id}`);
        console.log();
      });
    }

    // 3. Verificar Tickets
    console.log('\n3️⃣  TICKETS');
    console.log('-'.repeat(80));

    const [ticketStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        organization_id,
        status
      FROM tickets
      GROUP BY organization_id, status
      ORDER BY organization_id, status
    `);

    console.log('\n🎫 Estatísticas de Tickets por Organização e Status:');
    ticketStats.forEach(stat => {
      console.log(`   Org: ${stat.organization_id}`);
      console.log(`   Status: ${stat.status}`);
      console.log(`   Total: ${stat.total}`);
      console.log();
    });

    // Verificar se tickets têm client_id correto
    const [ticketsWithClient] = await sequelize.query(`
      SELECT 
        t.id,
        t.ticket_number,
        t.status,
        t.organization_id,
        t.client_id,
        t.requester_user_id,
        u.email as requester_email,
        u.client_id as requester_client_id
      FROM tickets t
      LEFT JOIN users u ON t.requester_user_id = u.id
      WHERE t.organization_id = :orgId
      ORDER BY t.created_at DESC
      LIMIT 10
    `, {
      replacements: { orgId: adminOrg?.organizationId }
    });

    console.log('\n🎫 Últimos 10 tickets da organização:');
    ticketsWithClient.forEach((ticket, idx) => {
      console.log(`   ${idx + 1}. ${ticket.ticket_number}`);
      console.log(`      Status: ${ticket.status}`);
      console.log(`      Requester: ${ticket.requester_email}`);
      console.log(`      Ticket.ClientId: ${ticket.client_id || 'NULL'}`);
      console.log(`      Requester.ClientId: ${ticket.requester_client_id || 'NULL'}`);
      console.log();
    });

    // 4. Verificar relação ServiceRequest <-> Ticket
    console.log('\n4️⃣  RELAÇÃO SERVICE_REQUEST <-> TICKET');
    console.log('-'.repeat(80));

    const [orphanRequests] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM service_requests
      WHERE ticket_id IS NULL
    `);

    const [orphanTickets] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM tickets t
      WHERE NOT EXISTS (
        SELECT 1 FROM service_requests sr WHERE sr.ticket_id = t.id
      )
    `);

    console.log(`\n📊 Service Requests sem Ticket: ${orphanRequests[0].count}`);
    console.log(`📊 Tickets sem Service Request: ${orphanTickets[0].count}`);

    // 5. Verificar filtros
    console.log('\n\n5️⃣  VERIFICAÇÃO DE FILTROS');
    console.log('-'.repeat(80));

    if (adminClient && adminClient.clientId) {
      // Simular query do endpoint de requests do cliente
      const [filteredRequests] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM service_requests sr
        INNER JOIN users u ON sr.user_id = u.id
        WHERE sr.organization_id = :orgId
        AND u.client_id = :clientId
      `, {
        replacements: { 
          orgId: adminClient.organizationId,
          clientId: adminClient.clientId
        }
      });

      console.log(`\n✅ Requests do cliente ACME (com filtro correto): ${filteredRequests[0].count}`);
    }

    if (adminOrg) {
      // Simular query do endpoint de tickets da organização
      const [orgTickets] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM tickets
        WHERE organization_id = :orgId
      `, {
        replacements: { orgId: adminOrg.organizationId }
      });

      console.log(`✅ Tickets da organização (sem filtro de cliente): ${orgTickets[0].count}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Análise concluída!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    process.exit(1);
  }
}

analyzeDataSegregation();
