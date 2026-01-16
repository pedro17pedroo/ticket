import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createRBACTables() {
  try {
    console.log('🔧 Criando tabelas RBAC...\n');

    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados!');

    // Create permissions table
    console.log('📄 Criando tabela permissions...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        scope VARCHAR(20) DEFAULT 'organization',
        category VARCHAR(50) DEFAULT 'General',
        is_system BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_permission UNIQUE(resource, action)
      );
    `);
    console.log('✅ Tabela permissions criada!');

    // Create roles table
    console.log('📄 Criando tabela roles...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        level VARCHAR(20) DEFAULT 'user',
        is_system BOOLEAN DEFAULT false,
        priority INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_role_per_org UNIQUE(name, organization_id)
      );
    `);
    console.log('✅ Tabela roles criada!');

    // Create role_permissions table
    console.log('📄 Criando tabela role_permissions...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        granted BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
      );
    `);
    console.log('✅ Tabela role_permissions criada!');

    // Create indexes
    console.log('📄 Criando índices...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
      CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
      CREATE INDEX IF NOT EXISTS idx_roles_organization ON roles(organization_id);
      CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
    `);
    console.log('✅ Índices criados!');

    console.log('\n🎉 Tabelas RBAC criadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createRBACTables();