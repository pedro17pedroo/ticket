import { sequelize } from './src/config/database.js';
import { Ticket, CatalogItem, CatalogCategory, Comment, Attachment, OrganizationUser, ClientUser, User, Direction, Department, Section } from './src/modules/models/index.js';

async function testTicketQuery() {
  try {
    console.log('🧪 Testando query de ticket com Sequelize...\n');

    const ticketId = '88289303-33e3-4266-ad14-63ddbc86ceec';
    
    console.log('1️⃣ Query simples sem includes...');
    const ticket1 = await Ticket.findByPk(ticketId);
    console.log('✅ Query simples funcionou!', ticket1 ? 'Ticket encontrado' : 'Ticket não encontrado');

    console.log('\n2️⃣ Query com CatalogItem include...');
    const ticket2 = await Ticket.findOne({
      where: { id: ticketId },
      include: [{
        model: CatalogItem,
        as: 'catalogItem',
        attributes: ['id', 'name', 'shortDescription', 'priorityId'],
        required: false
      }]
    });
    console.log('✅ Query com CatalogItem funcionou!');

    console.log('\n3️⃣ Query com CatalogCategory include...');
    const ticket3 = await Ticket.findOne({
      where: { id: ticketId },
      include: [{
        model: CatalogCategory,
        as: 'catalogCategory',
        attributes: ['id', 'name', 'color', 'icon'],
        required: false
      }]
    });
    console.log('✅ Query com CatalogCategory funcionou!');

    console.log('\n4️⃣ Query com Comments include...');
    const ticket4 = await Ticket.findOne({
      where: { id: ticketId },
      include: [{
        model: Comment,
        as: 'comments',
        required: false
      }]
    });
    console.log('✅ Query com Comments funcionou!');

    console.log('\n5️⃣ Query completa (como no controller)...');
    const ticket5 = await Ticket.findOne({
      where: { id: ticketId },
      include: [
        {
          model: OrganizationUser,
          as: 'requesterOrgUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: ClientUser,
          as: 'requesterClientUser',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: CatalogCategory,
          as: 'catalogCategory',
          attributes: ['id', 'name', 'color', 'icon'],
          required: false
        },
        {
          model: CatalogItem,
          as: 'catalogItem',
          attributes: ['id', 'name', 'shortDescription', 'priorityId'],
          required: false
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: Attachment,
              as: 'attachments',
              attributes: ['id', 'filename', 'originalName'],
              required: false
            }
          ],
          required: false
        }
      ]
    });
    console.log('✅ Query completa funcionou!');
    
    console.log('\n✅ Todos os testes passaram!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testTicketQuery();
