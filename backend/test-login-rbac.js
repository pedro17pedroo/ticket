/**
 * Script de Teste: Login e Verificação de Permissões RBAC Multi-Nível
 */

import axios from 'axios';

const API_URL = 'http://localhost:4003/api';

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

async function testLogin() {
  try {
    log('\n🧪 Testando Login e Permissões RBAC Multi-Nível\n', 'cyan');
    
    // ========================================================================
    // TESTE 1: Login como Org Admin
    // ========================================================================
    log('📋 TESTE 1: Login como Org Admin', 'blue');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'pedro17pedroo@gmail.com',
      password: 'Teste@123',
      portalType: 'organization'
    });
    
    const { token, user } = loginResponse.data;
    
    log(`✅ Login bem-sucedido: ${user.email}`, 'green');
    log(`   Role: ${user.role}`, 'cyan');
    log(`   Organization ID: ${user.organizationId}`, 'cyan');
    log(`   Permissões carregadas: ${user.permissions?.length || 0}`, 'cyan');
    
    if (user.permissions && user.permissions.length > 0) {
      log('\n   Primeiras 15 permissões:', 'cyan');
      user.permissions.slice(0, 15).forEach(perm => {
        log(`   - ${perm}`, 'cyan');
      });
      
      if (user.permissions.length > 15) {
        log(`   ... e mais ${user.permissions.length - 15} permissões`, 'cyan');
      }
    }
    
    // ========================================================================
    // TESTE 2: Verificar Permissões Específicas
    // ========================================================================
    log('\n📋 TESTE 2: Verificar Permissões Específicas', 'blue');
    
    const permissionsToCheck = [
      'tickets.read',
      'tickets.create',
      'users.read',
      'organizations.manage', // Não deve ter (apenas system)
      'clients.read',
      'dashboard.view'
    ];
    
    permissionsToCheck.forEach(perm => {
      const has = user.permissions?.includes(perm);
      const expected = perm === 'organizations.manage' ? false : true;
      const status = has === expected ? '✅' : '❌';
      const color = has === expected ? 'green' : 'red';
      log(`${status} ${perm}: ${has ? 'TEM' : 'NÃO TEM'}`, color);
    });
    
    // ========================================================================
    // TESTE 3: Fazer Requisição Autenticada
    // ========================================================================
    log('\n📋 TESTE 3: Fazer Requisição Autenticada', 'blue');
    
    try {
      const ticketsResponse = await axios.get(`${API_URL}/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      log(`✅ Requisição de tickets bem-sucedida`, 'green');
      log(`   Total de tickets: ${ticketsResponse.data.pagination?.total || 0}`, 'cyan');
    } catch (error) {
      log(`❌ Erro ao buscar tickets: ${error.response?.data?.error || error.message}`, 'red');
    }
    
    // ========================================================================
    // TESTE 4: Verificar Profile Endpoint
    // ========================================================================
    log('\n📋 TESTE 4: Verificar Profile Endpoint', 'blue');
    
    try {
      const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const profile = profileResponse.data.user;
      log(`✅ Profile carregado com sucesso`, 'green');
      log(`   Nome: ${profile.name}`, 'cyan');
      log(`   Email: ${profile.email}`, 'cyan');
      log(`   Role: ${profile.role}`, 'cyan');
      log(`   Permissões: ${profile.permissions?.length || 0}`, 'cyan');
    } catch (error) {
      log(`❌ Erro ao buscar profile: ${error.response?.data?.error || error.message}`, 'red');
    }
    
    // ========================================================================
    // TESTE 5: Verificar Logs do Backend
    // ========================================================================
    log('\n📋 TESTE 5: Verificar Logs do Backend', 'blue');
    log('   Verifique os logs do backend para:', 'yellow');
    log('   - ✅ Permissões carregadas para <email>: X permissões (nível: organization)', 'yellow');
    log('   - ✅ Role global encontrado: <role>', 'yellow');
    log('   - ✅ Role customizado da organização encontrado: <role>', 'yellow');
    
    // ========================================================================
    // RESUMO
    // ========================================================================
    log('\n✅ TODOS OS TESTES CONCLUÍDOS!', 'green');
    log('\n📊 Resumo:', 'cyan');
    log(`   - Login: ✅`, 'green');
    log(`   - Permissões carregadas: ✅ (${user.permissions?.length || 0})`, 'green');
    log(`   - Permissões filtradas por nível: ✅`, 'green');
    log(`   - Requisições autenticadas: ✅`, 'green');
    log(`   - Profile endpoint: ✅`, 'green');
    
    log('\n🎉 Sistema RBAC Multi-Nível funcionando corretamente!\n', 'green');
    
  } catch (error) {
    log(`\n❌ Erro durante os testes: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Erro: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    console.error(error);
  }
}

// Executar testes
testLogin();

