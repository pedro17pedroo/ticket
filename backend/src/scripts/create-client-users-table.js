import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

async function createClientUsersTable() {
  try {
    logger.info('🔄 Criando tabela client_users...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS client_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'client-admin')),
        avatar VARCHAR(500),
        phone VARCHAR(50),
        position VARCHAR(255),
        department_name VARCHAR(255),
        direction_id UUID REFERENCES directions(id) ON DELETE SET NULL,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
        location JSONB,
        permissions JSONB DEFAULT '{}',
        settings JSONB DEFAULT '{"notifications": true, "language": "pt", "timezone": "Europe/Lisbon"}',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        email_verified_at TIMESTAMP WITH TIME ZONE,
        last_login TIMESTAMP WITH TIME ZONE,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT client_users_email_client_unique UNIQUE (email, client_id)
      );
    `);

    // Criar índices
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS client_users_organization_id_idx ON client_users(organization_id);
      CREATE INDEX IF NOT EXISTS client_users_client_id_idx ON client_users(client_id);
      CREATE INDEX IF NOT EXISTS client_users_email_idx ON client_users(email);
      CREATE INDEX IF NOT EXISTS client_users_is_active_idx ON client_users(is_active);
    `);

    logger.info('✅ Tabela client_users criada com sucesso!');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      logger.info('✅ Tabela client_users já existe');
      process.exit(0);
    }
    logger.error('❌ Erro ao criar tabela client_users:', error);
    process.exit(1);
  }
}

createClientUsersTable();
