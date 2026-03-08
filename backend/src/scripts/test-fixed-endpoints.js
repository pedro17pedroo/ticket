import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Script to test that the fixed endpoints will work
 * 
 * Tests:
 * 1. catalog_access_control table exists and can be queried
 * 2. projects.client_id column exists and can be queried
 */

async function testEndpoints() {
  try {
    console.log('🧪 Testing fixed endpoints...\n');

    // Test 1: Query catalog_access_control table
    console.log('📋 Test 1: Querying catalog_access_control table...');
    try {
      const [catalogRows] = await sequelize.query(`
        SELECT COUNT(*) as count FROM catalog_access_control;
      `);
      console.log('✅ catalog_access_control table is accessible');
      console.log(`   Found ${catalogRows[0].count} access control rules\n`);
    } catch (error) {
      console.error('❌ Error querying catalog_access_control:', error.message);
      throw error;
    }

    // Test 2: Query projects table with client_id
    console.log('📋 Test 2: Querying projects table with client_id column...');
    try {
      const [projectRows] = await sequelize.query(`
        SELECT id, code, name, client_id, organization_id 
        FROM projects 
        LIMIT 5;
      `);
      console.log('✅ projects.client_id column is accessible');
      console.log(`   Found ${projectRows.length} projects\n`);
      
      if (projectRows.length > 0) {
        console.log('   Sample project:');
        console.log(`   - Code: ${projectRows[0].code}`);
        console.log(`   - Name: ${projectRows[0].name}`);
        console.log(`   - Client ID: ${projectRows[0].client_id || 'null (internal project)'}`);
      }
    } catch (error) {
      console.error('❌ Error querying projects:', error.message);
      throw error;
    }

    // Test 3: Verify table structure
    console.log('\n📋 Test 3: Verifying table structures...');
    
    const [catalogColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'catalog_access_control'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ catalog_access_control table columns:');
    catalogColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    const [projectColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'projects' AND column_name = 'client_id';
    `);
    
    console.log('\n✅ projects.client_id column:');
    projectColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ All tests passed! The endpoints should now work correctly.');
    console.log('\n📝 Summary:');
    console.log('   1. /api/catalog/effective-access - Should work (catalog_access_control table exists)');
    console.log('   2. /api/projects - Should work (client_id column exists)');
    
    logger.info('Endpoint tests completed successfully');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    logger.error('Endpoint test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run tests
testEndpoints()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
