import { sequelize } from '../config/database.js';
import { Sequelize, DataTypes } from 'sequelize';

async function runMigration() {
  console.log('🚀 Iniciando migração de funcionalidades enterprise...\n');

  try {
    // 1. Criar tabela tags
    console.log('📋 Criando tabela tags...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(7) DEFAULT '#6B7280',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela tags criada\n');

    // 2. Criar tabela ticket_tags
    console.log('📋 Criando tabela ticket_tags...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ticket_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ticket_id, tag_id)
      );
    `);
    console.log('✅ Tabela ticket_tags criada\n');

    // 3. Criar tabela templates
    console.log('📋 Criando tabela templates...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type VARCHAR(20) DEFAULT 'ticket' CHECK (type IN ('ticket', 'comment', 'email')),
        subject VARCHAR(255),
        content TEXT NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        priority_id UUID REFERENCES priorities(id) ON DELETE SET NULL,
        type_id UUID REFERENCES types(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela templates criada\n');

    // 4. Criar tabela ticket_relationships
    console.log('📋 Criando tabela ticket_relationships...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ticket_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        related_ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        relationship_type VARCHAR(50) DEFAULT 'relates_to' CHECK (relationship_type IN (
          'blocks', 'blocked_by', 'relates_to', 'duplicates', 'duplicated_by',
          'parent_of', 'child_of', 'precedes', 'follows', 'caused_by', 'causes'
        )),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela ticket_relationships criada\n');

    // 5. Criar tabela time_entries
    console.log('📋 Criando tabela time_entries...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        is_billable BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela time_entries criada\n');

    // 6. Criar tabela ticket_history
    console.log('📋 Criando tabela ticket_history...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ticket_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL CHECK (action IN (
          'created', 'updated', 'status_changed', 'priority_changed', 'assigned',
          'commented', 'attachment_added', 'tag_added', 'tag_removed',
          'relationship_added', 'relationship_removed'
        )),
        field VARCHAR(50),
        old_value TEXT,
        new_value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela ticket_history criada\n');

    // 7. Adicionar coluna hostname na tabela assets
    console.log('📋 Adicionando coluna hostname em assets...');
    await sequelize.query(`
      ALTER TABLE assets 
      ADD COLUMN IF NOT EXISTS hostname VARCHAR(255);
    `);
    console.log('✅ Coluna hostname adicionada\n');

    // Criar índices para performance
    console.log('📊 Criando índices...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_tags_organization ON tags(organization_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket ON ticket_tags(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_tags_tag ON ticket_tags(tag_id);
      CREATE INDEX IF NOT EXISTS idx_templates_organization ON templates(organization_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_relationships_ticket ON ticket_relationships(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_relationships_related ON ticket_relationships(related_ticket_id);
      CREATE INDEX IF NOT EXISTS idx_time_entries_ticket ON time_entries(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_time_entries_active ON time_entries(is_active);
      CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id);
    `);
    console.log('✅ Índices criados\n');

    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

runMigration();
