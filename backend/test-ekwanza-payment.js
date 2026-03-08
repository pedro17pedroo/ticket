/**
 * Teste específico para pagamento e-Kwanza
 * Valida a estrutura de resposta com QR Code
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

// Se não houver token, vamos fazer login primeiro
let authToken = TEST_TOKEN;

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
 * Valida a estrutura de resposta do e-Kwanza
 */
function validateEKwanzaResponse(response) {
  const errors = [];
  const warnings = [];

  // Validar estrutura principal
  if (!response.success) {
    errors.push('Campo "success" deve ser true');
  }

  if (!response.data) {
    errors.push('Campo "data" é obrigatório');
    return { valid: false, errors, warnings };
  }

  const data = response.data;

  // Validar campos obrigatórios
  const requiredFields = [
    'id',
    'reference',
    'status',
    'amount',
    'currency',
    'paymentMethod',
    'code',
    'qrCode',
    'message',
    'provider',
    'createdAt'
  ];

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`Campo obrigatório ausente: data.${field}`);
    }
  });

  // Validar tipos de dados
  if (data.id && typeof data.id !== 'string') {
    errors.push('data.id deve ser string (UUID)');
  }

  if (data.reference && typeof data.reference !== 'string') {
    errors.push('data.reference deve ser string');
  }

  if (data.status && data.status !== 'pending') {
    warnings.push(`Status esperado "pending", recebido "${data.status}"`);
  }

  if (data.amount && typeof data.amount !== 'number') {
    errors.push('data.amount deve ser number');
  }

  if (data.currency && data.currency !== 'AOA') {
    warnings.push(`Moeda esperada "AOA", recebida "${data.currency}"`);
  }

  if (data.paymentMethod && data.paymentMethod !== 'ekwanza_qr') {
    errors.push(`paymentMethod deve ser "ekwanza_qr", recebido "${data.paymentMethod}"`);
  }

  if (data.code && typeof data.code !== 'string') {
    errors.push('data.code deve ser string');
  }

  if (data.qrCode && typeof data.qrCode !== 'string') {
    errors.push('data.qrCode deve ser string (base64)');
  } else if (data.qrCode) {
    // Validar se é base64 válido
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(data.qrCode)) {
      warnings.push('qrCode não parece ser base64 válido');
    }
    
    // Verificar tamanho mínimo (QR Code deve ter tamanho razoável)
    if (data.qrCode.length < 100) {
      warnings.push('qrCode parece muito pequeno para ser um QR Code válido');
    }
  }

  if (data.providerStatus !== undefined && typeof data.providerStatus !== 'number') {
    errors.push('data.providerStatus deve ser number');
  }

  if (data.expirationDate && typeof data.expirationDate !== 'string') {
    errors.push('data.expirationDate deve ser string');
  }

  // Validar fees
  if (data.fees) {
    if (typeof data.fees.amount !== 'number') {
      errors.push('data.fees.amount deve ser number');
    }
    if (typeof data.fees.netAmount !== 'number') {
      errors.push('data.fees.netAmount deve ser number');
    }
    
    // Validar cálculo de fees
    if (data.amount && data.fees.amount && data.fees.netAmount) {
      const expectedNet = data.amount - data.fees.amount;
      if (Math.abs(expectedNet - data.fees.netAmount) > 0.01) {
        warnings.push(`Cálculo de fees inconsistente: ${data.amount} - ${data.fees.amount} ≠ ${data.fees.netAmount}`);
      }
    }
  }

  // Validar _system_info
  if (data._system_info) {
    if (!data._system_info.transaction_table_id) {
      warnings.push('_system_info.transaction_table_id ausente');
    }
    if (!data._system_info.payment_reference) {
      warnings.push('_system_info.payment_reference ausente');
    }
    if (!data._system_info.provider_external_id) {
      warnings.push('_system_info.provider_external_id ausente');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Fazer login e obter token
 */
async function getAuthToken() {
  if (authToken) {
    return authToken;
  }

  try {
    logInfo('Fazendo login para obter token de autenticação...');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      {
        email: 'admin@tatusolutions.com',
        password: 'Admin@123'
      }
    );

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      logSuccess('Login realizado com sucesso!');
      return authToken;
    } else {
      throw new Error('Resposta de login inválida');
    }
  } catch (error) {
    logError('Erro ao fazer login!');
    if (error.response) {
      console.log('Resposta:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Erro:', error.message);
    }
    throw error;
  }
}

/**
 * Teste 1: Criar pagamento e-Kwanza
 */
async function testCreateEKwanzaPayment() {
  logSection('TESTE 1: Criar Pagamento e-Kwanza');

  try {
    // Obter token de autenticação
    const token = await getAuthToken();

    const paymentData = {
      amount: 2500,
      paymentMethod: 'ekwanza',
      customerName: 'João Silva',
      customerEmail: 'joao.silva@example.com',
      customerPhone: '923456789',
      description: 'Teste de pagamento e-Kwanza',
      subscriptionId: null
    };

    logInfo('Enviando requisição para criar pagamento...');
    console.log('Dados:', JSON.stringify(paymentData, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/api/payments/create`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logSuccess('Pagamento criado com sucesso!');
    console.log('\nResposta completa:');
    console.log(JSON.stringify(response.data, null, 2));

    // Validar estrutura da resposta
    logInfo('\nValidando estrutura da resposta...');
    const validation = validateEKwanzaResponse(response.data);

    if (validation.valid) {
      logSuccess('Estrutura da resposta válida!');
    } else {
      logError('Estrutura da resposta inválida!');
    }

    if (validation.errors.length > 0) {
      logError('\nErros encontrados:');
      validation.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    if (validation.warnings.length > 0) {
      logWarning('\nAvisos:');
      validation.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    // Exibir informações do QR Code
    if (response.data.data && response.data.data.qrCode) {
      logInfo('\nInformações do QR Code:');
      console.log(`  - Código: ${response.data.data.code}`);
      console.log(`  - Tamanho do QR Code: ${response.data.data.qrCode.length} caracteres`);
      console.log(`  - Primeiros 100 caracteres: ${response.data.data.qrCode.substring(0, 100)}...`);
      
      // Tentar decodificar informações do QR Code (se for base64 de imagem)
      if (response.data.data.qrCode.startsWith('Qk1')) {
        logInfo('  - Formato: BMP (Bitmap) em base64');
      } else if (response.data.data.qrCode.startsWith('iVBOR')) {
        logInfo('  - Formato: PNG em base64');
      } else if (response.data.data.qrCode.startsWith('/9j/')) {
        logInfo('  - Formato: JPEG em base64');
      }
    }

    // Exibir informações de fees
    if (response.data.data && response.data.data.fees) {
      logInfo('\nInformações de Taxas:');
      console.log(`  - Valor total: ${response.data.data.amount} ${response.data.data.currency}`);
      console.log(`  - Taxa: ${response.data.data.fees.amount} ${response.data.data.currency}`);
      console.log(`  - Valor líquido: ${response.data.data.fees.netAmount} ${response.data.data.currency}`);
      console.log(`  - Percentual de taxa: ${((response.data.data.fees.amount / response.data.data.amount) * 100).toFixed(2)}%`);
    }

    return {
      success: true,
      paymentId: response.data.data?.id,
      reference: response.data.data?.reference,
      code: response.data.data?.code,
      validation
    };

  } catch (error) {
    logError('Erro ao criar pagamento!');
    
    if (error.response) {
      console.log('\nResposta de erro:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('\nErro:', error.message);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Teste 2: Consultar status do pagamento
 */
async function testCheckPaymentStatus(paymentId) {
  logSection('TESTE 2: Consultar Status do Pagamento');

  if (!paymentId) {
    logWarning('ID do pagamento não fornecido, pulando teste');
    return { success: false, skipped: true };
  }

  try {
    // Obter token de autenticação
    const token = await getAuthToken();

    logInfo(`Consultando status do pagamento ${paymentId}...`);

    const response = await axios.get(
      `${API_BASE_URL}/api/payments/${paymentId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    logSuccess('Status consultado com sucesso!');
    console.log('\nResposta:');
    console.log(JSON.stringify(response.data, null, 2));

    return {
      success: true,
      status: response.data.status
    };

  } catch (error) {
    logError('Erro ao consultar status!');
    
    if (error.response) {
      console.log('\nResposta de erro:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('\nErro:', error.message);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Teste 3: Validar estrutura de resposta mock
 */
function testMockResponseStructure() {
  logSection('TESTE 3: Validar Estrutura de Resposta Mock');

  const mockResponse = {
    "success": true,
    "data": {
      "id": "0788e968-fd86-472d-898d-734b252f8899",
      "reference": "TRX071921307055",
      "status": "pending",
      "amount": 2500,
      "currency": "AOA",
      "paymentMethod": "ekwanza_qr",
      "code": "687479301",
      "qrCode": "Qk1MAAAAAAAAABoAAAAMAAAA4QDhAAEAGAD///...",
      "providerStatus": 0,
      "expirationDate": "/Date(1772907493640)/",
      "message": "Código de pagamento criado com sucesso",
      "provider": "eKwanza Integrado",
      "createdAt": "2026-03-07T18:13:12.131Z",
      "fees": {
        "amount": 150,
        "netAmount": 2350
      },
      "_system_info": {
        "transaction_table_id": "0788e968-fd86-472d-898d-734b252f8899",
        "payment_reference": "TRX071921307055",
        "provider_external_id": "687479301"
      }
    }
  };

  logInfo('Validando estrutura de resposta mock...');
  const validation = validateEKwanzaResponse(mockResponse);

  if (validation.valid) {
    logSuccess('Estrutura mock válida!');
  } else {
    logError('Estrutura mock inválida!');
  }

  if (validation.errors.length > 0) {
    logError('\nErros encontrados:');
    validation.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  if (validation.warnings.length > 0) {
    logWarning('\nAvisos:');
    validation.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }

  return {
    success: validation.valid,
    validation
  };
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    TESTE DE PAGAMENTO E-KWANZA                             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Teste 1: Criar pagamento
  results.total++;
  const test1 = await testCreateEKwanzaPayment();
  if (test1.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Aguardar um pouco antes do próximo teste
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Consultar status
  results.total++;
  const test2 = await testCheckPaymentStatus(test1.paymentId);
  if (test2.skipped) {
    results.skipped++;
  } else if (test2.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Teste 3: Validar estrutura mock
  results.total++;
  const test3 = testMockResponseStructure();
  if (test3.success) {
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

  console.log('\n');
}

// Executar testes
runAllTests().catch(error => {
  logError('Erro fatal ao executar testes:');
  console.error(error);
  process.exit(1);
});
