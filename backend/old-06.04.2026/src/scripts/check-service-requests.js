import { sequelize } from '../config/database.js';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        // Check statistics
        const [results] = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as total,
        COUNT(ticket_id) as with_ticket,
        COUNT(*) - COUNT(ticket_id) as without_ticket
      FROM service_requests
      GROUP BY status
      ORDER BY status;
    `);

        console.log('\n📊 Service Requests Statistics:\n');
        console.table(results);

        // Show sample records
        const [samples] = await sequelize.query(`
      SELECT 
        id,
        status,
        ticket_id,
        created_at
      FROM service_requests
      WHERE ticket_id IS NULL
      LIMIT 5;
    `);

        console.log('\n📋 Sample requests WITHOUT ticketId:\n');
        console.table(samples);

        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
};

run();
