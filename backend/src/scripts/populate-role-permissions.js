/**
 * Script para popular permissões padrão dos roles
 * Executa: node src/scripts/populate-role-permissions.js
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
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

// Definição de permissões por role
const rolePermissionsMap = {
  'org-admin': [
    // Tickets
    'tickets.read', 'tickets.create', 'tickets.update', 'tickets.delete',
    'tickets.assign', 'tickets.close', 'tickets.reopen',
    // Users
    'users.read', 'users.create', 'users.update', 'users.delete',
    // Clients
    'clients.read', 'clients.create', 'clients.update', 'clients.delete',
    // Reports
    'reports.read', 'reports.create', 'reports.export',
    // Settings
    'settings.read', 'settings.update',
    // Catalog
    'catalog.read', 'catalog.create', 'catalog.update', 'catalog.delete',
    // Knowledge Base
    'kb.read', 'kb.create', 'kb.update', 'kb.delete',
    // Departments
    'departments.read', 'departments.create', 'departments.update', 'departments.delete',
    // Categories
    'categories.read', 'categories.create', 'categories.update', 'categories.delete'
  ],
  
  'supervisor': [
    // Tickets
    'tickets.read', 'tickets.create', 'tickets.update',
    'tickets.assign', 'tickets.close', 'tickets.reopen',
    // Users (read only)
    'users.read',
    // Clients (read only)
    'clients.read',
    // Reports
    'reports.read', 'reports.create', 'reports.export',
    // Catalog (read only)
    'catalog.read',
    // Knowledge Base
    'kb.read', 'kb.create', 'kb.update',
    // Departments (read only)
    'departments.read',
    // Categories (read only)
    'categories.read'
  ],
  
  'agent': [
    // Tickets
    'tickets.read', 'tickets.create', 'tickets.update',
    'tickets.close',
    // Users (read only)
    'users.read',
    // Clients (read only)
    'clients.read',
    // Reports (read only)
    'reports.read',
    // Catalog (read only)
    'catalog.read',
    // Knowledge Base (read only)
    'kb.read',
    // Departments (read only)
    'departments.read',
    // Categories (read only)
    'categories.read'
  ],
  
  'client-admin': [
    // Tickets
    'tickets.read', 'tickets.create', 'tickets.update',
    // Users (own client only)
    'users.read', 'users.create', 'users.update',
    // Reports (own client only)
    'reports.read',
    // Catalog (read only)
    'catalog.read',
    // Knowledge Base (read only)
    'kb.read'
  ],
  
  'client-user': [
    // Tickets (own tickets only)
    'tickets.read', 'tickets.create', 'tickets.update',
    // Catalog (read only)
    'catalog.read',
    // Knowledge Base (read only)
    'kb.read'
  ]
};

async function populateRolePermissions() {
  try {
    console.log('🔧 Populando permissões dos roles...');

    // Buscar todas as permissões existentes
    const [permissions] = await sequelize.query(`
      SELECT id, resource, action FROM permissions
    `);

    console.log(`📋 Encontradas ${permissions.length} permissões no sistema`);

    if (permissions.length === 0) {
      console.log('⚠️  Nenhuma permissão encontrada. Execute o script de seed de permissões primeiro.');
      console.log('   Comando: node src/scripts/seedRBACPermissions.js');
      return;
    }

    // Criar mapa de permissões para busca rápida
    const permissionMap = {};
    permissions.forEach(p => {
      const key = `${p.resource}.${p.action}`;
      permissionMap[key] = p.id;
    });

    // Buscar todos os roles
    const [roles] = await sequelize.query(`
      SELECT id, name, organization_id, client_id FROM roles WHERE is_active = true
    `);

    console.log(`📋 Encontrados ${roles.length} roles no sistema\n`);

    let totalAssociations = 0;
    let skippedAssociations = 0;

    // Para cada role, associar permissões
    for (const role of roles) {
      const rolePermissions = rolePermissionsMap[role.name];
      
      if (!rolePermissions) {
        console.log(`  ⏭️  Role ${role.name} não tem permissões definidas (pulando)`);
        continue;
      }

      console.log(`\n  📝 Processando role: ${role.name}`);
      
      for (const permKey of rolePermissions) {
        const permissionId = permissionMap[permKey];
        
        if (!permissionId) {
          console.log(`    ⚠️  Permissão não encontrada: ${permKey}`);
          continue;
        }

        // Verificar se associação já existe
        const [existing] = await sequelize.query(`
          SELECT id FROM role_permissions
          WHERE role_id = :roleId AND permission_id = :permissionId
        `, {
          replacements: {
            roleId: role.id,
            permissionId: permissionId
          }
        });

        if (existing.length > 0) {
          skippedAssociations++;
          continue;
        }

        // Criar associação (sem timestamps se não existirem)
        try {
          await sequelize.query(`
            INSERT INTO role_permissions (
              id, role_id, permission_id, granted
            ) VALUES (
              gen_random_uuid(), :roleId, :permissionId, true
            )
          `, {
            replacements: {
              roleId: role.id,
              permissionId: permissionId
            }
          });
        } catch (err) {
          // Se falhar, tentar com timestamps
          if (err.message.includes('created_at')) {
            await sequelize.query(`
              INSERT INTO role_permissions (
                id, role_id, permission_id, granted, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), :roleId, :permissionId, true, NOW(), NOW()
              )
            `, {
              replacements: {
                roleId: role.id,
                permissionId: permissionId
              }
            });
          } else {
            throw err;
          }
        }

        totalAssociations++;
      }
      
      console.log(`    ✅ ${rolePermissions.length} permissões associadas`);
    }

    console.log('\n✅ Permissões dos roles populadas com sucesso!');
    console.log(`\n📊 Resumo:`);
    console.log(`   • Total de associações criadas: ${totalAssociations}`);
    console.log(`   • Associações já existentes: ${skippedAssociations}`);
    
    // Mostrar estatísticas finais
    const [stats] = await sequelize.query(`
      SELECT 
        r.name,
        COUNT(rp.id) as total_permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
      WHERE r.is_active = true
      GROUP BY r.name
      ORDER BY total_permissions DESC
      LIMIT 10
    `);

    console.log('\n📊 Top 10 roles com mais permissões:');
    stats.forEach(s => {
      console.log(`   • ${s.name}: ${s.total_permissions} permissões`);
    });

  } catch (error) {
    console.error('❌ Erro ao popular permissões:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

populateRolePermissions()
  .then(() => {
    console.log('\n🎉 Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
