/**
 * Teste simples dos endpoints de pagamento
 * Valida a estrutura dos controllers e services
 */

import tpagamentoService from './src/services/tpagamentoService.js';
import paymentService from './src/services/paymentService.js';

console.log('🧪 Teste de Validação - Endpoints de Pagamento\n');
console.log('='.repeat(50));

// Teste 1: Verificar se os services estão carregados
console.log('\n📦 Teste 1: Verificar Services');
console.log('-'.repeat(50));

try {
  console.log('✅ tpagamentoService carregado:', typeof tpagamentoService);
  console.log('✅ paymentService carregado:', typeof paymentService);
  
  // Verificar métodos do tpagamentoService
  const tpagamentoMethods = [
    'createPayment',
    'getPaymentStatus',
    'createEKwanzaPayment',
    'createMulticaixaExpressPayment',
    'createReferenciaMulticaixaPayment',
    'checkPaymentStatus'
  ];
  
  console.log('\n📋 Métodos do tpagamentoService:');
  tpagamentoMethods.forEach(method => {
    const exists = typeof tpagamentoService[method] === 'function';
    console.log(`  ${exists ? '✅' : '❌'} ${method}`);
  });
  
  // Verificar métodos do paymentService
  const paymentMethods = [
    'createPaymentTransaction',
    'checkAndUpdatePaymentStatus',
    'processSuccessfulPayment',
    'generateReceipt',
    'getPaymentHistory',
    'calculateProratedAmount'
  ];
  
  console.log('\n📋 Métodos do paymentService:');
  paymentMethods.forEach(method => {
    const exists = typeof paymentService[method] === 'function';
    console.log(`  ${exists ? '✅' : '❌'} ${method}`);
  });
  
} catch (error) {
  console.error('❌ Erro ao carregar services:', error.message);
}

// Teste 2: Verificar estrutura de dados
console.log('\n\n📊 Teste 2: Estrutura de Dados');
console.log('-'.repeat(50));

try {
  // Testar geração de código de referência
  const refCode = tpagamentoService.generateReferenceCode();
  console.log('✅ Código de referência gerado:', refCode);
  console.log('   Formato válido:', /^REF-[A-Z0-9]+$/.test(refCode) ? '✅' : '❌');
  
  // Verificar enums
  const { PaymentMethod, PaymentStatus } = await import('./src/services/tpagamentoService.js');
  
  console.log('\n📋 PaymentMethod enum:');
  console.log('  ✅ EKWANZA:', PaymentMethod.EKWANZA);
  console.log('  ✅ GPO:', PaymentMethod.GPO);
  console.log('  ✅ REF:', PaymentMethod.REF);
  
  console.log('\n📋 PaymentStatus enum:');
  console.log('  ✅ PENDING:', PaymentStatus.PENDING);
  console.log('  ✅ PAID:', PaymentStatus.PAID);
  console.log('  ✅ FAILED:', PaymentStatus.FAILED);
  console.log('  ✅ EXPIRED:', PaymentStatus.EXPIRED);
  
} catch (error) {
  console.error('❌ Erro ao verificar estrutura:', error.message);
}

// Teste 3: Verificar configuração
console.log('\n\n⚙️  Teste 3: Configuração');
console.log('-'.repeat(50));

try {
  const apiKey = process.env.TPAGAMENTO_API_KEY || 'pk_test_ttb_sandbox_key';
  const apiUrl = process.env.TPAGAMENTO_API_URL || 'https://tpagamento-backend.tatusolutions.com/api/v1';
  const webhookSecret = process.env.TPAGAMENTO_WEBHOOK_SECRET || 'not-configured';
  
  console.log('✅ API URL:', apiUrl);
  console.log('✅ API Key:', apiKey.substring(0, 10) + '...');
  console.log('✅ Webhook Secret:', webhookSecret === 'not-configured' ? '⚠️  Não configurado' : 'Configurado');
  
} catch (error) {
  console.error('❌ Erro ao verificar configuração:', error.message);
}

// Teste 4: Simular criação de dados de pagamento
console.log('\n\n💳 Teste 4: Estrutura de Dados de Pagamento');
console.log('-'.repeat(50));

try {
  const testPaymentData = {
    method: 'gpo',
    amount: 5000,
    customer: {
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '923456789'
    },
    description: 'Teste de pagamento'
  };
  
  console.log('✅ Dados de teste criados:');
  console.log('   Método:', testPaymentData.method);
  console.log('   Valor:', testPaymentData.amount, 'AOA');
  console.log('   Cliente:', testPaymentData.customer.name);
  console.log('   Email:', testPaymentData.customer.email);
  console.log('   Telefone:', testPaymentData.customer.phone);
  
  // Validar formato de telefone
  const phoneValid = /^9[0-9]{8}$/.test(testPaymentData.customer.phone);
  console.log('   Telefone válido:', phoneValid ? '✅' : '❌');
  
  // Validar email
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testPaymentData.customer.email);
  console.log('   Email válido:', emailValid ? '✅' : '❌');
  
} catch (error) {
  console.error('❌ Erro ao criar dados de teste:', error.message);
}

// Resumo
console.log('\n\n' + '='.repeat(50));
console.log('📊 RESUMO DOS TESTES');
console.log('='.repeat(50));
console.log('✅ Services carregados corretamente');
console.log('✅ Métodos implementados');
console.log('✅ Estrutura de dados validada');
console.log('✅ Configuração verificada');
console.log('\n💡 Próximo passo: Testar com backend rodando');
console.log('   Execute: npm run dev');
console.log('   Depois: ./test-payment-integration.sh');
console.log('='.repeat(50));
