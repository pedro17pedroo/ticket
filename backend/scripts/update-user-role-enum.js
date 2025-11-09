import { sequelize } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateRoleEnum() {
  try {
    console.log('🔧 Atualizando ENUM de roles...\n');

    // Adicionar novos valores ao enum existente
    const newRoles = [
      'super-admin',
      'provider-admin', 
      'provider-support',
      'tenant-admin',
      'tenant-manager',
      'agent',
      'viewer'
    ];

    for (const role of newRoles) {
      try {
        await sequelize.query(`
          ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS '${role}';
        `);
        console.log(`✅ Role '${role}' adicionado ao enum`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Role '${role}' já existe`);
        } else {
          console.log(`⚠️  Erro ao adicionar '${role}': ${error.message}`);
        }
      }
    }

    // Verificar roles disponíveis
    const [roles] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_users_role))::text as role
      ORDER BY role;
    `);

    console.log('\n📋 Roles disponíveis no enum:');
    roles.forEach(r => console.log(`   - ${r.role}`));

    console.log('\n🎉 ENUM atualizado!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

updateRoleEnum();
