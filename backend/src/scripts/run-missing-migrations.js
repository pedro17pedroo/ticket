import { sequelize } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script to run missing migrations
 * 
 * This script runs the following migrations:
 * 1. 20260302000001-create-catalog-access-control.sql - Creates catalog_access_control table
 * 2. 20260302000002-add-client-id-to-projects.sql - Adds client_id column to projects table
 */

async function runMigrations() {
  try {
    console.log('🚀 Starting missing migrations...\n');

    // Migration 1: Create catalog_access_control table
    console.log('📋 Migration 1: Creating catalog_access_control table...');
    const catalogMigrationPath = path.join(__dirname, '../../migrations/20260302000001-create-catalog-access-control.sql');
    const catalogMigrationSQL = fs.readFileSync(catalogMigrationPath, 'utf8');
    
    await sequelize.query(catalogMigrationSQL);
    console.log('✅ catalog_access_control table created successfully\n');

    // Migration 2: Add client_id to projects table
    console.log('📋 Migration 2: Adding client_id column to projects table...');
    const projectMigrationPath = path.join(__dirname, '../../migrations/20260302000002-add-client-id-to-projects.sql');
    const projectMigrationSQL = fs.readFileSync(projectMigrationPath, 'utf8');
    
    await sequelize.query(projectMigrationSQL);
    console.log('✅ client_id column added to projects table successfully\n');

    // Verify migrations
    console.log('🔍 Verifying migrations...\n');

    const [catalogResult] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'catalog_access_control'
      );
    `);
    console.log('catalog_access_control table exists:', catalogResult[0].exists);

    const [projectResult] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'client_id'
      );
    `);
    console.log('projects.client_id column exists:', projectResult[0].exists);

    if (catalogResult[0].exists && projectResult[0].exists) {
      console.log('\n✅ All migrations completed successfully!');
      logger.info('Missing migrations completed successfully');
    } else {
      console.log('\n⚠️  Some migrations may have failed. Please check the logs.');
      logger.warn('Some migrations may have failed');
    }

  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    logger.error('Error running migrations:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
