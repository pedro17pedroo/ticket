#!/usr/bin/env node

/**
 * Script para substituir console.log/console.error por debug logger
 * 
 * Uso:
 *   node scripts/replace-console-logs.js <arquivo>
 *   node scripts/replace-console-logs.js src/modules/saas/saasController.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('❌ Uso: node scripts/replace-console-logs.js <arquivo>');
  console.log('   Exemplo: node scripts/replace-console-logs.js src/modules/saas/saasController.js');
  process.exit(1);
}

const filePath = path.join(__dirname, '..', args[0]);

if (!fs.existsSync(filePath)) {
  console.log(`❌ Arquivo não encontrado: ${filePath}`);
  process.exit(1);
}

console.log(`📝 Processando: ${filePath}`);

let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// Verificar se já tem o import
const hasDebugLoggerImport = content.includes('from \'../../utils/debugLogger.js\'') ||
                              content.includes('from \'../utils/debugLogger.js\'') ||
                              content.includes('from \'./utils/debugLogger.js\'');

// Adicionar import se não existir
if (!hasDebugLoggerImport) {
  // Encontrar a última linha de import
  const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
  
  if (importLines.length > 0) {
    const lastImport = importLines[importLines.length - 1];
    const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
    
    // Calcular o caminho relativo correto
    const fileDir = path.dirname(filePath);
    const utilsPath = path.join(__dirname, '..', 'src', 'utils');
    const relativePath = path.relative(fileDir, utilsPath).replace(/\\/g, '/');
    const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    
    const debugLoggerImport = `\nimport { debug, info, warn, error } from '${importPath}/debugLogger.js';`;
    
    content = content.slice(0, lastImportIndex) + debugLoggerImport + content.slice(lastImportIndex);
    changes++;
    console.log(`✅ Adicionado import do debugLogger`);
  }
}

// Substituir console.log por debug
const consoleLogRegex = /console\.log\(/g;
const consoleLogMatches = content.match(consoleLogRegex);
if (consoleLogMatches) {
  content = content.replace(consoleLogRegex, 'debug(');
  changes += consoleLogMatches.length;
  console.log(`✅ Substituídos ${consoleLogMatches.length} console.log por debug`);
}

// Substituir console.error por error
const consoleErrorRegex = /console\.error\(/g;
const consoleErrorMatches = content.match(consoleErrorRegex);
if (consoleErrorMatches) {
  content = content.replace(consoleErrorRegex, 'error(');
  changes += consoleErrorMatches.length;
  console.log(`✅ Substituídos ${consoleErrorMatches.length} console.error por error`);
}

// Substituir console.warn por warn
const consoleWarnRegex = /console\.warn\(/g;
const consoleWarnMatches = content.match(consoleWarnRegex);
if (consoleWarnMatches) {
  content = content.replace(consoleWarnRegex, 'warn(');
  changes += consoleWarnMatches.length;
  console.log(`✅ Substituídos ${consoleWarnMatches.length} console.warn por warn`);
}

// Substituir console.info por info
const consoleInfoRegex = /console\.info\(/g;
const consoleInfoMatches = content.match(consoleInfoRegex);
if (consoleInfoMatches) {
  content = content.replace(consoleInfoRegex, 'info(');
  changes += consoleInfoMatches.length;
  console.log(`✅ Substituídos ${consoleInfoMatches.length} console.info por info`);
}

if (changes > 0) {
  // Criar backup
  const backupPath = filePath + '.backup';
  fs.writeFileSync(backupPath, fs.readFileSync(filePath));
  console.log(`💾 Backup criado: ${backupPath}`);
  
  // Salvar arquivo modificado
  fs.writeFileSync(filePath, content);
  console.log(`✅ Arquivo atualizado com ${changes} alterações`);
  console.log(`\n📋 Próximos passos:`);
  console.log(`   1. Revisar as alterações: git diff ${args[0]}`);
  console.log(`   2. Testar o arquivo modificado`);
  console.log(`   3. Se OK, remover backup: rm ${args[0]}.backup`);
  console.log(`   4. Se houver problemas: mv ${args[0]}.backup ${args[0]}`);
} else {
  console.log(`ℹ️  Nenhuma alteração necessária`);
}
