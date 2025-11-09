import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

const testCredentials = [
  { email: 'admin@empresademo.com', password: 'Admin@123' },
  { email: 'agente@empresademo.com', password: 'Agente@123' },
  { email: 'superuser@sistema.com', password: 'Admin@123' }
];

async function testLogin() {
  console.log('🧪 Testando login no backend...\n');
  
  for (const cred of testCredentials) {
    console.log(`\n📧 Testando: ${cred.email}`);
    console.log('🔑 Senha:', cred.password);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cred)
      });
      
      console.log('📊 Status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📦 Resposta:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ Login bem-sucedido!');
        console.log('👤 Usuário:', data.user?.name);
        console.log('🏢 Organização:', data.user?.organization?.name);
        console.log('🎭 Role:', data.user?.role);
        console.log('🔐 Token:', data.token ? 'OK (presente)' : 'AUSENTE');
      } else {
        console.log('❌ Login falhou:', data.error || data.message);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
    }
  }
}

testLogin();
