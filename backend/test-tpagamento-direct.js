/**
 * Teste direto da integração TPagamento
 * Testa diretamente o serviço sem passar pelo endpoint
 */

import dotenv from 'dotenv';
import tpagamentoService from './src/services/tpagamentoService.js';

dotenv.config();

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Teste 1: Criar pagamento e-Kwanza
 */
async function testEKwanzaPayment() {
  logSection('TESTE 1: Criar Pagamento e-Kwanza (Direto)');

  try {
    const amount = 2500;
    const mobileNumber = '923456789';
    const referenceCode = `TEST-${Date.now()}`;

    logInfo('Criando pagamento e-Kwanza...');
    console.log('Parâmetros:', { amount, mobileNumber, referenceCode });

    const result = await tpagamentoService.createEKwanzaPayment(
      amount,
      mobileNumber,
      referenceCode
    );

    if (result.success) {
      logSuccess('Pagamento criado com sucesso!');
      console.log('\nResposta:');
      console.log(JSON.stringify(result, null, 2));

      // Validar estrutura da resposta
      if (result.data) {
        logInfo('\nValidando estrutura da resposta...');
        
        const requiredFields = ['id', 'reference', 'status', 'amount', 'currency', 'paymentMethod', 'code', 'qrCode'];
        const missingFields = requiredFields.filter(field => !result.data[field]);
        
        if (missingFields.length === 0) {
          logSuccess('Todos os campos obrigatórios presentes!');
        } else {
          logWarning(`Campos ausentes: ${missingFields.join(', ')}`);
        }

        // Informações do QR Code
        if (result.data.qrCode) {
          logInfo('\nInformações do QR Code:');
          console.log(`  - Código: ${result.data.code}`);
          console.log(`  - Tamanho: ${result.data.qrCode.length} caracteres`);
          console.log(`  - Primeiros 50 caracteres: ${result.data.qrCode.substring(0, 50)}...`);
          
          // Detectar formato
          if (result.data.qrCode.startsWith('Qk1')) {
            logInfo('  - Formato: BMP (Bitmap) em base64');
          } else if (result.data.qrCode.startsWith('iVBOR')) {
            logInfo('  - Formato: PNG em base64');
          } else if (result.data.qrCode.startsWith('/9j/')) {
            logInfo('  - Formato: JPEG em base64');
          }
        }

        // Informações de taxas
        if (result.data.fees) {
          logInfo('\nInformações de Taxas:');
          console.log(`  - Valor total: ${result.data.amount} ${result.data.currency}`);
          console.log(`  - Taxa: ${result.data.fees.amount} ${result.data.currency}`);
          console.log(`  - Valor líquido: ${result.data.fees.netAmount} ${result.data.currency}`);
          console.log(`  - Percentual: ${((result.data.fees.amount / result.data.amount) * 100).toFixed(2)}%`);
        }
      }

      return {
        success: true,
        paymentId: result.paymentId,
        code: result.data?.code
      };
    } else {
      logError('Falha ao criar pagamento!');
      console.log('\nErro:', result.message || 'Erro desconhecido');
      if (result.error) {
        console.log('Detalhes:', JSON.stringify(result.error, null, 2));
      }
      return { success: false };
    }
  } catch (error) {
    logError('Erro ao criar pagamento!');
    console.log('\nErro:', error.message);
    if (error.response) {
      console.log('Resposta:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false };
  }
}

/**
 * Teste 2: Verificar status do pagamento e-Kwanza
 */
async function testEKwanzaStatus(code) {
  logSection('TESTE 2: Verificar Status e-Kwanza');

  if (!code) {
    logWarning('Código não fornecido, pulando teste');
    return { success: false, skipped: true };
  }

  try {
    logInfo(`Verificando status do código: ${code}`);

    const result = await tpagamentoService.checkEKwanzaStatus(code);

    if (result.success) {
      logSuccess('Status verificado com sucesso!');
      console.log('\nResposta:');
      console.log(JSON.stringify(result, null, 2));
      return { success: true };
    } else {
      logWarning('Falha ao verificar status');
      console.log('\nDetalhes:', JSON.stringify(result, null, 2));
      return { success: false };
    }
  } catch (error) {
    logError('Erro ao verificar status!');
    console.log('\nErro:', error.message);
    return { success: false };
  }
}

/**
 * Teste 3: Criar pagamento Multicaixa Express (GPO)
 */
async function testMulticaixaExpressPayment() {
  logSection('TESTE 3: Criar Pagamento Multicaixa Express (GPO)');

  try {
    const amount = 5000;
    const customer = {
      name: 'João Silva',
      email: 'joao.silva@example.com',
      phone: '244900000000' // Número de teste para sucesso
    };
    const description = 'Teste de pagamento Multicaixa Express';

    logInfo('Criando pagamento Multicaixa Express...');
    logInfo('Usando número de teste: 244900000000 (Pagamento com Sucesso)');
    console.log('Parâmetros:', { amount, customer, description });

    const result = await tpagamentoService.createMulticaixaExpressPayment(
      amount,
      customer.name,
      customer.email,
      customer.phone,
      description
    );

    if (result.success) {
      logSuccess('Pagamento criado com sucesso!');
      console.log('\nResposta:');
      console.log(JSON.stringify(result, null, 2));
      return {
        success: true,
        paymentId: result.paymentId,
        reference: result.referenceCode
      };
    } else {
      logError('Falha ao criar pagamento!');
      console.log('\nErro:', result.message || 'Erro desconhecido');
      if (result.error) {
        console.log('Detalhes:', JSON.stringify(result.error, null, 2));
      }
      return { success: false };
    }
  } catch (error) {
    logError('Erro ao criar pagamento!');
    console.log('\nErro:', error.message);
    return { success: false };
  }
}

/**
 * Teste 4: Criar pagamento Referência Multicaixa (REF)
 */
async function testReferenciaMulticaixaPayment() {
  logSection('TESTE 4: Criar Pagamento Referência Multicaixa (REF)');

  try {
    const amount = 7500;
    const customer = {
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      phone: '923456789'
    };
    const description = 'Teste de pagamento Referência Multicaixa';

    logInfo('Criando pagamento Referência Multicaixa...');
    console.log('Parâmetros:', { amount, customer, description });

    const result = await tpagamentoService.createReferenciaMulticaixaPayment(
      amount,
      customer.name,
      customer.email,
      customer.phone,
      description
    );

    if (result.success) {
      logSuccess('Pagamento criado com sucesso!');
      console.log('\nResposta:');
      console.log(JSON.stringify(result, null, 2));
      return {
        success: true,
        paymentId: result.paymentId,
        reference: result.referenceCode
      };
    } else {
      logError('Falha ao criar pagamento!');
      console.log('\nErro:', result.message || 'Erro desconhecido');
      if (result.error) {
        console.log('Detalhes:', JSON.stringify(result.error, null, 2));
      }
      return { success: false };
    }
  } catch (error) {
    logError('Erro ao criar pagamento!');
    console.log('\nErro:', error.message);
    return { success: false };
  }
}

/**
 * Teste 5: Multicaixa Express - Saldo Insuficiente
 */
async function testMulticaixaExpressInsufficientBalance() {
  logSection('TESTE 5: Multicaixa Express - Saldo Insuficiente');

  try {
    const amount = 1000;
    const customer = {
      name: 'Teste Saldo',
      email: 'teste.saldo@example.com',
      phone: '244900000001' // Número de teste para saldo insuficiente
    };

    logInfo('Testando cenário de saldo insuficiente...');
    logInfo('Usando número de teste: 244900000001 (Saldo Insuficiente)');

    const result = await tpagamentoService.createMulticaixaExpressPayment(
      amount,
      customer.name,
      customer.email,
      customer.phone,
      'Teste de saldo insuficiente'
    );

    if (!result.success && result.status === 'failed') {
      logSuccess('Cenário de erro tratado corretamente!');
      console.log('\nResposta esperada (erro):');
      console.log(JSON.stringify(result, null, 2));
      return { success: true, expectedError: true };
    } else {
      logWarning('Resposta inesperada para cenário de erro');
      console.log('\nResposta:', JSON.stringify(result, null, 2));
      return { success: false };
    }
  } catch (error) {
    logError('Erro ao testar cenário!');
    console.log('\nErro:', error.message);
    return { success: false };
  }
}

/**
 * Teste 6: Multicaixa Express - Timeout
 */
async function testMulticaixaExpressTimeout() {
  logSection('TESTE 6: Multicaixa Express - Timeout');

  try {
    const amount = 1000;
    const customer = {
      name: 'Teste Timeout',
      email: 'teste.timeout@example.com',
      phone: '244900000002' // Número de teste para timeout
    };

    logInfo('Testando cenário de timeout...');
    logInfo('Usando número de teste: 244900000002 (Timeout)');

    const result = await tpagamentoService.createMulticaixaExpressPayment(
      amount,
      customer.name,
      customer.email,
      customer.phone,
      'Teste de timeout'
    );

    if (!result.success && result.status === 'failed') {
      logSuccess('Cenário de erro tratado corretamente!');
      console.log('\nResposta esperada (erro):');
      console.log(JSON.stringify(result, null, 2));
      return { success: true, expectedError: true };
    } else {
      logWarning('Resposta inesperada para cenário de erro');
      console.log('\nResposta:', JSON.stringify(result, null, 2));
      return { success: false };
    }
  } catch (error) {
    logError('Erro ao testar cenário!');
    console.log('\nErro:', error.message);
    return { success: false };
  }
}

/**
 * Teste 7: Multicaixa Express - Pedido Rejeitado
 */
async function testMulticaixaExpressRejected() {
  logSection('TESTE 7: Multicaixa Express - Pedido Rejeitado');

  try {
    const amount = 1000;
    const customer = {
      name: 'Teste Rejeitado',
      email: 'teste.rejeitado@example.com',
      phone: '244900000003' // Número de teste para pedido rejeitado
    };

    logInfo('Testando cenário de pedido rejeitado...');
    logInfo('Usando número de teste: 244900000003 (Pedido Rejeitado)');

    const result = await tpagamentoService.createMulticaixaExpressPayment(
      amount,
      customer.name,
      customer.email,
      customer.phone,
      'Teste de pedido rejeitado'
    );

    if (!result.success && result.status === 'failed') {
      logSuccess('Cenário de erro tratado corretamente!');
      console.log('\nResposta esperada (erro):');
      console.log(JSON.stringify(result, null, 2));
      return { success: true, expectedError: true };
    } else {
      logWarning('Resposta inesperada para cenário de erro');
      console.log('\nResposta:', JSON.stringify(result, null, 2));
      return { success: false };
    }
  } catch (error) {
    logError('Erro ao testar cenário!');
    console.log('\nErro:', error.message);
    return { success: false };
  }
}

/**
 * Teste 8: Verificar configuração TPagamento
 */
function testConfiguration() {
  logSection('TESTE 5: Verificar Configuração TPagamento');

  const config = {
    apiUrl: process.env.TPAGAMENTO_API_URL,
    apiKey: process.env.TPAGAMENTO_API_KEY,
    webhookSecret: process.env.TPAGAMENTO_WEBHOOK_SECRET
  };

  logInfo('Configuração atual:');
  console.log(`  - API URL: ${config.apiUrl || '(não configurado)'}`);
  console.log(`  - API Key: ${config.apiKey ? config.apiKey.substring(0, 20) + '...' : '(não configurado)'}`);
  console.log(`  - Webhook Secret: ${config.webhookSecret ? '***' : '(não configurado)'}`);

  const isConfigured = config.apiUrl && config.apiKey;
  
  if (isConfigured) {
    logSuccess('Configuração TPagamento OK!');
    return { success: true };
  } else {
    logError('Configuração TPagamento incompleta!');
    return { success: false };
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              TESTE DIRETO DE INTEGRAÇÃO TPAGAMENTO                         ║', 'cyan');
  log('║                    Incluindo Cenários de Erro                              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Teste 8: Verificar configuração (primeiro)
  results.total++;
  const test8 = testConfiguration();
  if (test8.success) {
    results.passed++;
  } else {
    results.failed++;
    logError('\n⚠️ Configuração incompleta. Alguns testes podem falhar.');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 1: e-Kwanza
  results.total++;
  const test1 = await testEKwanzaPayment();
  if (test1.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Status e-Kwanza
  results.total++;
  const test2 = await testEKwanzaStatus(test1.code);
  if (test2.skipped) {
    results.skipped++;
  } else if (test2.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 3: Multicaixa Express (Sucesso)
  results.total++;
  const test3 = await testMulticaixaExpressPayment();
  if (test3.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 4: Referência Multicaixa
  results.total++;
  const test4 = await testReferenciaMulticaixaPayment();
  if (test4.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 5: Multicaixa Express - Saldo Insuficiente
  results.total++;
  const test5 = await testMulticaixaExpressInsufficientBalance();
  if (test5.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 6: Multicaixa Express - Timeout
  results.total++;
  const test6 = await testMulticaixaExpressTimeout();
  if (test6.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 7: Multicaixa Express - Pedido Rejeitado
  results.total++;
  const test7 = await testMulticaixaExpressRejected();
  if (test7.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Resumo final
  logSection('RESUMO DOS TESTES');
  console.log(`Total de testes: ${results.total}`);
  logSuccess(`Testes aprovados: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Testes falhados: ${results.failed}`);
  }
  if (results.skipped > 0) {
    logWarning(`Testes pulados: ${results.skipped}`);
  }

  const successRate = ((results.passed / (results.total - results.skipped)) * 100).toFixed(2);
  console.log(`\nTaxa de sucesso: ${successRate}%`);

  if (results.failed === 0) {
    logSuccess('\n✓ Todos os testes passaram!');
  } else {
    logError('\n✗ Alguns testes falharam!');
  }

  logInfo('\n📝 Números de teste Multicaixa Express:');
  console.log('  ✅ 244900000000 - Pagamento com Sucesso');
  console.log('  ❌ 244900000001 - Saldo Insuficiente');
  console.log('  ❌ 244900000002 - Timeout');
  console.log('  ❌ 244900000003 - Pedido Rejeitado');

  console.log('\n');
}

// Executar testes
runAllTests().catch(error => {
  logError('Erro fatal ao executar testes:');
  console.error(error);
  process.exit(1);
});
