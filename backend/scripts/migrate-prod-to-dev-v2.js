#!/usr/bin/env node

/**
 * Script de Migração V2: Produção → Desenvolvimento
 * 
 * Extrai apenas os comandos COPY do backup de produção e os executa
 * na ordem correta para respeitar foreign keys.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const execAsync = promisify(exec);

const CONFIG = {
  PROD_BACKUP: '/Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260315_201256.sql',
  
  DB_HOST: process.env.POSTGRES_HOST || 'localhost',
  DB_PORT: process.env.POSTGRES_PORT || '5432',
  DB_NAME: process.env.POSTGRES_DB || 'tatuticket',
  DB_USER: process.env.POSTGRES_USER || 'postgres',
  DB_PASSWORD: process.env.POSTGRES_PASSWORD || '',
  
  WORK_DIR: path.join(__dirname, '../backups/migration-work'),
  
  PRESERVE_TABLES: [
    'context_audit_logs',
    'context_sessions',
    'catalog_access_audit_logs',
    'catalog_access_control',
    'todo_collaborators_v2',
    'todos_v2',
    'user_permissions'
  ]
};

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

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function executeSql(sql, description) {
  const pgPassword = CONFIG.DB_PASSWORD ? `PGPASSWORD=${CONFIG.DB_PASSWORD}` : '';
  const command = `${pgPassword} psql -h ${CONFIG.DB_HOST} -p ${CONFIG.DB_PORT} -U ${CONFIG.DB_USER} -d ${CONFIG.DB_NAME} -c "${sql}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function executeSqlFile(filePath, description) {
  const pgPassword = CONFIG.DB_PASSWORD ? `PGPASSWORD=${CONFIG.DB_PASSWORD}` : '';
  const command = `${pgPassword} psql -h ${CONFIG.DB_HOST} -p ${CONFIG.DB_PORT} -U ${CONFIG.DB_USER} -d ${CONFIG.DB_NAME} -f ${filePath}`;
  
  try {
    log(`Executando: ${description}...`, 'yellow');
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
    return { success: true, output: stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function extractCopyCommands() {
  logStep('1', 'Extraindo comandos COPY do backup de produção...');
  
  const content = await fs.readFile(CONFIG.PROD_BACKUP, 'utf8');
  const lines = content.split('\n');
  
  const copyBlocks = [];
  let currentBlock = null;
  let inCopyBlock = false;
  
  for (const line of lines) {
    if (line.startsWith('COPY public.')) {
      const match = line.match(/COPY public\.(\w+)/);
      if (match) {
        const tableName = match[1];
        
        // Pular tabelas preservadas
        if (CONFIG.PRESERVE_TABLES.includes(tableName)) {
          inCopyBlock = false;
          continue;
        }
        
        currentBlock = {
          table: tableName,
          lines: [line]
        };
        inCopyBlock = true;
      }
    } else if (inCopyBlock) {
      currentBlock.lines.push(line);
      
      if (line === '\\.') {
        copyBlocks.push(currentBlock);
        inCopyBlock = false;
        currentBlock = null;
      }
    }
  }
  
  logSuccess(`Extraídos ${copyBlocks.length} blocos COPY`);
  return copyBlocks;
}

async function setupWorkDir() {
  await fs.mkdir(CONFIG.WORK_DIR, { recursive: true });
}

async function backupCurrentDev() {
  logStep('2', 'Fazendo backup do banco de desenvolvimento atual...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(CONFIG.WORK_DIR, `dev-before-migration-${timestamp}.sql`);
  
  const pgPassword = CONFIG.DB_PASSWORD ? `PGPASSWORD=${CONFIG.DB_PASSWORD}` : '';
  const command = `${pgPassword} pg_dump -h ${CONFIG.DB_HOST} -p ${CONFIG.DB_PORT} -U ${CONFIG.DB_USER} ${CONFIG.DB_NAME} > ${backupFile}`;
  
  await execAsync(command);
  logSuccess(`Backup salvo em: ${backupFile}`);
  return backupFile;
}

async function clearTables(copyBlocks) {
  logStep('3', `Limpando ${copyBlocks.length} tabelas...`);
  
  // Desabilitar constraints
  await executeSql('SET session_replication_role = replica;', 'Desabilitar constraints');
  
  let cleared = 0;
  for (const block of copyBlocks) {
    const result = await executeSql(`TRUNCATE TABLE public."${block.table}" CASCADE;`, `Limpar ${block.table}`);
    if (result.success) {
      cleared++;
      process.stdout.write(`\r  Limpas: ${cleared}/${copyBlocks.length}`);
    }
  }
  
  console.log('');
  logSuccess(`${cleared} tabelas limpas`);
}

async function restoreDataInOrder(copyBlocks) {
  logStep('4', 'Restaurando dados na ordem correta...');
  
  // Ordem de dependências (tabelas sem FK primeiro)
  const tableOrder = [
    'SequelizeMeta',
    'organizations',
    'plans',
    'subscriptions',
    'users',
    'organization_users',
    'roles',
    'permissions',
    'role_permissions',
    'clients',
    'directions',
    'departments',
    'sections',
    'client_users',
    'priorities',
    'types',
    'categories',
    'slas',
    'workflows',
    'catalog_categories',
    'catalog_items',
    'tickets',
    'comments',
    'attachments',
    // ... resto das tabelas
  ];
  
  // Criar arquivo SQL temporário com todos os COPY
  const sqlFile = path.join(CONFIG.WORK_DIR, 'restore-data.sql');
  let sqlContent = '-- Restauração de dados de produção\n\n';
  
  // Ordenar blocos COPY
  const orderedBlocks = [];
  const remainingBlocks = [...copyBlocks];
  
  // Primeiro, adicionar tabelas na ordem definida
  for (const tableName of tableOrder) {
    const blockIndex = remainingBlocks.findIndex(b => b.table === tableName);
    if (blockIndex !== -1) {
      orderedBlocks.push(remainingBlocks[blockIndex]);
      remainingBlocks.splice(blockIndex, 1);
    }
  }
  
  // Adicionar tabelas restantes
  orderedBlocks.push(...remainingBlocks);
  
  // Gerar SQL
  for (const block of orderedBlocks) {
    sqlContent += `\n-- Tabela: ${block.table}\n`;
    sqlContent += block.lines.join('\n') + '\n';
  }
  
  await fs.writeFile(sqlFile, sqlContent);
  logSuccess(`Arquivo SQL criado: ${sqlFile}`);
  
  // Executar arquivo SQL
  const result = await executeSqlFile(sqlFile, 'Restaurar dados');
  
  if (result.success) {
    logSuccess('Dados restaurados com sucesso');
  } else {
    logWarning('Alguns erros ocorreram, mas dados foram parcialmente restaurados');
  }
  
  return result.success;
}

async function enableConstraints() {
  logStep('5', 'Reabilitando constraints...');
  await executeSql('SET session_replication_role = DEFAULT;', 'Reabilitar constraints');
  logSuccess('Constraints reabilitadas');
}

async function validateData() {
  logStep('6', 'Validando integridade dos dados...');
  
  const checks = [
    { query: 'SELECT COUNT(*) FROM organizations', name: 'Organizações' },
    { query: 'SELECT COUNT(*) FROM clients', name: 'Clientes' },
    { query: 'SELECT COUNT(*) FROM client_users', name: 'Usuários de Cliente' },
    { query: 'SELECT COUNT(*) FROM organization_users', name: 'Usuários de Organização' },
    { query: 'SELECT COUNT(*) FROM tickets', name: 'Tickets' },
    { query: 'SELECT COUNT(*) FROM comments', name: 'Comentários' },
    { query: 'SELECT COUNT(*) FROM context_sessions', name: 'Sessões de Contexto (preservado)' }
  ];
  
  log('\nContagem de registros:');
  
  for (const check of checks) {
    const result = await executeSql(check.query, check.name);
    if (result.success) {
      const count = result.output.match(/\d+/)?.[0] || '0';
      log(`  ${check.name}: ${count}`, 'blue');
    }
  }
  
  logSuccess('Validação concluída');
}

async function main() {
  log('\n' + '='.repeat(70), 'bright');
  log('MIGRAÇÃO DE DADOS V2: PRODUÇÃO → DESENVOLVIMENTO', 'bright');
  log('='.repeat(70) + '\n', 'bright');
  
  try {
    await setupWorkDir();
    const copyBlocks = await extractCopyCommands();
    const backupFile = await backupCurrentDev();
    await clearTables(copyBlocks);
    await restoreDataInOrder(copyBlocks);
    await enableConstraints();
    await validateData();
    
    log('\n' + '='.repeat(70), 'green');
    log('MIGRAÇÃO CONCLUÍDA COM SUCESSO!', 'green');
    log('='.repeat(70), 'green');
    log(`\nBackup do estado anterior: ${backupFile}`, 'cyan');
    
  } catch (error) {
    log('\n' + '='.repeat(70), 'red');
    log('ERRO NA MIGRAÇÃO', 'red');
    log('='.repeat(70), 'red');
    log(`\n${error.message}`, 'red');
    log(`\n${error.stack}`, 'red');
    process.exit(1);
  }
}

main();
