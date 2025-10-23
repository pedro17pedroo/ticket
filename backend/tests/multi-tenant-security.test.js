/**
 * Testes de Segurança Multi-Tenant
 * Valida isolamento completo entre organizações
 */

import request from 'supertest';
import app from '../src/server.js';
import { User, Organization, Ticket, Category } from '../src/modules/models/index.js';

describe('Multi-Tenant Security Tests', () => {
  let orgA, orgB;
  let userOrgA, userOrgB;
  let tokenOrgA, tokenOrgB;
  let ticketOrgA, ticketOrgB;

  beforeAll(async () => {
    // Criar 2 organizações
    orgA = await Organization.create({
      name: 'Organização A',
      slug: 'org-a-test',
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00'
    });

    orgB = await Organization.create({
      name: 'Organização B',
      slug: 'org-b-test',
      primaryColor: '#0000FF',
      secondaryColor: '#FFFF00'
    });

    // Criar usuários em cada organização
    userOrgA = await User.create({
      name: 'User Org A',
      email: 'user@orga.com',
      password: 'password123',
      organizationId: orgA.id,
      role: 'admin-org'
    });

    userOrgB = await User.create({
      name: 'User Org B',
      email: 'user@orgb.com',
      password: 'password123',
      organizationId: orgB.id,
      role: 'admin-org'
    });

    // Login para obter tokens
    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@orga.com', password: 'password123' });
    tokenOrgA = loginA.body.token;

    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@orgb.com', password: 'password123' });
    tokenOrgB = loginB.body.token;

    // Criar tickets em cada organização
    ticketOrgA = await Ticket.create({
      organizationId: orgA.id,
      requesterId: userOrgA.id,
      subject: 'Ticket Org A',
      description: 'Descrição ticket org A',
      priority: 'media',
      type: 'suporte',
      status: 'novo'
    });

    ticketOrgB = await Ticket.create({
      organizationId: orgB.id,
      requesterId: userOrgB.id,
      subject: 'Ticket Org B',
      description: 'Descrição ticket org B',
      priority: 'alta',
      type: 'problema',
      status: 'novo'
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Ticket.destroy({ where: { organizationId: [orgA.id, orgB.id] } });
    await User.destroy({ where: { organizationId: [orgA.id, orgB.id] } });
    await Organization.destroy({ where: { id: [orgA.id, orgB.id] } });
  });

  describe('Isolamento de Tickets', () => {
    test('Usuário Org A NÃO pode acessar ticket Org B', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticketOrgB.id}`)
        .set('Authorization', `Bearer ${tokenOrgA}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    test('Usuário Org B NÃO pode acessar ticket Org A', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticketOrgA.id}`)
        .set('Authorization', `Bearer ${tokenOrgB}`);

      expect(response.status).toBe(404);
    });

    test('Usuário Org A pode acessar próprio ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticketOrgA.id}`)
        .set('Authorization', `Bearer ${tokenOrgA}`);

      expect(response.status).toBe(200);
      expect(response.body.ticket.id).toBe(ticketOrgA.id);
    });

    test('Listagem retorna apenas tickets da própria organização', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tokenOrgA}`);

      expect(response.status).toBe(200);
      expect(response.body.tickets).toBeDefined();
      
      // Todos tickets devem ser da Org A
      response.body.tickets.forEach(ticket => {
        expect(ticket.organizationId).toBe(orgA.id);
      });
    });
  });

  describe('Isolamento de Categorias', () => {
    let categoryOrgA;

    beforeAll(async () => {
      categoryOrgA = await Category.create({
        organizationId: orgA.id,
        name: 'Categoria Org A',
        description: 'Descrição'
      });
    });

    test('Usuário Org B NÃO pode acessar categoria Org A', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryOrgA.id}`)
        .set('Authorization', `Bearer ${tokenOrgB}`);

      expect(response.status).toBe(404);
    });

    test('Usuário Org B NÃO pode deletar categoria Org A', async () => {
      const response = await request(app)
        .delete(`/api/categories/${categoryOrgA.id}`)
        .set('Authorization', `Bearer ${tokenOrgB}`);

      expect(response.status).toBe(404);
      
      // Verificar que categoria ainda existe
      const category = await Category.findByPk(categoryOrgA.id);
      expect(category).not.toBeNull();
    });

    test('Criação ignora organizationId forçado no body', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${tokenOrgA}`)
        .send({
          name: 'Categoria Teste',
          description: 'Teste',
          organizationId: orgB.id  // Tentando forçar Org B
        });

      expect(response.status).toBe(201);
      expect(response.body.category.organizationId).toBe(orgA.id);  // Deve ser Org A
      
      // Limpar
      await Category.destroy({ where: { id: response.body.category.id } });
    });
  });

  describe('Registro de Usuários', () => {
    test('Permite mesmo email em organizações diferentes', async () => {
      const email = 'same@email.com';

      // Registrar na Org A
      const responseA = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User Same Email A',
          email: email,
          password: 'password123',
          organizationId: orgA.id
        });

      expect(responseA.status).toBe(201);

      // Registrar MESMO email na Org B
      const responseB = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User Same Email B',
          email: email,
          password: 'password123',
          organizationId: orgB.id
        });

      expect(responseB.status).toBe(201);

      // Verificar que são usuários diferentes
      expect(responseA.body.user.id).not.toBe(responseB.body.user.id);
      expect(responseA.body.user.organizationId).toBe(orgA.id);
      expect(responseB.body.user.organizationId).toBe(orgB.id);

      // Limpar
      await User.destroy({ where: { email: email } });
    });

    test('NÃO permite email duplicado na mesma organização', async () => {
      const email = 'duplicate@orga.com';

      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User 1',
          email: email,
          password: 'password123',
          organizationId: orgA.id
        });

      // Segundo registro (deve falhar)
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User 2',
          email: email,
          password: 'password123',
          organizationId: orgA.id
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('já cadastrado');

      // Limpar
      await User.destroy({ where: { email: email } });
    });
  });

  describe('Comentários em Tickets', () => {
    test('Comentário criado pertence à organização do ticket', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticketOrgA.id}/comments`)
        .set('Authorization', `Bearer ${tokenOrgA}`)
        .send({
          content: 'Comentário de teste',
          isPrivate: false
        });

      expect(response.status).toBe(201);
      expect(response.body.comment.organizationId).toBe(orgA.id);
    });

    test('NÃO pode comentar em ticket de outra organização', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticketOrgB.id}/comments`)
        .set('Authorization', `Bearer ${tokenOrgA}`)
        .send({
          content: 'Tentando comentar',
          isPrivate: false
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Estatísticas e Agregações', () => {
    test('Estatísticas mostram apenas dados da própria organização', async () => {
      const response = await request(app)
        .get('/api/tickets/statistics')
        .set('Authorization', `Bearer ${tokenOrgA}`);

      expect(response.status).toBe(200);
      
      // Verificar que não há contaminação de dados da Org B
      // (implementar validações específicas conforme estrutura da resposta)
    });
  });
});
