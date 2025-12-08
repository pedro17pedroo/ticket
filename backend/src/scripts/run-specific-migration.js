import { sequelize } from '../config/database.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const migration = require('../database/migrations/20251203-update-service-requests-for-clients.cjs');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        const queryInterface = sequelize.getQueryInterface();
        console.log('🚀 Running migration...');

        await migration.up(queryInterface, sequelize);

        console.log('✅ Migration executed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

run();
