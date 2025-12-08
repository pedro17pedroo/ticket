// Script de teste para validar o sistema de login mock
// Execute com: node test-login.js

const MOCK_USERS = [
  // Organization Users (tabela organization_users)
  {
    id: 1,
    name: 'Pedro Organization',
    email: 'pedro17pedroo@gmail.com',
    password: '123456789',
    role: 'org-admin',
    userType: 'organization',
    organizationId: 1,
    organizationName: 'Organização Principal'
  },
  {
    id: 2,
    name: 'Técnico Suporte',
    email: 'tecnico@organizacao.com',
    password: 'Tecnico@123',
    role: 'org-technician',
    userType: 'organization',
    organizationId: 1,
    organizationName: 'Organização Principal'
  },
  
  // Client Users (tabela client_users)
  {
    id: 3,
    name: 'Pedro Cliente',
    email: 'pedro.nekaka@gmail.com',
    password: '123456789',
    role: 'client-user',
    userType: 'client',
    organizationId: 1,
    clientId: 1,
    clientName: 'Empresa Cliente XYZ'
  },
  {
    id: 4,
    name: 'Cliente Teste',
    email: 'cliente@empresa.com',
    password: 'Cliente@123',
    role: 'client-user',
    userType: 'client',
    organizationId: 1,
    clientId: 2,
    clientName: 'Empresa Teste'
  }
];

// Função de teste
function testLogin(email, password) {
  console.log(`\n🔐 Testando login: ${email}`);
  
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  
  if (!user) {
    console.log('❌ FALHOU - Credenciais inválidas');
    return false;
  }
  
  console.log('✅ SUCESSO - Login bem-sucedido');
  console.log('👤 Usuário:', user.name);
  console.log('📧 Email:', user.email);
  console.log('🏢 Tipo:', user.userType);
  console.log('🎭 Role:', user.role);
  
  return true;
}

// Executar testes
console.log('='.repeat(60));
console.log('🧪 TESTE DO SISTEMA DE LOGIN MOCK');
console.log('='.repeat(60));

testLogin('pedro17pedroo@gmail.com', '123456789');
testLogin('pedro.nekaka@gmail.com', '123456789');
testLogin('tecnico@organizacao.com', 'Tecnico@123');
testLogin('cliente@empresa.com', 'Cliente@123');

// Teste com credenciais inválidas
console.log('\n' + '='.repeat(60));
console.log('🧪 TESTE COM CREDENCIAIS INVÁLIDAS');
console.log('='.repeat(60));
testLogin('pedro17pedroo@gmail.com', 'senha-errada');
testLogin('email-invalido@test.com', '123456789');

console.log('\n' + '='.repeat(60));
console.log('✅ TESTES CONCLUÍDOS');
console.log('='.repeat(60));
