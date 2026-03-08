/**
 * Script para verificar estado das permissões
 * Executa: node src/scripts/check-permissions.js
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres',
    logging: false
  }
);

async function checkPermissions() {
  try {
    console.log('🔍 Verificando estado das permissões...\n');

    // Verificar roles
    const [roles] = await sequelize.query('SELECT COUNT(*) as count FROM roles');
    console.log(`📋 Roles no sistema: ${roles[0].count}`);

    // Verificar permissões
    const [permissions] = await sequelize.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`🔐 Permissões no sistema: ${permissions[0].count}`);

    // Verificar role_permissions
    const [rolePermissions] = await sequelize.query('SELECT COUNT(*) as count FROM role_permissions');
    console.log(`🔗 Associações role-permission: ${rolePermissions[0].count}`);

    // Verificar user_permissions
    const [userPermissions] = await sequelize.query('SELECT COUNT(*) as count FROM user_permissions');
    console.log(`👤 Permissões específicas de usuário: ${userPermissions[0].count}`);

    console.log('\n📊 Análise:');
    
    if (permissions[0].count === 0) {
      console.log('❌ PROBLEMA: Nenhuma permissão cadastrada no sistema');
      console.log('   Solução: Executar script de seed de permissões');
    } else {
      console.log(`✅ ${permissions[0].count} permissões cadastradas`);
    }

    if (rolePermissions[0].count === 0) {
      console.log('❌ PROBLEMA: Nenhuma permissão associada aos roles');
      console.log('   Solução: Executar script para associar permissões aos roles');
    } else {
      console.log(`✅ ${rolePermissions[0].count} associações role-permission`);
    }

    // Mostrar alguns roles e suas permissões
    console.log('\n📋 Amostra de Roles:');
    const [rolesSample] = await sequelize.query(`
      SELECT 
        r.name,
        r.display_name,
        r.level,
        r.priority,
        COUNT(rp.id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      WHERE r.is_system = true
        AND r.organization_id IS NULL
        AND r.client_id IS NULL
      GROUP BY r.id, r.name, r.display_name, r.level, r.priority
      ORDER BY r.priority DESC
      LIMIT 5
    `);

    rolesSample.forEach(role => {
      const status = role.permission_count > 0 ? '✅' : '❌';
      console.log(`  ${status} ${role.name} (${role.display_name}): ${role.permission_count} permissões`);
    });

    // Mostrar algumas permissões
    if (permissions[0].count > 0) {
      console.log('\n🔐 Amostra de Permissões:');
      const [permissionsSample] = await sequelize.query(`
        SELECT resource, action, description
        FROM permissions
        ORDER BY resource, action
        LIMIT 10
      `);

      permissionsSample.forEach(perm => {
        console.log(`  • ${perm.resource}.${perm.action} - ${perm.description || 'Sem descrição'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

checkPermissions()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
