#!/usr/bin/env node

// Script para manter o backend rodando de forma mais estável
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serverProcess = null;
let restartCount = 0;

function startServer() {
  console.log(`🚀 Iniciando backend (tentativa ${restartCount + 1})`);
  
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  serverProcess.on('close', (code) => {
    console.log(`\n⚠️ Backend parou com código ${code}`);
    
    if (code !== 0 && restartCount < 5) {
      restartCount++;
      console.log(`🔄 Reiniciando em 3 segundos...`);
      setTimeout(startServer, 3000);
    } else if (restartCount >= 5) {
      console.log('❌ Máximo de reinicializações atingido. Parando.');
      process.exit(1);
    }
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Parando backend...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Parando backend...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

startServer();
