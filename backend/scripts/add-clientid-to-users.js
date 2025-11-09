import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function addClientIdColumn() {
  try {
    console.log('🔧 Adicionando coluna clientId à tabela users...');

    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES users(id);
    `);

    console.log('✅ Coluna client_id adicionada!');

    await sequelize.query(`
      COMMENT ON COLUMN users.client_id IS 'Para usuários cliente-org, indica a empresa cliente à qual pertencem';
    `);

    console.log('✅ Comentário adicionado!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addClientIdColumn();
