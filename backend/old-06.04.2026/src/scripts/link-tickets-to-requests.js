import { sequelize } from '../config/database.js';
import { ServiceRequest } from '../modules/catalog/catalogModel.js';
import Ticket from '../modules/tickets/ticketModel.js';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        // Find all service requests without ticketId
        const requestsWithoutTicket = await ServiceRequest.findAll({
            where: { ticketId: null }
        });

        console.log(`📋 Found ${requestsWithoutTicket.length} service requests without ticketId`);

        let linked = 0;
        let notFound = 0;

        for (const request of requestsWithoutTicket) {
            // Try to find ticket by service_request_id
            const ticket = await Ticket.findOne({
                where: { serviceRequestId: request.id }
            });

            if (ticket) {
                await request.update({ ticketId: ticket.id });
                console.log(`✅ Linked service request ${request.id.slice(0, 8)} to ticket ${ticket.ticketNumber}`);
                linked++;
            } else {
                console.log(`⚠️  No ticket found for service request ${request.id.slice(0, 8)}`);
                notFound++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`  ✅ Linked: ${linked}`);
        console.log(`  ⚠️  Not found: ${notFound}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
};

run();
