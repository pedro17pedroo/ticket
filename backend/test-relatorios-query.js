// Script para testar a query de relatórios
import { Op, fn, col } from 'sequelize';
import { sequelize } from './src/config/database.js';
import TimeTracking from './src/modules/timeTracking/timeTrackingModel.js';
import { Ticket, OrganizationUser, Client } from './src/modules/models/index.js';

async function testReportsQuery() {
  try {
    console.log('🔍 Testando query de relatórios...\n');

    // 1. Ver todos os registros de time_tracking
    console.log('1️⃣ Buscando todos os registros de time_tracking:');
    const allRecords = await TimeTracking.findAll({
      attributes: ['id', 'ticketId', 'userId', 'organizationId', 'totalSeconds', 'status'],
      limit: 5
    });
    console.log(`   Encontrados: ${allRecords.length} registros`);
    allRecords.forEach(r => {
      console.log(`   - ID: ${r.id}, Ticket: ${r.ticketId}, Seconds: ${r.totalSeconds}, Status: ${r.status}`);
    });

    // 2. Buscar organizationId de um ticket
    console.log('\n2️⃣ Buscando ticket TKT-20260309-4344:');
    const ticket = await Ticket.findOne({
      where: { ticketNumber: 'TKT-20260309-4344' },
      attributes: ['id', 'ticketNumber', 'organizationId']
    });
    
    if (!ticket) {
      console.log('   ❌ Ticket não encontrado!');
      return;
    }
    
    console.log(`   ✅ Ticket encontrado: ${ticket.id}`);
    console.log(`   Organization ID: ${ticket.organizationId}`);

    // 3. Testar query do relatório
    console.log('\n3️⃣ Testando query do relatório (como no controller):');
    const whereClause = { organizationId: ticket.organizationId };

    const report = await TimeTracking.findAll({
      where: whereClause,
      attributes: [
        'ticketId',
        [fn('COUNT', fn('DISTINCT', col('TimeTracking.user_id'))), 'totalUsers'],
        [fn('SUM', col('TimeTracking.total_seconds')), 'totalSeconds'],
        [fn('COUNT', col('TimeTracking.id')), 'totalSessions']
      ],
      include: [
        {
          model: Ticket,
          as: 'ticket',
          attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority', 'clientId'],
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'name'],
              required: false
            }
          ]
        }
      ],
      group: ['ticketId', 'ticket.id', 'ticket->client.id'],
      order: [[fn('SUM', col('TimeTracking.total_seconds')), 'DESC']],
      raw: false
    });

    console.log(`   Resultados: ${report.length} tickets`);
    
    if (report.length === 0) {
      console.log('   ❌ Nenhum resultado retornado!');
      console.log('\n4️⃣ Verificando possíveis problemas:');
      
      // Verificar se há registros com esse organizationId
      const countByOrg = await TimeTracking.count({
        where: { organizationId: ticket.organizationId }
      });
      console.log(`   - Registros com organizationId ${ticket.organizationId}: ${countByOrg}`);
      
      // Verificar se há registros com totalSeconds
      const countWithSeconds = await TimeTracking.count({
        where: { 
          organizationId: ticket.organizationId,
          totalSeconds: { [Op.ne]: null }
        }
      });
      console.log(`   - Registros com totalSeconds não-null: ${countWithSeconds}`);
      
      // Verificar associação com ticket
      const withTicket = await TimeTracking.findAll({
        where: { organizationId: ticket.organizationId },
        include: [
          {
            model: Ticket,
            as: 'ticket',
            required: false
          }
        ],
        limit: 5
      });
      console.log(`   - Registros com associação de ticket: ${withTicket.filter(r => r.ticket).length}/${withTicket.length}`);
      
    } else {
      console.log('   ✅ Resultados encontrados:');
      report.forEach(item => {
        const totalSeconds = parseInt(item.dataValues.totalSeconds) || 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        console.log(`   - Ticket: ${item.ticket.ticketNumber}`);
        console.log(`     Tempo: ${hours}h ${minutes}m (${totalSeconds}s)`);
        console.log(`     Usuários: ${item.dataValues.totalUsers}`);
        console.log(`     Sessões: ${item.dataValues.totalSessions}`);
      });
    }

    console.log('\n✅ Teste concluído!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro ao testar query:');
    console.error(error);
    process.exit(1);
  }
}

testReportsQuery();
