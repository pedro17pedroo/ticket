import { sequelize } from '../config/database.js';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        const queryInterface = sequelize.getQueryInterface();

        // 1. Verificar schema atual
        console.log('🔍 Checking service_requests table schema...');
        const tableInfo = await queryInterface.describeTable('service_requests');
        console.log('📋 user_id attributes:', JSON.stringify(tableInfo.user_id, null, 2));
        console.log('📋 client_user_id attributes:', JSON.stringify(tableInfo.client_user_id, null, 2));

        // 2. Corrigir user_id para ser nullable (Raw SQL para garantir)
        console.log('🛠 Fixing user_id to be nullable...');
        await sequelize.query('ALTER TABLE service_requests ALTER COLUMN user_id DROP NOT NULL;');
        console.log('✅ Executed: ALTER TABLE service_requests ALTER COLUMN user_id DROP NOT NULL;');

        // 3. Verificar novamente
        const updatedTableInfo = await queryInterface.describeTable('service_requests');
        console.log('📋 Updated user_id attributes:', JSON.stringify(updatedTableInfo.user_id, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
};

run();
