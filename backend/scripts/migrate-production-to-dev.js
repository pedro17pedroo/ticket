#!/usr/bin/env node

/**
 * Script de Migração: Produção → Desenvolvimento
 * 
 * Este script migra dados do backup de produção para o ambiente de desenvolvimento,
 * preservando integridade referencial e aplicando as novas estruturas de tabelas.
 * 
 * IMPORTANTE: Execute este script APENAS após fazer backup do banco de desenvolvimento!
 * 
 * Uso:
 *   node backend/scripts/migrate-production-to-dev.js
 * 
 * Ou com opções:
 *   node backend/scripts/migrate-production-to-dev.js --dry-run  (simula sem aplicar)
 *   node backend/scripts/migrate-production-to-dev.js --force    (força migração)
 */

const { Sequelize, QueryTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Configuração
const PRODUCTION_BACKUP = path.join(__dirname, '../backups/tatuticket_20260315_201256.sql');
const DEV_BACKUP = path.join(__dirname, '../backups/tatuticket_20260402_184400.sql');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

// Verificar argumentos
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

// Carregar configuração do banco de dados
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tatuticket',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres',
  logging: false
};

// Criar conexão com banco de desenvolvimento
const sequelize = new Sequelize(dbConfig);

/**
 * Verificar se arquivos de backup existem
 */
function checkBackupFiles() {
  logSection('1. Verificando Arquivos de Backup');
  
  if (!fs.existsSync(PRODUCTION_BACKUP)) {
    log(`❌ Backup de produção não encontrado: ${PRODUCTION_BACKUP}`, 'red');
    process.exit(1);
  }
  log(`✅ Backup de produção encontrado: ${PRODUCTION_BACKUP}`, 'green');
  
  if (!fs.existsSync(DEV_BACKUP)) {
    log(`⚠️  Backup de desenvolvimento não encontrado: ${DEV_BACKUP}`, 'yellow');
  } else {
    log(`✅ Backup de desenvolvimento encontrado: ${DEV_BACKUP}`, 'green');
  }
}

/**
 * Confirmar com usuário antes de prosseguir
 */
async function confirmMigration() {
  if (isForce) {
    log('⚠️  Modo --force ativado, pulando confirmação', 'yellow');
    return true;
  }
  
  logSection('2. Confirmação');
  
  log('⚠️  ATENÇÃO: Esta operação irá:', 'yellow');
  log('   1. Criar um backup do banco de desenvolvimento atual', 'yellow');
  log('   2. Migrar dados do backup de produção', 'yellow');
  log('   3. Aplicar novas estruturas de tabelas', 'yellow');
  log('   4. Validar integridade dos dados', 'yellow');
  
  if (isDryRun) {
    log('\n✅ Modo DRY-RUN ativado - nenhuma alteração será feita', 'cyan');
    return true;
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\nDeseja continuar? (sim/não): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'sim' || answer.toLowerCase() === 's');
    });
  });
}

/**
 * Criar backup do banco de desenvolvimento atual
 */
async function backupCurrentDatabase() {
  logSection('3. Backup do Banco Atual');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(__dirname, `../backups/pre-migration-${timestamp}.sql`);
  
  log(`📦 Criando backup em: ${backupFile}`, 'cyan');
  
  if (isDryRun) {
    log('✅ [DRY-RUN] Backup seria criado aqui', 'cyan');
    return backupFile;
  }
  
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -F p -f "${backupFile}"`;
    
    await execPromise(command, {
      env: { ...process.env, PGPASSWORD: dbConfig.password }
    });
    
    log(`✅ Backup criado com sucesso: ${backupFile}`, 'green');
    return backupFile;
  } catch (error) {
    log(`❌ Erro ao criar backup: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Analisar estrutura das tabelas
 */
async function analyzeTableStructure() {
  logSection('4. Analisando Estrutura das Tabelas');
  
  try {
    // Listar todas as tabelas
    const tables = await sequelize.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      { type: QueryTypes.SELECT }
    );
    
    log(`📊 Tabelas encontradas no banco de desenvolvimento: ${tables.length}`, 'cyan');
    
    // Tabelas novas (não existem em produção)
    const newTables = [
      'context_sessions',
      'context_audit_logs',
      'catalog_access_audit_logs'
    ];
    
    log('\n📋 Tabelas novas (criadas após backup de produção):', 'blue');
    newTables.forEach(table => {
      const exists = tables.find(t => t.table_name === table);
      if (exists) {
        log(`   ✅ ${table}`, 'green');
      } else {
        log(`   ❌ ${table} (não encontrada)`, 'red');
      }
    });
    
    return { tables, newTables };
  } catch (error) {
    log(`❌ Erro ao analisar estrutura: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Extrair dados do backup de produção
 */
function extractProductionData() {
  logSection('5. Extraindo Dados do Backup de Produção');
  
  log('📖 Lendo arquivo de backup...', 'cyan');
  
  const backupContent = fs.readFileSync(PRODUCTION_BACKUP, 'utf8');
  const lines = backupContent.split('\n');
  
  log(`✅ Arquivo lido: ${lines.length} linhas`, 'green');
  
  // Extrair INSERTs por tabela
  const inserts = {};
  let currentTable = null;
  
  lines.forEach(line => {
    // Detectar início de INSERT
    const insertMatch = line.match(/INSERT INTO (?:public\.)?(\w+)/);
    if (insertMatch) {
      currentTable = insertMatch[1];
      if (!inserts[currentTable]) {
        inserts[currentTable] = [];
      }
      inserts[currentTable].push(line);
    } else if (currentTable && line.trim().startsWith('(')) {
      // Continuação de INSERT
      inserts[currentTable][inserts[currentTable].length - 1] += '\n' + line;
    }
  });
  
  log('\n📊 Dados extraídos por tabela:', 'blue');
  Object.keys(inserts).sort().forEach(table => {
    log(`   ${table}: ${inserts[table].length} INSERT(s)`, 'cyan');
  });
  
  return inserts;
}

/**
 * Migrar dados preservando integridade
 */
async function migrateData(productionInserts) {
  logSection('6. Migrando Dados');
  
  if (isDryRun) {
    log('✅ [DRY-RUN] Dados seriam migrados aqui', 'cyan');
    return { migrated: 0, skipped: 0, errors: 0 };
  }
  
  const stats = { migrated: 0, skipped: 0, errors: 0 };
  
  // Ordem de migração (respeitando foreign keys)
  const migrationOrder = [
    'organizations',
    'organization_users',
    'clients',
    'client_users',
    'categories',
    'priorities',
    'ticket_types',
    'slas',
    'tickets',
    'ticket_messages',
    'ticket_attachments',
    'ticket_assignments',
    'ticket_status_history',
    'catalog_categories',
    'catalog_items',
    'catalog_requests',
    'knowledge_articles',
    'notifications',
    'audit_logs'
  ];
  
  try {
    await sequelize.transaction(async (transaction) => {
      for (const table of migrationOrder) {
        if (!productionInserts[table]) {
          log(`⏭️  Pulando ${table} (sem dados)`, 'yellow');
          stats.skipped++;
          continue;
        }
        
        log(`\n📥 Migrando ${table}...`, 'cyan');
        
        try {
          // Desabilitar triggers temporariamente
          await sequelize.query(`ALTER TABLE ${table} DISABLE TRIGGER ALL`, { transaction });
          
          // Executar INSERTs
          for (const insert of productionInserts[table]) {
            try {
              await sequelize.query(insert, { transaction });
              stats.migrated++;
            } catch (error) {
              // Ignorar erros de duplicação (dados já existem)
              if (error.message.includes('duplicate key')) {
                stats.skipped++;
              } else {
                log(`   ⚠️  Erro: ${error.message}`, 'yellow');
                stats.errors++;
              }
            }
          }
          
          // Reabilitar triggers
          await sequelize.query(`ALTER TABLE ${table} ENABLE TRIGGER ALL`, { transaction });
          
          log(`   ✅ ${table} migrado`, 'green');
        } catch (error) {
          log(`   ❌ Erro ao migrar ${table}: ${error.message}`, 'red');
          stats.errors++;
        }
      }
      
      // Atualizar sequences
      log('\n🔄 Atualizando sequences...', 'cyan');
      const sequences = await sequelize.query(
        `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'`,
        { type: QueryTypes.SELECT, transaction }
      );
      
      for (const seq of sequences) {
        const tableName = seq.sequence_name.replace('_id_seq', '');
        try {
          await sequelize.query(
            `SELECT setval('${seq.sequence_name}', (SELECT COALESCE(MAX(id), 1) FROM ${tableName}))`,
            { transaction }
          );
        } catch (error) {
          // Ignorar erros (tabela pode não ter coluna id)
        }
      }
      
      log('✅ Sequences atualizados', 'green');
    });
    
    return stats;
  } catch (error) {
    log(`❌ Erro na migração: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Validar integridade dos dados
 */
async function validateData() {
  logSection('7. Validando Integridade dos Dados');
  
  const validations = [];
  
  try {
    // Validar foreign keys
    log('🔍 Verificando foreign keys...', 'cyan');
    
    // Tickets devem ter organization_id válido
    const invalidTickets = await sequelize.query(
      `SELECT COUNT(*) as count FROM tickets t 
       WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = t.organization_id)`,
      { type: QueryTypes.SELECT }
    );
    
    if (invalidTickets[0].count > 0) {
      log(`   ⚠️  ${invalidTickets[0].count} tickets com organization_id inválido`, 'yellow');
      validations.push({ table: 'tickets', issue: 'invalid_organization_id', count: invalidTickets[0].count });
    } else {
      log('   ✅ Todos os tickets têm organization_id válido', 'green');
    }
    
    // Client_users devem ter client_id válido
    const invalidClientUsers = await sequelize.query(
      `SELECT COUNT(*) as count FROM client_users cu 
       WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = cu.client_id)`,
      { type: QueryTypes.SELECT }
    );
    
    if (invalidClientUsers[0].count > 0) {
      log(`   ⚠️  ${invalidClientUsers[0].count} client_users com client_id inválido`, 'yellow');
      validations.push({ table: 'client_users', issue: 'invalid_client_id', count: invalidClientUsers[0].count });
    } else {
      log('   ✅ Todos os client_users têm client_id válido', 'green');
    }
    
    // Contar registros por tabela
    log('\n📊 Contagem de registros:', 'blue');
    const tables = ['organizations', 'organization_users', 'clients', 'client_users', 'tickets', 'ticket_messages'];
    
    for (const table of tables) {
      try {
        const count = await sequelize.query(
          `SELECT COUNT(*) as count FROM ${table}`,
          { type: QueryTypes.SELECT }
        );
        log(`   ${table}: ${count[0].count}`, 'cyan');
      } catch (error) {
        log(`   ${table}: erro ao contar`, 'red');
      }
    }
    
    return validations;
  } catch (error) {
    log(`❌ Erro na validação: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Gerar relatório final
 */
function generateReport(stats, validations, startTime) {
  logSection('8. Relatório Final');
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  log('📊 Estatísticas da Migração:', 'blue');
  log(`   ✅ Registros migrados: ${stats.migrated}`, 'green');
  log(`   ⏭️  Registros pulados: ${stats.skipped}`, 'yellow');
  log(`   ❌ Erros: ${stats.errors}`, stats.errors > 0 ? 'red' : 'green');
  log(`   ⏱️  Tempo total: ${duration}s`, 'cyan');
  
  if (validations.length > 0) {
    log('\n⚠️  Problemas de Integridade Encontrados:', 'yellow');
    validations.forEach(v => {
      log(`   ${v.table}: ${v.issue} (${v.count} registros)`, 'yellow');
    });
  } else {
    log('\n✅ Nenhum problema de integridade encontrado', 'green');
  }
  
  if (isDryRun) {
    log('\n✅ Modo DRY-RUN - Nenhuma alteração foi feita no banco de dados', 'cyan');
  } else {
    log('\n✅ Migração concluída com sucesso!', 'green');
  }
}

/**
 * Função principal
 */
async function main() {
  const startTime = Date.now();
  
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║   Script de Migração: Produção → Desenvolvimento          ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');
  
  if (isDryRun) {
    log('\n🔍 Modo DRY-RUN ativado - Simulação sem alterações', 'cyan');
  }
  
  try {
    // 1. Verificar arquivos
    checkBackupFiles();
    
    // 2. Confirmar com usuário
    const confirmed = await confirmMigration();
    if (!confirmed) {
      log('\n❌ Migração cancelada pelo usuário', 'red');
      process.exit(0);
    }
    
    // 3. Conectar ao banco
    logSection('Conectando ao Banco de Dados');
    await sequelize.authenticate();
    log(`✅ Conectado ao banco: ${dbConfig.database}@${dbConfig.host}`, 'green');
    
    // 4. Backup do banco atual
    await backupCurrentDatabase();
    
    // 5. Analisar estrutura
    await analyzeTableStructure();
    
    // 6. Extrair dados de produção
    const productionInserts = extractProductionData();
    
    // 7. Migrar dados
    const stats = await migrateData(productionInserts);
    
    // 8. Validar integridade
    const validations = await validateData();
    
    // 9. Gerar relatório
    generateReport(stats, validations, startTime);
    
  } catch (error) {
    log(`\n❌ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Executar
main();
