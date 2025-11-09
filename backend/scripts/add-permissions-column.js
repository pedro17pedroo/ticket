import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function addPermissionsColumn() {
  try {
    console.log('🔧 Adicionando coluna permissions...');

    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS permissions JSONB 
      DEFAULT '{"canManageUsers": false, "canManageClients": false, "canManageTickets": true, "canViewReports": false, "canManageSettings": false}'::jsonb;
    `);

    console.log('✅ Coluna permissions adicionada!');

    // Atualizar usuários existentes (usando apenas roles que existem)
    await sequelize.query(`
      UPDATE users 
      SET permissions = CASE
        WHEN role = 'admin-org' 
        THEN '{"canManageUsers": true, "canManageClients": true, "canManageTickets": true, "canViewReports": true, "canManageSettings": true}'::jsonb
        WHEN role = 'agente' 
        THEN '{"canManageUsers": false, "canManageClients": false, "canManageTickets": true, "canViewReports": true, "canManageSettings": false}'::jsonb
        ELSE '{"canManageUsers": false, "canManageClients": false, "canManageTickets": true, "canViewReports": false, "canManageSettings": false}'::jsonb
      END
      WHERE permissions IS NULL;
    `);

    console.log('✅ Permissões atualizadas para usuários existentes!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addPermissionsColumn();
