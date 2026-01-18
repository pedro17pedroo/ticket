import axios from 'axios';

const API_URL = 'http://localhost:4003/api';

// Credenciais do usuário de teste (Portal Organização)
const TEST_USER = {
  email: 'tenant-admin@empresademo.com',
  password: 'TenantAdmin@123'
};

async function testProjectCreation() {
  try {
    console.log('🧪 Testando criação de projeto...\n');

    // 1. Login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido!');
    console.log('   Token:', token.substring(0, 20) + '...');
    console.log('   User:', loginResponse.data.user.name);
    console.log('   Organization:', loginResponse.data.user.organizationId);

    // 2. Listar projetos existentes
    console.log('\n2️⃣ Listando projetos existentes...');
    const listProjectsResponse = await axios.get(
      `${API_URL}/projects`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ Projetos listados!');
    console.log('   Total:', listProjectsResponse.data.pagination.total);
    if (listProjectsResponse.data.projects.length > 0) {
      console.log('   Projetos:');
      listProjectsResponse.data.projects.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.code} - ${p.name} (${p.status})`);
      });
      
      // 3. Buscar detalhes do primeiro projeto
      const firstProject = listProjectsResponse.data.projects[0];
      console.log('\n3️⃣ Buscando detalhes do projeto:', firstProject.code);
      const getProjectResponse = await axios.get(
        `${API_URL}/projects/${firstProject.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('✅ Projeto encontrado!');
      console.log('   Código:', getProjectResponse.data.project.code);
      console.log('   Nome:', getProjectResponse.data.project.name);
      console.log('   Metodologia:', getProjectResponse.data.project.methodology);
      console.log('   Status:', getProjectResponse.data.project.status);
      console.log('   Progresso:', getProjectResponse.data.project.progress + '%');
      console.log('   Criador:', getProjectResponse.data.project.creator?.name || 'N/A');
      console.log('   Fases:', getProjectResponse.data.project.phases?.length || 0);
    } else {
      console.log('   Nenhum projeto encontrado. Vamos criar um!');
      
      // 3. Criar projeto
      console.log('\n3️⃣ Criando projeto...');
      const projectData = {
        name: 'Projeto de Teste - Sessão 11',
        description: 'Projeto criado para testar a correção das tabelas do banco de dados',
        methodology: 'agile',
        status: 'planning',
        startDate: '2026-01-20',
        endDate: '2026-03-20'
      };

      const projectResponse = await axios.post(
        `${API_URL}/projects`,
        projectData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('✅ Projeto criado com sucesso!');
      console.log('   ID:', projectResponse.data.project.id);
      console.log('   Código:', projectResponse.data.project.code);
      console.log('   Nome:', projectResponse.data.project.name);
      console.log('   Metodologia:', projectResponse.data.project.methodology);
      console.log('   Status:', projectResponse.data.project.status);
    }

    console.log('\n✅ Todos os testes passaram com sucesso!');
    console.log('🎉 O sistema de projetos está funcionando corretamente!');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data?.stack) {
      console.error('\nStack trace:', error.response.data.stack);
    }
    process.exit(1);
  }
}

testProjectCreation();
