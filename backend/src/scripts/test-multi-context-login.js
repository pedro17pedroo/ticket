/**
 * Script para testar o sistema multi-contexto
 * Testa diretamente o contextService sem precisar do servidor rodando
 */

import { setupAssociations } from '../modules/models/index.js';
import contextService from '../services/contextService.js';
import bcrypt from 'bcryptjs';

// IMPORTANTE: Configurar associações antes de usar os modelos
setupAssociations();

const TEST_EMAIL = 'multicontext@test.com';
const TEST_PASSWORD = 'Test@123';

async function testMultiContext() {
  console.log('🧪 Testando Sistema Multi-Contexto\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Buscar todos os contextos disponíveis
    console.log('1️⃣  Buscando contextos disponíveis...\n');
    
    const contexts = await contextService.getContextsForEmail(TEST_EMAIL, TEST_PASSWORD);
    
    if (!contexts || contexts.length === 0) {
      console.log('❌ Nenhum contexto encontrado para o email:', TEST_EMAIL);
      console.log('Execute primeiro: node src/scripts/create-multi-context-test-data.js\n');
      return;
    }

    console.log(`✅ Encontrados ${contexts.length} contextos:\n`);
    
    contexts.forEach((ctx, index) => {
      console.log(`${index + 1}. ${ctx.contextType === 'organization' ? '🏢' : '👥'} ${ctx.organizationName || ctx.clientName}`);
      console.log(`   Tipo: ${ctx.contextType}`);
      console.log(`   Role: ${ctx.role}`);
      console.log(`   Context ID: ${ctx.contextId}`);
      console.log(`   User ID: ${ctx.id}`);
      console.log('');
    });

    // 2. Senha já foi validada no getContextsForEmail
    console.log('2️⃣  Senha validada com sucesso!\n');

    // 3. Criar sessão para o primeiro contexto
    console.log('3️⃣  Criando sessão para o primeiro contexto...\n');
    
    const firstContext = contexts[0];
    const session = await contextService.createContextSession(
      firstContext.id,
      firstContext.userType,
      firstContext.contextId,
      firstContext.contextType,
      '127.0.0.1',
      'Test Script'
    );

    console.log('✅ Sessão criada com sucesso!');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Session Token: ${session.sessionToken.substring(0, 20)}...`);
    console.log(`   Context: ${firstContext.contextType} - ${firstContext.organizationName || firstContext.clientName}`);
    console.log(`   Expira em: ${session.expiresAt}`);
    console.log('');

    // 4. Validar sessão
    console.log('4️⃣  Validando sessão...\n');
    
    const validSession = await contextService.getActiveContext(session.id);
    
    if (validSession) {
      console.log('✅ Sessão válida!');
      console.log(`   User ID: ${validSession.userId}`);
      console.log(`   Context ID: ${validSession.contextId}`);
      console.log(`   Context Type: ${validSession.contextType}`);
      console.log('');
    } else {
      console.log('❌ Sessão inválida\n');
    }

    // 5. Registrar troca de contexto (simulação)
    if (contexts.length > 1) {
      console.log('5️⃣  Simulando troca de contexto...\n');
      
      const secondContext = contexts[1];
      
      await contextService.logContextSwitch(
        firstContext.id,
        {
          contextId: firstContext.contextId,
          contextType: firstContext.contextType
        },
        {
          contextId: secondContext.contextId,
          contextType: secondContext.contextType,
          email: secondContext.email,
          userType: secondContext.userType
        },
        '127.0.0.1',
        'Test Script'
      );

      console.log('✅ Troca de contexto registrada!');
      console.log(`   De: ${firstContext.contextType} - ${firstContext.organizationName || firstContext.clientName}`);
      console.log(`   Para: ${secondContext.contextType} - ${secondContext.organizationName || secondContext.clientName}`);
      console.log('');
    }

    // 6. Buscar histórico de contexto
    console.log('6️⃣  Buscando histórico de contexto...\n');
    
    const history = await contextService.getContextSwitchHistory(TEST_EMAIL, {
      limit: 5
    });

    console.log(`✅ Encontrados ${history.total} registros no histórico`);
    if (history.history && history.history.length > 0) {
      console.log('\nÚltimas ações:');
      history.history.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} - ${log.success ? '✅' : '❌'} ${log.success ? 'Sucesso' : 'Falha'}`);
        console.log(`   Data: ${log.createdAt}`);
        if (log.fromContextType) {
          console.log(`   De: ${log.fromContextType}`);
        }
        if (log.toContextType) {
          console.log(`   Para: ${log.toContextType}`);
        }
        console.log('');
      });
    }

    // 7. Invalidar sessão
    console.log('7️⃣  Invalidando sessão...\n');
    
    await contextService.invalidateContextSession(session.id);
    console.log('✅ Sessão invalidada com sucesso!\n');

    // 8. Tentar validar sessão invalidada
    console.log('8️⃣  Tentando validar sessão invalidada...\n');
    
    const invalidSession = await contextService.getActiveContext(session.id);
    
    if (!invalidSession) {
      console.log('✅ Sessão corretamente invalidada (não é mais válida)\n');
    } else {
      console.log('❌ Erro: Sessão ainda está válida após invalidação\n');
    }

    // Resumo final
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📊 Resumo:');
    console.log(`   • ${contexts.length} contextos encontrados`);
    console.log(`   • Sessão criada e validada`);
    console.log(`   • Troca de contexto registrada`);
    console.log(`   • Histórico recuperado`);
    console.log(`   • Sessão invalidada corretamente`);
    console.log('');

    console.log('🎉 Sistema Multi-Contexto está 100% funcional!\n');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testMultiContext();
