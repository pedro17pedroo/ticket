import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function addTypeColumn() {
  try {
    console.log('🔧 Adicionando coluna type à tabela organizations...\n');

    // Criar ENUM
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE organization_type AS ENUM ('provider', 'tenant');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ ENUM organization_type criado');

    // Adicionar coluna type
    await sequelize.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS type organization_type NOT NULL DEFAULT 'tenant';
    `);
    console.log('✅ Coluna type adicionada');

    // Adicionar coluna parent_id
    await sequelize.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES organizations(id);
    `);
    console.log('✅ Coluna parent_id adicionada');

    // Atualizar organização existente para tipo tenant
    await sequelize.query(`
      UPDATE organizations 
      SET type = 'tenant', parent_id = NULL
      WHERE type = 'tenant';
    `);
    console.log('✅ Organização existente marcada como tenant');

    console.log('\n🎉 Tabela organizations atualizada para multi-tenant!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addTypeColumn();
