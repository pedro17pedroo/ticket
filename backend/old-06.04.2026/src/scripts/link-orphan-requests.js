import { sequelize } from '../config/database.js';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        // Try to link service requests to tickets based on catalog_item_id and timestamps
        const [orphanRequests] = await sequelize.query(`
      SELECT 
        sr.id as request_id,
        sr.catalog_item_id,
        sr.created_at as request_created_at,
        sr.status
      FROM service_requests sr
      WHERE sr.ticket_id IS NULL
      ORDER BY sr.created_at DESC;
    `);

        console.log(`\n📋 Found ${orphanRequests.length} service requests without tickets\n`);

        for (const request of orphanRequests) {
            // Try to find a matching ticket
            const [matchingTickets] = await sequelize.query(`
        SELECT 
          id,
          ticket_number,
          catalog_item_id,
          created_at,
          status
        FROM tickets
        WHERE catalog_item_id = :catalogItemId
          AND created_at >= :requestCreatedAt::timestamp - interval '5 minutes'
          AND created_at <= :requestCreatedAt::timestamp + interval '5 minutes'
        ORDER BY created_at ASC
        LIMIT 1;
      `, {
                replacements: {
                    catalogItemId: request.catalog_item_id,
                    requestCreatedAt: request.request_created_at
                }
            });

            if (matchingTickets.length > 0) {
                const ticket = matchingTickets[0];

                // Update service request with ticket_id
                await sequelize.query(`
          UPDATE service_requests
          SET ticket_id = :ticketId
          WHERE id = :requestId;
        `, {
                    replacements: {
                        ticketId: ticket.id,
                        requestId: request.request_id
                    }
                });

                console.log(`✅ Linked request ${request.request_id.slice(0, 8)} → ticket ${ticket.ticket_number}`);
            } else {
                console.log(`⚠️  No matching ticket found for request ${request.request_id.slice(0, 8)}`);
            }
        }

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
};

run();
