import axios from 'axios';
import logger from '../config/logger.js';

const API_URL = 'http://localhost:3000/api';

async function testTodosV2Endpoint() {
  try {
    logger.info('=== Testando endpoint /api/organization/todos ===\n');

    // Credenciais do org-admin
    const credentials = {
      email: 'admin@tdesk.com.br',
      password: 'Admin@123'
    };

    logger.info('1. Fazendo login como org-admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, credentials);
    const token = loginResponse.data.token;
    logger.info('✅ Login realizado com sucesso');
    logger.info(`Token: ${token.substring(0, 50)}...`);

    // Configurar headers com token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    logger.info('\n2. Testando GET /api/organization/todos...');
    try {
      const todosResponse = await axios.get(`${API_URL}/organization/todos`, { headers });
      logger.info('✅ Endpoint funcionando!');
      logger.info(`Status: ${todosResponse.status}`);
      logger.info(`Total de todos: ${todosResponse.data.length || 0}`);
      
      if (todosResponse.data.length > 0) {
        logger.info('\nPrimeiro todo:');
        logger.info(JSON.stringify(todosResponse.data[0], null, 2));
      } else {
        logger.info('Nenhum todo encontrado (isso é normal se não houver dados)');
      }
    } catch (error) {
      if (error.response) {
        logger.error('❌ Erro na requisição:');
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Mensagem: ${error.response.data.message || error.response.data.error}`);
        logger.error('Detalhes:', error.response.data);
      } else {
        throw error;
      }
    }

    logger.info('\n3. Testando criação de um novo todo...');
    try {
      const newTodo = {
        title: 'Teste de Todo V2',
        description: 'Este é um teste do sistema de todos V2',
        priority: 'medium',
        status: 'todo'
      };

      const createResponse = await axios.post(`${API_URL}/organization/todos`, newTodo, { headers });
      logger.info('✅ Todo criado com sucesso!');
      logger.info(`ID: ${createResponse.data.id}`);
      logger.info(`Título: ${createResponse.data.title}`);
    } catch (error) {
      if (error.response) {
        logger.error('❌ Erro ao criar todo:');
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Mensagem: ${error.response.data.message || error.response.data.error}`);
      } else {
        throw error;
      }
    }

    logger.info('\n✅ Testes concluídos!');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      logger.error('Detalhes:', error.response.data);
    }
    process.exit(1);
  }
}

testTodosV2Endpoint();
