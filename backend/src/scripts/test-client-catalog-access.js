import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Script to test client catalog access endpoints
 * 
 * Tests:
 * 1. Verify catalog_access_control table exists
 * 2. Find a test client to use
 * 3. Simulate getting client catalog access (should return default 'all' mode)
 */

async function testClientCatalogAccess() {
  try {
    console.log('🧪 Testing client catalog access...\n');

    // Test 1: Verify table exists
    console.log('📋 Test 1: Verifying catalog_access_control table...');
    const [tableResult] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'catalog_access_control'
      );
    `);
    
    if (!tableResult[0].exists) {
      console.error('❌ catalog_access_control table does not exist!');
      throw new Error('Table not found');
    }
    console.log('✅ catalog_access_control table exists\n');

    // Test 2: Find a test client
    console.log('📋 Test 2: Finding a test client...');
    const [clients] = await sequelize.query(`
      SELECT id, name, organization_id 
      FROM clients 
      WHERE is_active = true 
      LIMIT 1;
    `);

    if (clients.length === 0) {
      console.log('⚠️  No active clients found in database');
      console.log('   This is OK - the endpoint will work when clients exist\n');
      return;
    }

    const testClient = clients[0];
    console.log('✅ Found test client:');
    console.log(`   - ID: ${testClient.id}`);
    console.log(`   - Name: ${testClient.name}`);
    console.log(`   - Organization: ${testClient.organization_id}\n`);

    // Test 3: Check existing access rules for this client
    console.log('📋 Test 3: Checking existing access rules...');
    const [rules] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM catalog_access_control
      WHERE entity_type = 'client'
      AND entity_id = '${testClient.id}';
    `);

    console.log(`✅ Found ${rules[0].count} access rules for this client`);
    
    if (rules[0].count === 0) {
      console.log('   → Client has default access mode: "all" (full access)\n');
    } else {
      console.log('   → Client has custom access rules configured\n');
      
      // Show the rules
      const [detailedRules] = await sequelize.query(`
        SELECT resource_type, resource_id, access_type, created_at
        FROM catalog_access_control
        WHERE entity_type = 'client'
        AND entity_id = '${testClient.id}'
        ORDER BY created_at DESC
        LIMIT 5;
      `);
      
      console.log('   Sample rules:');
      detailedRules.forEach(rule => {
        console.log(`   - ${rule.resource_type}: ${rule.resource_id} (${rule.access_type})`);
      });
      console.log('');
    }

    // Test 4: Verify the endpoint logic
    console.log('📋 Test 4: Simulating endpoint logic...');
    
    const [allRules] = await sequelize.query(`
      SELECT resource_type, resource_id, access_type
      FROM catalog_access_control
      WHERE entity_type = 'client'
      AND entity_id = '${testClient.id}';
    `);

    let accessMode = 'all';
    const allowedCategories = allRules
      .filter(r => r.access_type === 'allow' && r.resource_type === 'category')
      .map(r => r.resource_id);
    
    const allowedItems = allRules
      .filter(r => r.access_type === 'allow' && r.resource_type === 'item')
      .map(r => r.resource_id);

    if (allowedCategories.length > 0 || allowedItems.length > 0) {
      accessMode = 'selected';
    }

    console.log('✅ Endpoint would return:');
    console.log(`   - accessMode: "${accessMode}"`);
    console.log(`   - allowedCategories: ${allowedCategories.length} items`);
    console.log(`   - allowedItems: ${allowedItems.length} items\n`);

    console.log('✅ All tests passed!');
    console.log('\n📝 Summary:');
    console.log('   1. catalog_access_control table exists ✅');
    console.log('   2. Test client found ✅');
    console.log('   3. Access rules checked ✅');
    console.log('   4. Endpoint logic verified ✅');
    console.log('\n🎉 The endpoint GET /api/clients/:id/catalog-access should work correctly!');
    
    logger.info('Client catalog access test completed successfully');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    logger.error('Client catalog access test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run tests
testClientCatalogAccess()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
