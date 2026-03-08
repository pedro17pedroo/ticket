/**
 * Script para criar roles padrão do sistema
 * Executa: node src/scripts/create-default-roles.js
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

async function createDefaultRoles() {
  try {
    console.log('🔧 Criando roles padrão do sistema...');

    // Buscar todas as organizações
    const [organizations] = await sequelize.query(`
      SELECT id, name FROM organizations WHERE is_active = true
    `);

    console.log(`📋 Encontradas ${organizations.length} organizações`);

    // Roles padrão do sistema (globais)
    const systemRoles = [
      {
        name: 'org-admin',
        displayName: 'Administrador da Organização',
        description: 'Acesso total à organização',
        level: 'organization',
        isSystem: true,
        priority: 100
      },
      {
        name: 'agent',
        displayName: 'Agente',
        description: 'Agente de suporte',
        level: 'organization',
        isSystem: true,
        priority: 50
      },
      {
        name: 'supervisor',
        displayName: 'Supervisor',
        description: 'Supervisor de equipe',
        level: 'organization',
        isSystem: true,
        priority: 75
      },
      {
        name: 'client-admin',
        displayName: 'Administrador do Cliente',
        description: 'Administrador da empresa cliente',
        level: 'client',
        isSystem: true,
        priority: 80
      },
      {
        name: 'client-user',
        displayName: 'Usuário do Cliente',
        description: 'Usuário padrão da empresa cliente',
        level: 'client',
        isSystem: true,
        priority: 30
      }
    ];

    // Criar roles globais (sem organization_id)
    console.log('\n📝 Criando roles globais...');
    for (const role of systemRoles) {
      const [existing] = await sequelize.query(`
        SELECT id FROM roles 
        WHERE name = :name 
          AND organization_id IS NULL 
          AND client_id IS NULL
      `, {
        replacements: { name: role.name }
      });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO roles (
            id, name, display_name, description, level, 
            organization_id, client_id, is_system, is_active, priority,
            created_at, updated_at
          ) VALUES (
            gen_random_uuid(), :name, :displayName, :description, :level,
            NULL, NULL, :isSystem, true, :priority,
            NOW(), NOW()
          )
        `, {
          replacements: role
        });
        console.log(`  ✅ Role global criado: ${role.name}`);
      } else {
        console.log(`  ⏭️  Role global já existe: ${role.name}`);
      }
    }

    // Criar roles específicos para cada organização
    console.log('\n📝 Criando roles específicos por organização...');
    for (const org of organizations) {
      console.log(`\n  📁 Organização: ${org.name}`);
      
      for (const role of systemRoles.filter(r => r.name.startsWith('org-') || r.name === 'agent' || r.name === 'supervisor')) {
        const [existing] = await sequelize.query(`
          SELECT id FROM roles 
          WHERE name = :name 
            AND organization_id = :orgId
        `, {
          replacements: { 
            name: role.name,
            orgId: org.id
          }
        });

        if (existing.length === 0) {
          await sequelize.query(`
            INSERT INTO roles (
              id, name, display_name, description, level, 
              organization_id, client_id, is_system, is_active, priority,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), :name, :displayName, :description, :level,
              :orgId, NULL, :isSystem, true, :priority,
              NOW(), NOW()
            )
          `, {
            replacements: {
              ...role,
              orgId: org.id
            }
          });
          console.log(`    ✅ Role criado: ${role.name}`);
        } else {
          console.log(`    ⏭️  Role já existe: ${role.name}`);
        }
      }
    }

    // Buscar todas as empresas clientes
    const [clients] = await sequelize.query(`
      SELECT id, name, organization_id FROM clients WHERE is_active = true
    `);

    console.log(`\n📋 Encontradas ${clients.length} empresas clientes`);

    // Criar roles específicos para cada cliente
    console.log('\n📝 Criando roles específicos por cliente...');
    for (const client of clients) {
      console.log(`\n  📁 Cliente: ${client.name}`);
      
      for (const role of systemRoles.filter(r => r.name.startsWith('client-'))) {
        const [existing] = await sequelize.query(`
          SELECT id FROM roles 
          WHERE name = :name 
            AND client_id = :clientId
        `, {
          replacements: { 
            name: role.name,
            clientId: client.id
          }
        });

        if (existing.length === 0) {
          await sequelize.query(`
            INSERT INTO roles (
              id, name, display_name, description, level, 
              organization_id, client_id, is_system, is_active, priority,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), :name, :displayName, :description, :level,
              :orgId, :clientId, :isSystem, true, :priority,
              NOW(), NOW()
            )
          `, {
            replacements: {
              ...role,
              orgId: client.organization_id,
              clientId: client.id
            }
          });
          console.log(`    ✅ Role criado: ${role.name}`);
        } else {
          console.log(`    ⏭️  Role já existe: ${role.name}`);
        }
      }
    }

    console.log('\n✅ Roles padrão criados com sucesso!');
    
    // Mostrar resumo
    const [totalRoles] = await sequelize.query(`
      SELECT COUNT(*) as count FROM roles
    `);
    console.log(`\n📊 Total de roles no sistema: ${totalRoles[0].count}`);

  } catch (error) {
    console.error('❌ Erro ao criar roles:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

createDefaultRoles()
  .then(() => {
    console.log('\n🎉 Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
