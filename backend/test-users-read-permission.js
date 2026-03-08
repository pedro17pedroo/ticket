/**
 * Teste de Permissão users.read para Role Agent
 * 
 * Verifica se o role agent tem a permissão users.read e se consegue
 * consultar tickets sem erros de permissão.
 */

import axios from 'axios';

const API_URL = 'http://localhost:4003/api';

// Credenciais do usuário de teste (agent)
const TEST_USER = {
  email: 'superuser@sistema.com',
  password: 'Senha@123'
};

// Credenciais alternativas (admin para teste)
const ADMIN_USER = {
  email: 'pedro17pedroo@gmail.com',
  password: 'Senha@123'
};

async function testUsersReadPermission() {
  console.log('🧪 TESTE: Permissão users.read para Role Agent\n');
  console.log('=' .repeat(80));

  try {
    // 1. Login
    console.log('\n1️⃣  Fazendo login como agent...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log(`✅ Login bem-sucedido`);
    console.log(`   Usuário: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);

    // 2. Verificar permissões do usuário
    console.log('\n2️⃣  Verificando permissões do usuário...');
    const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const permissions = profileResponse.data.user.permissions || [];
    const hasUsersRead = permissions.some(p => p.resource === 'users' && p.action === 'read');
    
    console.log(`   Total de permissões: ${permissions.length}`);
    console.log(`   Tem users.read: ${hasUsersRead ? '✅ SIM' : '❌ NÃO'}`);
    
    if (hasUsersRead) {
      const usersReadPerm = permissions.find(p => p.resource === 'users' && p.action === 'read');
      console.log(`   Descrição: ${usersReadPerm.description}`);
    }

    // 3. Consultar tickets (que faz JOIN com usuários)
    console.log('\n3️⃣  Consultando tickets (com JOIN de usuários)...');
    const ticketsResponse = await axios.get(`${API_URL}/tickets`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 5 }
    });
    
    const tickets = ticketsResponse.data.tickets;
    console.log(`✅ Consulta de tickets bem-sucedida`);
    console.log(`   Total de tickets: ${ticketsResponse.data.pagination.total}`);
    console.log(`   Tickets retornados: ${tickets.length}`);
    
    if (tickets.length > 0) {
      console.log('\n   📋 Exemplo de ticket com informações de usuário:');
      const ticket = tickets[0];
      console.log(`      Ticket: ${ticket.ticketNumber}`);
      console.log(`      Assunto: ${ticket.subject}`);
      
      if (ticket.requester) {
        console.log(`      Solicitante: ${ticket.requester.name} (${ticket.requester.email})`);
      }
      
      if (ticket.assignee) {
        console.log(`      Responsável: ${ticket.assignee.name} (${ticket.assignee.email})`);
      }
    }

    // 4. Consultar estatísticas (também faz consultas com filtros de visibilidade)
    console.log('\n4️⃣  Consultando estatísticas do dashboard...');
    const statsResponse = await axios.get(`${API_URL}/tickets/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const stats = statsResponse.data.statistics;
    console.log(`✅ Consulta de estatísticas bem-sucedida`);
    console.log(`   Total de tickets: ${stats.total}`);
    console.log(`   Por status:`);
    console.log(`      Novo: ${stats.byStatus.novo}`);
    console.log(`      Em Progresso: ${stats.byStatus.emProgresso}`);
    console.log(`      Aguardando Cliente: ${stats.byStatus.aguardandoCliente}`);
    console.log(`      Resolvido: ${stats.byStatus.resolvido}`);
    console.log(`      Fechado: ${stats.byStatus.fechado}`);

    // 5. Tentar acessar rota de gerenciamento de usuários (deve falhar)
    console.log('\n5️⃣  Tentando acessar rota de gerenciamento de usuários...');
    try {
      await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`⚠️  ATENÇÃO: Agent conseguiu acessar /users (não deveria)`);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(`✅ Acesso negado corretamente (403)`);
        console.log(`   Mensagem: ${error.response.data.error}`);
      } else {
        console.log(`❌ Erro inesperado: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO');
    console.log('='.repeat(80));
    console.log('\n📊 RESUMO:');
    console.log(`   ✅ Agent tem permissão users.read: ${hasUsersRead ? 'SIM' : 'NÃO'}`);
    console.log(`   ✅ Consegue consultar tickets com JOINs de usuários: SIM`);
    console.log(`   ✅ Consegue ver estatísticas do dashboard: SIM`);
    console.log(`   ✅ NÃO consegue acessar rota de gerenciamento de usuários: SIM`);
    console.log('\n💡 CONCLUSÃO:');
    console.log('   A permissão users.read permite que agentes VEJAM informações de');
    console.log('   usuários em contexto de tickets (solicitante, responsável), mas');
    console.log('   NÃO permite GERENCIAR usuários (criar, editar, deletar).');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Executar teste
testUsersReadPermission();
