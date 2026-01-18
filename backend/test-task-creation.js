import axios from 'axios';

const API_URL = 'http://localhost:4003/api';

// Credenciais do usuário de teste
const TEST_USER = {
  email: 'tenant-admin@empresademo.com',
  password: 'TenantAdmin@123'
};

async function testTaskCreation() {
  try {
    console.log('🧪 Testando criação de tarefa em projeto...\n');

    // 1. Login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido!');

    // 2. Listar projetos
    console.log('\n2️⃣ Listando projetos...');
    const projectsResponse = await axios.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (projectsResponse.data.projects.length === 0) {
      console.log('❌ Nenhum projeto encontrado. Crie um projeto primeiro.');
      return;
    }

    const project = projectsResponse.data.projects[0];
    console.log(`✅ Projeto encontrado: ${project.code} - ${project.name}`);

    // 3. Criar fase se não existir
    console.log('\n3️⃣ Verificando fases do projeto...');
    const projectDetailsResponse = await axios.get(
      `${API_URL}/projects/${project.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let phase;
    if (projectDetailsResponse.data.project.phases?.length > 0) {
      phase = projectDetailsResponse.data.project.phases[0];
      console.log(`✅ Fase encontrada: ${phase.name}`);
    } else {
      console.log('📝 Criando nova fase...');
      const phaseResponse = await axios.post(
        `${API_URL}/projects/${project.id}/phases`,
        {
          name: 'Fase de Teste',
          description: 'Fase criada para testar criação de tarefas',
          status: 'pending'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      phase = phaseResponse.data.phase;
      console.log(`✅ Fase criada: ${phase.name}`);
    }

    // 4. Criar tarefa
    console.log('\n4️⃣ Criando tarefa...');
    const taskData = {
      title: 'Tarefa de Teste',
      description: 'Tarefa criada para testar o sistema',
      status: 'todo',
      priority: 'medium',
      startDate: '2026-01-20',
      dueDate: '2026-01-25'
    };

    const taskResponse = await axios.post(
      `${API_URL}/projects/${project.id}/phases/${phase.id}/tasks`,
      taskData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Tarefa criada com sucesso!');
    console.log('   ID:', taskResponse.data.task.id);
    console.log('   Título:', taskResponse.data.task.title);
    console.log('   Status:', taskResponse.data.task.status);
    console.log('   Prioridade:', taskResponse.data.task.priority);

    // 5. Listar tarefas
    console.log('\n5️⃣ Listando tarefas do projeto...');
    const tasksResponse = await axios.get(
      `${API_URL}/projects/${project.id}/tasks`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Tarefas listadas!');
    console.log('   Total:', tasksResponse.data.tasks.length);
    tasksResponse.data.tasks.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.title} (${t.status}) - ${t.priority}`);
    });

    console.log('\n✅ Todos os testes passaram com sucesso!');
    console.log('🎉 O sistema de tarefas está funcionando corretamente!');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data?.stack) {
      console.error('\nStack trace:', error.response.data.stack);
    }
    process.exit(1);
  }
}

testTaskCreation();
