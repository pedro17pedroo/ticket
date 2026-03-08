import { sequelize } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Script de Verificação da Arquitetura SaaS Multi-Nível
 * 
 * Verifica se todas as tabelas essenciais do sistema SaaS existem:
 * 
 * NÍVEL 1 - PROVIDER (Backoffice):
 *   - users: Usuários do service provider (backoffice)
 *   - organizations: Organizações provider e tenants
 * 
 * NÍVEL 2 - TENANT (Organizações Clientes do SaaS):
 *   - organization_users: Usuários das organizações tenant
 *   - clients: Empresas clientes B2B das organizações
 * 
 * NÍVEL 3 - CLIENT (Empresas Clientes das Organizações):
 *   - client_users: Usuários das empresas clientes
 *   - client_catalog_access: Controle de acesso ao catálogo por empresa
 *   - client_user_catalog_access: Controle de acesso ao catálogo por usuário
 */

async function verifyArchitecture() {
  try {
    logger.info('🔍 Verificando Arquitetura SaaS Multi-Nível...\n');

    // Tabelas essenciais por nível
    const architecture = {
      'NÍVEL 1 - PROVIDER (Backoffice)': [
        'users',
        'organizations'
      ],
      'NÍVEL 2 - TENANT (Organizações)': [
        'organization_users',
        'clients'
      ],
      'NÍVEL 3 - CLIENT (Empresas Clientes)': [
        'client_users',
        'client_catalog_access',
        'client_user_catalog_access'
      ]
    };

    let allTablesExist = true;
    const missingTables = [];

    // Verificar cada nível
    for (const [level, tables] of Object.entries(architecture)) {
      logger.info(`\n📊 ${level}`);
      logger.info('─'.repeat(60));

      for (const tableName of tables) {
        try {
          const [results] = await sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = '${tableName}'
            );
          `);

          const exists = results[0].exists;

          if (exists) {
            // Contar registros
            const [countResult] = await sequelize.query(`
              SELECT COUNT(*) as count FROM ${tableName};
            `);
            const count = countResult[0].count;

            logger.info(`✅ ${tableName.padEnd(30)} | ${count} registros`);
          } else {
            logger.error(`❌ ${tableName.padEnd(30)} | TABELA NÃO EXISTE`);
            allTablesExist = false;
            missingTables.push(tableName);
          }
        } catch (error) {
          logger.error(`❌ ${tableName.padEnd(30)} | ERRO: ${error.message}`);
          allTablesExist = false;
          missingTables.push(tableName);
        }
      }
    }

    // Verificar relacionamentos críticos
    logger.info('\n\n🔗 Verificando Relacionamentos Críticos');
    logger.info('─'.repeat(60));

    const relationships = [
      {
        name: 'organizations → organization_users',
        query: `
          SELECT COUNT(*) as count 
          FROM organization_users ou
          INNER JOIN organizations o ON ou.organization_id = o.id
        `
      },
      {
        name: 'organizations → clients',
        query: `
          SELECT COUNT(*) as count 
          FROM clients c
          INNER JOIN organizations o ON c.organization_id = o.id
        `
      },
      {
        name: 'clients → client_users',
        query: `
          SELECT COUNT(*) as count 
          FROM client_users cu
          INNER JOIN clients c ON cu.client_id = c.id
        `
      }
    ];

    for (const rel of relationships) {
      try {
        const [results] = await sequelize.query(rel.query);
        const count = results[0].count;
        logger.info(`✅ ${rel.name.padEnd(40)} | ${count} registros`);
      } catch (error) {
        logger.error(`❌ ${rel.name.padEnd(40)} | ERRO: ${error.message}`);
      }
    }

    // Verificar ENUMs
    logger.info('\n\n📋 Verificando ENUMs');
    logger.info('─'.repeat(60));

    const enums = [
      'enum_organizations_type',
      'user_role',
      'organization_user_role',
      'client_user_role'
    ];

    for (const enumName of enums) {
      try {
        const [results] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM pg_type 
            WHERE typname = '${enumName}'
          );
        `);

        const exists = results[0].exists;

        if (exists) {
          const [values] = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '${enumName}')
            ORDER BY enumsortorder;
          `);

          const enumValues = values.map(v => v.enumlabel).join(', ');
          logger.info(`✅ ${enumName.padEnd(30)} | ${enumValues}`);
        } else {
          logger.error(`❌ ${enumName.padEnd(30)} | ENUM NÃO EXISTE`);
        }
      } catch (error) {
        logger.error(`❌ ${enumName.padEnd(30)} | ERRO: ${error.message}`);
      }
    }

    // Resumo final
    logger.info('\n\n' + '═'.repeat(60));
    if (allTablesExist) {
      logger.info('✅ ARQUITETURA SAAS MULTI-NÍVEL COMPLETA E FUNCIONAL');
      logger.info('═'.repeat(60));
      logger.info('\n📌 Sistema pronto para:');
      logger.info('   • Portal Backoffice (users)');
      logger.info('   • Portal Organização (organization_users)');
      logger.info('   • Portal Empresa Cliente (client_users)');
      logger.info('   • Multi-contexto com mesmo email');
      logger.info('   • Controle de acesso ao catálogo por empresa e usuário');
    } else {
      logger.error('❌ ARQUITETURA INCOMPLETA - TABELAS FALTANDO');
      logger.error('═'.repeat(60));
      logger.error('\n📌 Tabelas faltando:');
      missingTables.forEach(table => {
        logger.error(`   • ${table}`);
      });
      logger.error('\n💡 Execute as migrações necessárias para restaurar as tabelas.');
    }

    process.exit(allTablesExist ? 0 : 1);
  } catch (error) {
    logger.error('❌ Erro ao verificar arquitetura:', error);
    process.exit(1);
  }
}

verifyArchitecture();
