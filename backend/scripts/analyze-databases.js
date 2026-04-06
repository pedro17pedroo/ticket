#!/usr/bin/env node

/**
 * Script para Analisar Dados Reais nos Bancos
 * 
 * Este script conecta aos bancos de produção e desenvolvimento
 * para verificar quais tabelas têm dados e quantos registros existem.
 */

import { Sequelize, QueryTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

// Carregar configuração
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'tatuticket',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: false
};

async function analyzeTables(sequelize, dbName) {
  logSection(`Analisando Banco: ${dbName}`);
  
  try {
    // Listar todas as tabelas
    const tables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      { type: QueryTypes.SELECT }
    );
    
    log(`📊 Total de tabelas: ${tables.length}`, 'cyan');
    
    // Contar registros em cada tabela
    const tableCounts = [];
    
    for (const table of tables) {
      try {
        const result = await sequelize.query(
          `SELECT COUNT(*) as count FROM ${table.table_name}`,
          { type: QueryTypes.SELECT }
        );
        
        const count = parseInt(result[0].count);
        tableCounts.push({
          table: table.table_name,
          count: count
        });
      } catch (error) {
        tableCounts.push({
          table: table.table_name,
          count: 'erro'
        });
      }
    }
    
    // Ordenar por quantidade de registros (decrescente)
    tableCounts.sort((a, b) => {
      if (a.count === 'erro') return 1;
      if (b.count === 'erro') return -1;
      return b.count - a.count;
    });
    
    // Mostrar tabelas com dados
    log('\n📋 Tabelas com Dados:', 'blue');
    const tablesWithData = tableCounts.filter(t => t.count > 0 && t.count !== 'erro');
    
    if (tablesWithData.length === 0) {
      log('   ⚠️  Nenhuma tabela com dados encontrada', 'yellow');
    } else {
      tablesWithData.forEach(t => {
        const color = t.count > 100 ? 'green' : t.count > 10 ? 'cyan' : 'reset';
        log(`   ${t.table.padEnd(40)} ${String(t.count).padStart(8)} registros`, color);
      });
    }
    
    // Mostrar tabelas vazias
    log('\n📭 Tabelas Vazias:', 'yellow');
    const emptyTables = tableCounts.filter(t => t.count === 0);
    
    if (emptyTables.length === 0) {
      log('   ✅ Todas as tabelas têm dados', 'green');
    } else {
      emptyTables.forEach(t => {
        log(`   ${t.table}`, 'yellow');
      });
    }
    
    // Tabelas com erro
    const errorTables = tableCounts.filter(t => t.count === 'erro');
    if (errorTables.length > 0) {
      log('\n❌ Tabelas com Erro:', 'red');
      errorTables.forEach(t => {
        log(`   ${t.table}`, 'red');
      });
    }
    
    // Estatísticas gerais
    log('\n📊 Estatísticas:', 'blue');
    log(`   Total de tabelas: ${tables.length}`, 'cyan');
    log(`   Tabelas com dados: ${tablesWithData.length}`, 'green');
    log(`   Tabelas vazias: ${emptyTables.length}`, 'yellow');
    log(`   Total de registros: ${tablesWithData.reduce((sum, t) => sum + t.count, 0)}`, 'cyan');
    
    return {
      tables: tableCounts,
      withData: tablesWithData,
      empty: emptyTables,
      errors: errorTables
    };
    
  } catch (error) {
    log(`❌ Erro ao analisar tabelas: ${error.message}`, 'red');
    throw error;
  }
}

async function compareTablesStructure(sequelize) {
  logSection('Comparando Estrutura de Tabelas Importantes');
  
  const importantTables = [
    'organizations',
    'organization_users',
    'clients',
    'client_users',
    'tickets',
    'ticket_messages',
    'context_sessions',
    'context_audit_logs',
    'catalog_access_audit_logs'
  ];
  
  for (const tableName of importantTables) {
    try {
      const columns = await sequelize.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        {
          bind: [tableName],
          type: QueryTypes.SELECT
        }
      );
      
      if (columns.length === 0) {
        log(`❌ ${tableName}: NÃO EXISTE`, 'red');
      } else {
        log(`✅ ${tableName}: ${columns.length} colunas`, 'green');
        
        // Mostrar colunas importantes
        const importantColumns = columns.filter(c => 
          c.column_name.includes('id') || 
          c.column_name.includes('email') ||
          c.column_name.includes('context') ||
          c.column_name.includes('organization') ||
          c.column_name.includes('client')
        );
        
        if (importantColumns.length > 0) {
          importantColumns.forEach(col => {
            log(`   - ${col.column_name} (${col.data_type})`, 'cyan');
          });
        }
      }
    } catch (error) {
      log(`❌ ${tableName}: ERRO - ${error.message}`, 'red');
    }
  }
}

async function checkConstraints(sequelize) {
  logSection('Verificando Constraints Importantes');
  
  try {
    // Verificar constraint em client_users
    const constraints = await sequelize.query(
      `SELECT conname, contype, pg_get_constraintdef(oid) as definition
       FROM pg_constraint
       WHERE conrelid = 'client_users'::regclass
       AND contype IN ('u', 'p')`,
      { type: QueryTypes.SELECT }
    );
    
    log('📋 Constraints em client_users:', 'blue');
    if (constraints.length === 0) {
      log('   ⚠️  Nenhuma constraint encontrada', 'yellow');
    } else {
      constraints.forEach(c => {
        const type = c.contype === 'p' ? 'PRIMARY KEY' : 'UNIQUE';
        log(`   ${type}: ${c.conname}`, 'cyan');
        log(`      ${c.definition}`, 'reset');
      });
    }
    
    // Verificar se permite email duplicado
    const duplicateEmails = await sequelize.query(
      `SELECT email, COUNT(*) as count
       FROM client_users
       GROUP BY email
       HAVING COUNT(*) > 1`,
      { type: QueryTypes.SELECT }
    );
    
    if (duplicateEmails.length > 0) {
      log(`\n✅ Emails duplicados permitidos: ${duplicateEmails.length} emails com múltiplas entradas`, 'green');
    } else {
      log('\n⚠️  Nenhum email duplicado encontrado (pode indicar constraint antiga)', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Erro ao verificar constraints: ${error.message}`, 'red');
  }
}

async function main() {
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'bright');
  log('║   Análise de Dados: Banco de Desenvolvimento                    ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════════╝', 'bright');
  
  const sequelize = new Sequelize(dbConfig);
  
  try {
    // Conectar
    logSection('Conectando ao Banco de Dados');
    await sequelize.authenticate();
    log(`✅ Conectado: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`, 'green');
    
    // Analisar tabelas
    const analysis = await analyzeTables(sequelize, dbConfig.database);
    
    // Comparar estrutura
    await compareTablesStructure(sequelize);
    
    // Verificar constraints
    await checkConstraints(sequelize);
    
    // Relatório final
    logSection('Resumo da Análise');
    
    log('📊 Dados Encontrados:', 'blue');
    if (analysis.withData.length === 0) {
      log('   ⚠️  BANCO VAZIO - Nenhuma tabela com dados', 'yellow');
      log('   💡 Sugestão: Executar seeds ou importar dados de produção', 'cyan');
    } else {
      log(`   ✅ ${analysis.withData.length} tabelas com dados`, 'green');
      log(`   📈 Total: ${analysis.withData.reduce((sum, t) => sum + t.count, 0)} registros`, 'cyan');
      
      // Top 5 tabelas com mais dados
      log('\n   🏆 Top 5 Tabelas:', 'blue');
      analysis.withData.slice(0, 5).forEach((t, i) => {
        log(`      ${i + 1}. ${t.table}: ${t.count} registros`, 'cyan');
      });
    }
    
    log('\n📋 Tabelas Novas (Multi-Contexto):', 'blue');
    const newTables = ['context_sessions', 'context_audit_logs', 'catalog_access_audit_logs'];
    newTables.forEach(table => {
      const found = analysis.tables.find(t => t.table === table);
      if (found) {
        if (found.count > 0) {
          log(`   ✅ ${table}: ${found.count} registros`, 'green');
        } else {
          log(`   ⚪ ${table}: vazia (estrutura existe)`, 'yellow');
        }
      } else {
        log(`   ❌ ${table}: NÃO EXISTE`, 'red');
      }
    });
    
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
