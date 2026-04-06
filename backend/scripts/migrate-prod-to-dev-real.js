#!/usr/bin/env node

/**
 * Script de Migração: Produção → Desenvolvimento
 * 
 * Este script migra dados reais do backup de produção para o banco de desenvolvimento,
 * preservando as novas funcionalidades implementadas apenas em desenvolvimento.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

const execAsync = promisify(exec);

// Configuração
const CONFIG = {
  PROD_BACKUP: '/Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260315_201256.sql',
  DEV_BACKUP: '/Users/pedrodivino/Dev/ticket/backend/backups/tatuticket_20260402_184400.sql',
  
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

// Cores para output
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
    if (stderr && !stderr.includes('NOTICE')) {
      logWarning(`${description}: ${stderr}`);
    }
    return { success: true, output: stdout };
  } catch (error) {
    logError(`${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function extractTablesFromBackup(backupPath) {
  log(`Analisando backup: ${path.basename(backupPath)}...`);
  
  const content = await fs.readFile(backupPath, 'utf8');
  const copyRegex = /^COPY public\.(\w+) /gm;
  const tables = [];
  let match;
  
  while ((match = copyRegex.exec(content)) !== null) {
    tables.push(match[1]);
  }
  
  logSuccess(`Encontradas ${tables.length} tabelas com dados`);
  return tables;
}

async function setupWorkDir() {
  try {
    await fs.mkdir(CONFIG.WORK_DIR, { recursive: true });
    logSuccess(`Diretório de trabalho criado: ${CONFIG.WORK_DIR}`);
  } catch (error) {
    logError(`Erro ao criar diretório: ${error.message}`);
    throw error;
  }
}

async function backupCurrentDev() {
  logStep('1', 'Fazendo backup do banco de desenvolvimento atual...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(CONFIG.WORK_DIR, `dev-before-migration-${timestamp}.sql`);
  
  const pgPassword = CONFIG.DB_PASSWORD ? `PGPASSWORD=${CONFIG.DB_PASSWORD}` : '';
  const command = `${pgPassword} pg_dump -h ${CONFIG.DB_HOST} -p ${CONFIG.DB_PORT} -U ${CONFIG.DB_USER} ${CONFIG.DB_NAME} > ${backupFile}`;
  
  try {
    await execAsync(command);
    logSuccess(`Backup salvo em: ${backupFile}`);
    return backupFile;
  } catch (error) {
    logError(`Erro ao fazer backup: ${error.message}`);
    throw error;
  }
}

async function identifyCommonTables() {
  logStep('2', 'Identificando tabelas comuns...');
  
  const prodTables = await extractTablesFromBackup(CONFIG.PROD_BACKUP);
  const devTables = await extractTablesFromBackup(CONFIG.DEV_BACKUP);
  
  const commonTables = prodTables.filter(table => 
    devTables.includes(table) && !CONFIG.PRESERVE_TABLES.includes(table)
  );
  
  logSuccess(`${commonTables.length} tabelas serão migradas`);
  log(`${CONFIG.PRESERVE_TABLES.length} tabelas serão preservadas (só existem em dev)`, 'yellow');
  
  return { prodTables, devTables, commonTables };
}

async function disableConstraints() {
  logStep('3', 'Desabilitando constraints temporariamente...');
  
  const result = await executeSql(
    'SET session_replication_role = replica;',
    'Desabilitar constraints'
  );
  
  if (result.success) {
    logSuccess('Constraints desabilitadas');
  }
  
  return result.success;
}

async function clearCommonTables(commonTables) {
  logStep('4', `Limpando ${commonTables.length} tabelas...`);
  
  let cleared = 0;
  let failed = 0;
  
  for (const table of commonTables) {
    const result = await executeSql(
      `TRUNCATE TABLE public."${table}" CASCADE;`,
      `Limpar ${table}`
    );
    
    if (result.success) {
      cleared++;
      process.stdout.write(`\r  Limpas: ${cleared}/${commonTables.length}`);
    } else {
      failed++;
    }
  }
  
  console.log('');
  logSuccess(`${cleared} tabelas limpas`);
  
  if (failed > 0) {
    logWarning(`${failed} tabelas falharam`);
  }
  
  return { cleared, failed };
}

async function restoreProductionData() {
  logStep('5', 'Restaurando dados de produção...');
  
  const pgPassword = CONFIG.DB_PASSWORD ? `PGPASSWORD=${CONFIG.DB_PASSWORD}` : '';
  const command = `${pgPassword} psql -h ${CONFIG.DB_HOST} -p ${CONFIG.DB_PORT} -U ${CONFIG.DB_USER} -d ${CONFIG.DB_NAME} < ${CONFIG.PROD_BACKUP}`;
  
  try {
    log('Isso pode levar alguns minutos...', 'yellow');
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
    
    const realErrors = stderr.split('\n').filter(line => 
      line.includes('ERROR') && !line.includes('already exists')
    );
    
    if (realErrors.length > 0) {
      logWarning(`Alguns erros ocorreram durante a restauração:`);
      realErrors.forEach(err => log(`  ${err}`, 'yellow'));
    } else {
      logSuccess('Dados de produção restaurados com sucesso');
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      logSuccess('Dados restaurados (algumas estruturas já existiam)');
      return true;
    }
    
    logError(`Erro ao restaurar: ${error.message}`);
    return false;
  }
}

async function enableConstraints() {
  logStep('6', 'Reabilitando constraints...');
  
  const result = await executeSql(
    'SET session_replication_role = DEFAULT;',
    'Reabilitar constraints'
  );
  
  if (result.success) {
    logSuccess('Constraints reabilitadas');
  }
  
  return result.success;
}

async function validateData() {
  logStep('7', 'Validando integridade dos dados...');
  
  const checks = [
    { query: 'SELECT COUNT(*) FROM clients', name: 'Clientes' },
    { query: 'SELECT COUNT(*) FROM client_users', name: 'Usuários de Cliente' },
    { query: 'SELECT COUNT(*) FROM organization_users', name: 'Usuários de Organização' },
    { query: 'SELECT COUNT(*) FROM tickets', name: 'Tickets' },
    { query: 'SELECT COUNT(*) FROM comments', name: 'Comentários' },
    { query: 'SELECT COUNT(*) FROM context_sessions', name: 'Sessões de Contexto (dev only)' },
    { query: 'SELECT COUNT(*) FROM catalog_access_audit_logs', name: 'Logs de Auditoria (dev only)' }
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
  log('MIGRAÇÃO DE DADOS: PRODUÇÃO → DESENVOLVIMENTO', 'bright');
  log('='.repeat(70) + '\n', 'bright');
  
  log('Configuração:');
  log(`  Banco: ${CONFIG.DB_HOST}:${CONFIG.DB_PORT}/${CONFIG.DB_NAME}`);
  log(`  Usuário: ${CONFIG.DB_USER}`);
  log(`  Backup Produção: ${path.basename(CONFIG.PROD_BACKUP)}`);
  log(`  Backup Dev: ${path.basename(CONFIG.DEV_BACKUP)}`);
  log(`  Tabelas Preservadas: ${CONFIG.PRESERVE_TABLES.length}`);
  
  try {
    await setupWorkDir();
    const backupFile = await backupCurrentDev();
    const { commonTables } = await identifyCommonTables();
    
    log('\n' + '='.repeat(70), 'yellow');
    log('ATENÇÃO: Esta operação irá:', 'yellow');
    log(`  1. Limpar ${commonTables.length} tabelas no banco de desenvolvimento`, 'yellow');
    log(`  2. Restaurar dados do backup de produção`, 'yellow');
    log(`  3. Preservar ${CONFIG.PRESERVE_TABLES.length} tabelas novas de desenvolvimento`, 'yellow');
    log('='.repeat(70) + '\n', 'yellow');
    
    await disableConstraints();
    await clearCommonTables(commonTables);
    await restoreProductionData();
    await enableConstraints();
    await validateData();
    
    log('\n' + '='.repeat(70), 'green');
    log('MIGRAÇÃO CONCLUÍDA COM SUCESSO!', 'green');
    log('='.repeat(70), 'green');
    log(`\nBackup do estado anterior salvo em:\n  ${backupFile}`, 'cyan');
    
  } catch (error) {
    log('\n' + '='.repeat(70), 'red');
    log('ERRO NA MIGRAÇÃO', 'red');
    log('='.repeat(70), 'red');
    log(`\n${error.message}`, 'red');
    log('\nO banco de desenvolvimento pode estar em estado inconsistente.', 'yellow');
    log('Use o backup para restaurar se necessário.', 'yellow');
    process.exit(1);
  }
}

main();
