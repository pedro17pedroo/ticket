import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function createClientUsersTable() {
  try {
    console.log('🔧 Criando tabela client_users...\n');

    // Ativar extensão UUID
    await sequelize.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    console.log('✅ Extensão UUID ativada');

    // Criar ENUM
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE client_user_role AS ENUM ('client-admin', 'client-manager', 'client-user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ ENUM client_user_role criado');

    // Criar tabela
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS client_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        
        role client_user_role NOT NULL DEFAULT 'client-user',
        
        avatar VARCHAR(255),
        phone VARCHAR(50),
        position VARCHAR(100),
        department_name VARCHAR(100),
        
        location JSONB DEFAULT '{}'::jsonb,
        permissions JSONB DEFAULT '{"canCreateTickets": true, "canViewAllClientTickets": false, "canApproveRequests": false, "canAccessKnowledgeBase": true, "canRequestServices": true}'::jsonb,
        settings JSONB DEFAULT '{"notifications": true, "emailNotifications": true, "theme": "light", "language": "pt", "autoWatchTickets": true}'::jsonb,
        
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        email_verified_at TIMESTAMP,
        last_login TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela client_users criada');

    // Criar índices
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_client_users_org ON client_users(organization_id);
      CREATE INDEX IF NOT EXISTS idx_client_users_client ON client_users(client_id);
      CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_client_users_email_client ON client_users(email, client_id);
    `);
    console.log('✅ Índices criados');

    console.log('\n🎉 Tabela client_users criada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createClientUsersTable();
