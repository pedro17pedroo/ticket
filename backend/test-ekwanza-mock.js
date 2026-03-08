/**
 * Teste Mock para validar estrutura de resposta e-Kwanza
 * Não requer servidor rodando
 */

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

  if (data.status && !['pending', 'completed', 'failed', 'expired'].includes(data.status)) {
    warnings.push(`Status "${data.status}" não é um dos valores esperados`);
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
    // Validar tamanho mínimo (QR Code deve ter tamanho razoável)
    if (data.qrCode.length < 1000) {
      warnings.push(`qrCode parece pequeno (${data.qrCode.length} caracteres). QR Codes geralmente têm > 1000 caracteres`);
    }
    
    // Verificar se começa com prefixo de imagem base64
    const imageFormats = {
      'Qk1': 'BMP',
      'iVBOR': 'PNG',
      '/9j/': 'JPEG',
      'R0lGOD': 'GIF'
    };
    
    let formatDetected = false;
    for (const [prefix, format] of Object.entries(imageFormats)) {
      if (data.qrCode.startsWith(prefix)) {
        logInfo(`  Formato detectado: ${format}`);
        formatDetected = true;
        break;
      }
    }
    
    if (!formatDetected) {
      warnings.push('Formato de imagem do QR Code não reconhecido');
    }
  }

  if (data.providerStatus !== undefined && typeof data.providerStatus !== 'number') {
    errors.push('data.providerStatus deve ser number');
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
        errors.push(`Cálculo de fees incorreto: ${data.amount} - ${data.fees.amount} = ${expectedNet}, mas netAmount = ${data.fees.netAmount}`);
      } else {
        logSuccess(`  Cálculo de fees correto: ${data.amount} - ${data.fees.amount} = ${data.fees.netAmount}`);
      }
    }
  } else {
    warnings.push('Campo "fees" não presente (opcional mas recomendado)');
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
  } else {
    warnings.push('Campo "_system_info" não presente (opcional mas recomendado)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Teste com resposta real fornecida
 */
function testRealResponse() {
  logSection('TESTE 1: Validar Resposta Real e-Kwanza');

  // Resposta real fornecida pelo usuário (com QR Code truncado para exemplo)
  const realResponse = {
    "success": true,
    "data": {
      "id": "0788e968-fd86-472d-898d-734b252f8899",
      "reference": "TRX071921307055",
      "status": "pending",
      "amount": 2500,
      "currency": "AOA",
      "paymentMethod": "ekwanza_qr",
      "code": "687479301",
      "qrCode": "Qk1MAAAAAAAAABoAAAAMAAAA4QDhAAEAGAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8A////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8A////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8A////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AP///////////////////////////////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAP///////////////////////////////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAP///////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////////////////////////////////////wAAAAAAAAAAAAAAAAAAAP///////////////////wAAAAAAAAAAAAAAAAAAAP///////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////////////////wAAAAAAAAAAAAAAAAAAAP///////////////////wAAAAAAAAAAAAAAAAAAAP///////////////////////////////////////////////////////////////////////////////wD///////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAD///////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////8AAAAAAAAAAAAAAAAAAAD///////////////////8AAAAAAAAAAAAAAAAAAAD///////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////////8AAAAAAAAAAAAAAAAAAAD///////////////////8AAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////////////////////////////////////////8A",
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

  logInfo('Validando estrutura da resposta real...');
  console.log('\nDados da resposta:');
  console.log(`  - ID: ${realResponse.data.id}`);
  console.log(`  - Referência: ${realResponse.data.reference}`);
  console.log(`  - Status: ${realResponse.data.status}`);
  console.log(`  - Valor: ${realResponse.data.amount} ${realResponse.data.currency}`);
  console.log(`  - Método: ${realResponse.data.paymentMethod}`);
  console.log(`  - Código: ${realResponse.data.code}`);
  console.log(`  - Tamanho QR Code: ${realResponse.data.qrCode.length} caracteres`);
  console.log(`  - Provedor: ${realResponse.data.provider}`);

  const validation = validateEKwanzaResponse(realResponse);

  console.log('\n');
  if (validation.valid) {
    logSuccess('✓ Estrutura da resposta VÁLIDA!');
  } else {
    logError('✗ Estrutura da resposta INVÁLIDA!');
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

  // Análise detalhada do QR Code
  if (realResponse.data.qrCode) {
    logInfo('\nAnálise do QR Code:');
    console.log(`  - Tamanho: ${realResponse.data.qrCode.length} caracteres`);
    console.log(`  - Primeiros 20 caracteres: ${realResponse.data.qrCode.substring(0, 20)}...`);
    console.log(`  - Últimos 20 caracteres: ...${realResponse.data.qrCode.substring(realResponse.data.qrCode.length - 20)}`);
  }

  // Análise de taxas
  if (realResponse.data.fees) {
    logInfo('\nAnálise de Taxas:');
    const percentual = (realResponse.data.fees.amount / realResponse.data.amount * 100).toFixed(2);
    console.log(`  - Valor bruto: ${realResponse.data.amount} AOA`);
    console.log(`  - Taxa: ${realResponse.data.fees.amount} AOA (${percentual}%)`);
    console.log(`  - Valor líquido: ${realResponse.data.fees.netAmount} AOA`);
  }

  return {
    success: validation.valid,
    validation
  };
}

/**
 * Teste com diferentes cenários
 */
function testDifferentScenarios() {
  logSection('TESTE 2: Validar Diferentes Cenários');

  const scenarios = [
    {
      name: 'Resposta Mínima (apenas campos obrigatórios)',
      response: {
        success: true,
        data: {
          id: "test-uuid-123",
          reference: "TRX123456",
          status: "pending",
          amount: 1000,
          currency: "AOA",
          paymentMethod: "ekwanza_qr",
          code: "123456",
          qrCode: "Qk1M" + "A".repeat(2000), // QR Code simulado
          message: "Teste",
          provider: "eKwanza",
          createdAt: new Date().toISOString()
        }
      }
    },
    {
      name: 'Resposta com status completed',
      response: {
        success: true,
        data: {
          id: "test-uuid-456",
          reference: "TRX789012",
          status: "completed",
          amount: 5000,
          currency: "AOA",
          paymentMethod: "ekwanza_qr",
          code: "789012",
          qrCode: "iVBOR" + "B".repeat(2000),
          message: "Pagamento concluído",
          provider: "eKwanza",
          createdAt: new Date().toISOString(),
          fees: {
            amount: 250,
            netAmount: 4750
          }
        }
      }
    },
    {
      name: 'Resposta com erro (success: false)',
      response: {
        success: false,
        data: {
          id: "test-uuid-789",
          reference: "TRX345678",
          status: "failed",
          amount: 1500,
          currency: "AOA",
          paymentMethod: "ekwanza_qr",
          code: "345678",
          qrCode: "/9j/" + "C".repeat(2000),
          message: "Erro no pagamento",
          provider: "eKwanza",
          createdAt: new Date().toISOString()
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log('-'.repeat(80));
    
    const validation = validateEKwanzaResponse(scenario.response);
    
    if (validation.valid) {
      logSuccess('  ✓ Cenário válido');
      passed++;
    } else {
      logError('  ✗ Cenário inválido');
      failed++;
    }

    if (validation.errors.length > 0) {
      console.log('  Erros:');
      validation.errors.forEach(error => {
        console.log(`    - ${error}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('  Avisos:');
      validation.warnings.forEach(warning => {
        console.log(`    - ${warning}`);
      });
    }
  });

  console.log('\n');
  logInfo(`Cenários testados: ${scenarios.length}`);
  logSuccess(`Cenários válidos: ${passed}`);
  if (failed > 0) {
    logError(`Cenários inválidos: ${failed}`);
  }

  return {
    total: scenarios.length,
    passed,
    failed
  };
}

/**
 * Executar todos os testes
 */
function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              TESTE MOCK DE PAGAMENTO E-KWANZA (SEM SERVIDOR)              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Teste 1: Resposta real
  const test1 = testRealResponse();
  results.total++;
  if (test1.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Teste 2: Diferentes cenários
  const test2 = testDifferentScenarios();
  results.total += test2.total;
  results.passed += test2.passed;
  results.failed += test2.failed;

  // Resumo final
  logSection('RESUMO GERAL DOS TESTES');
  console.log(`Total de testes: ${results.total}`);
  logSuccess(`Testes aprovados: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Testes falhados: ${results.failed}`);
  }

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`\nTaxa de sucesso: ${successRate}%`);

  if (results.failed === 0) {
    logSuccess('\n✓ Todos os testes passaram!');
    logInfo('\nA estrutura de resposta do e-Kwanza está correta e pronta para uso.');
  } else {
    logError('\n✗ Alguns testes falharam!');
    logWarning('\nRevise os erros acima e ajuste a implementação.');
  }

  console.log('\n');
}

// Executar testes
runAllTests();
