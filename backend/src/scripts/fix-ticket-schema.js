import { sequelize } from '../config/database.js';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        const queryInterface = sequelize.getQueryInterface();

        // 1. Verificar schema atual
        console.log('🔍 Checking tickets table schema...');
        const tableInfo = await queryInterface.describeTable('tickets');
        console.log('📋 requester_id attributes:', JSON.stringify(tableInfo.requester_id, null, 2));

        // 2. Corrigir requester_id para ser nullable (Raw SQL para garantir)
        console.log('🛠 Fixing requester_id to be nullable...');
        await sequelize.query('ALTER TABLE tickets ALTER COLUMN requester_id DROP NOT NULL;');
        console.log('✅ Executed: ALTER TABLE tickets ALTER COLUMN requester_id DROP NOT NULL;');

        // 3. Verificar novamente
        const updatedTableInfo = await queryInterface.describeTable('tickets');
        console.log('📋 Updated requester_id attributes:', JSON.stringify(updatedTableInfo.requester_id, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
};

run();
