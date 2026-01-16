import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createMissingTables() {
  try {
    console.log('🔧 Criando tabelas em falta...\n');

    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados!');

    // Create catalog_categories table
    console.log('📄 Criando tabela catalog_categories...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS catalog_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'folder',
        color VARCHAR(7) DEFAULT '#3B82F6',
        parent_category_id UUID REFERENCES catalog_categories(id) ON DELETE SET NULL,
        level INTEGER DEFAULT 1,
        image_url VARCHAR(500),
        default_direction_id UUID REFERENCES directions(id) ON DELETE SET NULL,
        default_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        default_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
        "order" INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela catalog_categories criada!');

    // Create indexes
    console.log('📄 Criando índices...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_catalog_categories_org ON catalog_categories(organization_id);
      CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent ON catalog_categories(parent_category_id);
      CREATE INDEX IF NOT EXISTS idx_catalog_categories_active ON catalog_categories(is_active);
    `);
    console.log('✅ Índices criados!');

    console.log('\n🎉 Tabelas criadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createMissingTables();