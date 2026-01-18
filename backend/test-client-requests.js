/**
 * Teste: Verificar se tickets de email aparecem para o cliente
 */

import { Ticket, ClientUser, CatalogItem } from './src/modules/models/index.js';
import { ServiceRequest } from './src/modules/catalog/catalogModelSimple.js';
import { Op } from 'sequelize';

async function testClientRequests() {
  try {
    console.log('🔍 Testando busca de tickets para cliente...\n');

    // 1. Buscar cliente
    const clientEmail = 'pedro.nekaka@gmail.com';
    const client = await ClientUser.findOne({
      where: { email: clientEmail }
    });

    if (!client) {
      console.error('❌ Cliente não encontrado:', clientEmail);
      process.exit(1);
    }

    console.log('✅ Cliente encontrado:');
    console.log(`   ID: ${client.id}`);
    console.log(`   Nome: ${client.name}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Role: ${client.role}\n`);

    // 2. Buscar service_requests
    console.log('📋 Buscando service_requests...');
    const serviceRequests = await ServiceRequest.findAll({
      where: {
        organizationId: client.organizationId,
        userId: client.id
      },
      include: [
        {
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'icon']
        }
      ]
    });
    console.log(`   Encontrados: ${serviceRequests.length}\n`);

    // 3. Buscar tickets diretos (sem service_request)
    console.log('🎫 Buscando tickets diretos...');
    const directTickets = await Ticket.findAll({
      where: {
        organizationId: client.organizationId,
        requesterClientUserId: client.id
      }
    });

    console.log(`   Total de tickets: ${directTickets.length}`);

    // Filtrar tickets sem service_request
    const ticketsWithoutRequest = [];
    for (const ticket of directTickets) {
      const hasRequest = await ServiceRequest.findOne({
        where: { ticketId: ticket.id }
      });
      if (!hasRequest) {
        ticketsWithoutRequest.push(ticket);
      }
    }

    console.log(`   Tickets sem service_request: ${ticketsWithoutRequest.length}\n`);

    // 4. Mostrar detalhes
    if (ticketsWithoutRequest.length > 0) {
      console.log('📝 Detalhes dos tickets diretos:');
      ticketsWithoutRequest.forEach((ticket, index) => {
        console.log(`\n   ${index + 1}. ${ticket.ticketNumber}`);
        console.log(`      Assunto: ${ticket.subject}`);
        console.log(`      Source: ${ticket.source}`);
        console.log(`      Status: ${ticket.status}`);
        console.log(`      Catalog Item: ${ticket.catalogItem?.name || 'Nenhum'}`);
        console.log(`      Criado: ${ticket.createdAt}`);
      });
    }

    // 5. Total combinado
    const total = serviceRequests.length + ticketsWithoutRequest.length;
    console.log(`\n✅ Total de solicitações que devem aparecer: ${total}`);
    console.log(`   - Service Requests: ${serviceRequests.length}`);
    console.log(`   - Tickets Diretos: ${ticketsWithoutRequest.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testClientRequests();
