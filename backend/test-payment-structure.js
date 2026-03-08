/**
 * Teste de estrutura dos arquivos de pagamento
 * Valida que todos os arquivos necessários existem
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Teste de Estrutura - Integração TPagamento\n');
console.log('='.repeat(60));

const files = {
  'Migrations': [
    'src/migrations/20260306000001-create-payment-transactions.js',
    'src/migrations/20260306000002-create-payment-receipts.js'
  ],
  'Models': [
    'src/models/PaymentTransaction.js',
    'src/models/PaymentReceipt.js'
  ],
  'Services': [
    'src/services/tpagamentoService.js',
    'src/services/paymentService.js'
  ],
  'Controllers': [
    'src/modules/payments/paymentController.js',
    'src/modules/payments/webhookController.js'
  ],
  'Routes': [
    'src/modules/payments/paymentRoutes.js'
  ],
  'Tests': [
    'test-payment-integration.sh'
  ]
};

let totalFiles = 0;
let existingFiles = 0;

for (const [category, fileList] of Object.entries(files)) {
  console.log(`\n📁 ${category}`);
  console.log('-'.repeat(60));
  
  for (const file of fileList) {
    totalFiles++;
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      existingFiles++;
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`✅ ${file} (${sizeKB} KB)`);
    } else {
      console.log(`❌ ${file} - NÃO ENCONTRADO`);
    }
  }
}

// Verificar conteúdo dos arquivos principais
console.log('\n\n📝 Verificação de Conteúdo');
console.log('='.repeat(60));

// Verificar tpagamentoService
const tpagamentoPath = path.join(__dirname, 'src/services/tpagamentoService.js');
if (fs.existsSync(tpagamentoPath)) {
  const content = fs.readFileSync(tpagamentoPath, 'utf8');
  console.log('\n✅ tpagamentoService.js:');
  console.log(`   - Linhas: ${content.split('\n').length}`);
  console.log(`   - createEKwanzaPayment: ${content.includes('createEKwanzaPayment') ? '✅' : '❌'}`);
  console.log(`   - createMulticaixaExpressPayment: ${content.includes('createMulticaixaExpressPayment') ? '✅' : '❌'}`);
  console.log(`   - createReferenciaMulticaixaPayment: ${content.includes('createReferenciaMulticaixaPayment') ? '✅' : '❌'}`);
  console.log(`   - checkPaymentStatus: ${content.includes('checkPaymentStatus') ? '✅' : '❌'}`);
}

// Verificar paymentController
const controllerPath = path.join(__dirname, 'src/modules/payments/paymentController.js');
if (fs.existsSync(controllerPath)) {
  const content = fs.readFileSync(controllerPath, 'utf8');
  console.log('\n✅ paymentController.js:');
  console.log(`   - Linhas: ${content.split('\n').length}`);
  console.log(`   - createPayment: ${content.includes('createPayment') ? '✅' : '❌'}`);
  console.log(`   - checkPaymentStatus: ${content.includes('checkPaymentStatus') ? '✅' : '❌'}`);
  console.log(`   - getPaymentHistory: ${content.includes('getPaymentHistory') ? '✅' : '❌'}`);
  console.log(`   - getPaymentReceipt: ${content.includes('getPaymentReceipt') ? '✅' : '❌'}`);
  console.log(`   - calculateUpgrade: ${content.includes('calculateUpgrade') ? '✅' : '❌'}`);
}

// Verificar webhookController
const webhookPath = path.join(__dirname, 'src/modules/payments/webhookController.js');
if (fs.existsSync(webhookPath)) {
  const content = fs.readFileSync(webhookPath, 'utf8');
  console.log('\n✅ webhookController.js:');
  console.log(`   - Linhas: ${content.split('\n').length}`);
  console.log(`   - handleTPagamentoWebhook: ${content.includes('handleTPagamentoWebhook') ? '✅' : '❌'}`);
  console.log(`   - payment.completed: ${content.includes('payment.completed') ? '✅' : '❌'}`);
  console.log(`   - payment.failed: ${content.includes('payment.failed') ? '✅' : '❌'}`);
  console.log(`   - payment.expired: ${content.includes('payment.expired') ? '✅' : '❌'}`);
}

// Verificar PaymentTransaction model
const modelPath = path.join(__dirname, 'src/models/PaymentTransaction.js');
if (fs.existsSync(modelPath)) {
  const content = fs.readFileSync(modelPath, 'utf8');
  console.log('\n✅ PaymentTransaction.js:');
  console.log(`   - Linhas: ${content.split('\n').length}`);
  console.log(`   - paymentMethod enum: ${content.includes("'ekwanza'") && content.includes("'gpo'") && content.includes("'ref'") ? '✅' : '❌'}`);
  console.log(`   - status enum: ${content.includes("'pending'") && content.includes("'completed'") ? '✅' : '❌'}`);
  console.log(`   - isCompleted method: ${content.includes('isCompleted') ? '✅' : '❌'}`);
  console.log(`   - isExpired method: ${content.includes('isExpired') ? '✅' : '❌'}`);
}

// Resumo
console.log('\n\n' + '='.repeat(60));
console.log('📊 RESUMO');
console.log('='.repeat(60));
console.log(`✅ Arquivos encontrados: ${existingFiles}/${totalFiles}`);
console.log(`📈 Taxa de completude: ${((existingFiles/totalFiles) * 100).toFixed(1)}%`);

if (existingFiles === totalFiles) {
  console.log('\n🎉 SUCESSO! Todos os arquivos estão presentes!');
  console.log('\n💡 Próximos passos:');
  console.log('   1. Configurar .env com credenciais TPagamento');
  console.log('   2. Executar migrations: npx sequelize-cli db:migrate');
  console.log('   3. Iniciar backend: npm run dev');
  console.log('   4. Testar endpoints: ./test-payment-integration.sh');
} else {
  console.log('\n⚠️  Alguns arquivos estão faltando!');
  console.log('   Verifique os arquivos marcados com ❌');
}

console.log('='.repeat(60));
