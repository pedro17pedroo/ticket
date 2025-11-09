/**
 * Testes End-to-End - Fluxo Completo de Tickets
 * Testa cenários completos de uso do sistema de tickets
 */

import request from 'supertest';
import { expect } from 'chai';
import app from '../../src/app.js';
import { 
  User, 
  Organization, 
  Ticket, 
  Category, 
  Priority,
  TicketHistory 
} from '../../src/modules/models/index.js';
import bcrypt from 'bcryptjs';

describe('E2E - Fluxo Completo de Tickets', () => {
  let organization, adminUser, regularUser, category, priority;
  let adminToken, userToken;

  before(async () => {
    // Criar organização
    organization = await Organization.create({
      name: 'Organização E2E Tickets',
      slug: 'org-e2e-tickets',
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00'
    });

    // Criar usuários
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    adminUser = await User.create({
      name: 'Admin E2E',
      email: 'admin.e2e@empresa.com',
      password: hashedPassword,
      role: 'admin-org',
      organizationId: organization.id
    });

    regularUser = await User.create({
      name: 'Usuário E2E',
      email: 'user.e2e@empresa.com',
      password: hashedPassword,
      role: 'cliente-org',
      organizationId: organization.id
    });

    // Criar categoria e prioridade
    category = await Category.create({
      name: 'Suporte Técnico',
      description: 'Categoria para testes E2E',
      organizationId: organization.id
    });

    priority = await Priority.create({
      name: 'Alta',
      level: 3,
      color: '#FF0000',
      organizationId: organization.id
    });

    // Fazer login dos usuários
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.e2e@empresa.com',
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user.e2e@empresa.com',
        password: 'password123'
      });
    userToken = userLogin.body.token;
  });

  after(async () => {
    // Limpar dados de teste
    await TicketHistory.destroy({ where: {} });
    await Ticket.destroy({ where: { organizationId: organization.id } });
    await Category.destroy({ where: { organizationId: organization.id } });
    await Priority.destroy({ where: { organizationId: organization.id } });
    await User.destroy({ where: { organizationId: organization.id } });
    await Organization.destroy({ where: { id: organization.id } });
  });

  describe('Fluxo Completo: Criação → Atribuição → Resolução → Fechamento', () => {
    let ticketId;

    it('1. Usuário cria um ticket', async () => {
      const ticketData = {
        title: 'Problema com sistema E2E',
        description: 'Descrição detalhada do problema para teste E2E',
        categoryId: category.id,
        priorityId: priority.id
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ticketData)
        .expect(201);

      expect(response.body).to.have.property('id');
      expect(response.body.title).to.equal(ticketData.title);
      expect(response.body.status).to.equal('open');
      expect(response.body.requesterId).to.equal(regularUser.id);
      
      ticketId = response.body.id;

      // Verificar se foi criado no banco
      const createdTicket = await Ticket.findByPk(ticketId);
      expect(createdTicket).to.not.be.null;
      expect(createdTicket.organizationId).to.equal(organization.id);
    });

    it('2. Admin visualiza o ticket na lista', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.tickets).to.be.an('array');
      expect(response.body.tickets.length).to.be.greaterThan(0);
      
      const ticket = response.body.tickets.find(t => t.id === ticketId);
      expect(ticket).to.not.be.undefined;
      expect(ticket.title).to.equal('Problema com sistema E2E');
      expect(ticket.status).to.equal('open');
    });

    it('3. Admin atribui o ticket para si mesmo', async () => {
      const updateData = {
        assignedToId: adminUser.id,
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.assignedToId).to.equal(adminUser.id);
      expect(response.body.status).to.equal('in_progress');

      // Verificar se o histórico foi criado
      const history = await TicketHistory.findAll({
        where: { ticketId: ticketId }
      });
      expect(history.length).to.be.greaterThan(0);
    });

    it('4. Admin adiciona comentário ao ticket', async () => {
      const commentData = {
        comment: 'Iniciando análise do problema. Verificando logs do sistema.'
      };

      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(commentData)
        .expect(200);

      // Verificar se o comentário foi adicionado ao histórico
      const history = await TicketHistory.findAll({
        where: { 
          ticketId: ticketId,
          action: 'comment'
        }
      });
      expect(history.length).to.be.greaterThan(0);
      expect(history[0].details).to.include('Iniciando análise');
    });

    it('5. Usuário visualiza atualizações do seu ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).to.equal(ticketId);
      expect(response.body.status).to.equal('in_progress');
      expect(response.body.assignedToId).to.equal(adminUser.id);
      expect(response.body).to.have.property('assignedTo');
      expect(response.body.assignedTo.name).to.equal('Admin E2E');
    });

    it('6. Admin resolve o ticket', async () => {
      const resolveData = {
        status: 'resolved',
        comment: 'Problema identificado e corrigido. Logs do sistema normalizados.'
      };

      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(resolveData)
        .expect(200);

      expect(response.body.status).to.equal('resolved');

      // Verificar histórico de resolução
      const history = await TicketHistory.findAll({
        where: { 
          ticketId: ticketId,
          action: 'status_change'
        }
      });
      expect(history.length).to.be.greaterThan(0);
    });

    it('7. Usuário confirma resolução e fecha o ticket', async () => {
      const closeData = {
        status: 'closed',
        comment: 'Problema resolvido com sucesso. Obrigado pelo suporte!'
      };

      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(closeData)
        .expect(200);

      expect(response.body.status).to.equal('closed');

      // Verificar se o ticket foi fechado
      const closedTicket = await Ticket.findByPk(ticketId);
      expect(closedTicket.status).to.equal('closed');
      expect(closedTicket.closedAt).to.not.be.null;
    });

    it('8. Verificar estatísticas atualizadas', async () => {
      const response = await request(app)
        .get('/api/tickets/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).to.have.property('totalTickets');
      expect(response.body).to.have.property('closedTickets');
      expect(response.body).to.have.property('averageResolutionTime');
      expect(response.body.totalTickets).to.be.greaterThan(0);
      expect(response.body.closedTickets).to.be.greaterThan(0);
    });
  });

  describe('Fluxo de Escalação de Ticket', () => {
    let escalationTicketId;

    it('1. Usuário cria ticket urgente', async () => {
      const urgentTicketData = {
        title: 'Sistema fora do ar - URGENTE',
        description: 'Sistema principal não está respondendo, afetando todos os usuários',
        categoryId: category.id,
        priorityId: priority.id
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(urgentTicketData)
        .expect(201);

      escalationTicketId = response.body.id;
      expect(response.body.title).to.equal(urgentTicketData.title);
    });

    it('2. Admin atribui ticket para outro usuário', async () => {
      const assignData = {
        assignedToId: regularUser.id,
        status: 'in_progress'
      };

      await request(app)
        .put(`/api/tickets/${escalationTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignData)
        .expect(200);
    });

    it('3. Usuário atribuído não consegue resolver e escala', async () => {
      const escalateData = {
        assignedToId: adminUser.id,
        comment: 'Problema mais complexo que esperado. Escalando para admin.'
      };

      const response = await request(app)
        .put(`/api/tickets/${escalationTicketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(escalateData)
        .expect(200);

      expect(response.body.assignedToId).to.equal(adminUser.id);

      // Verificar histórico de escalação
      const history = await TicketHistory.findAll({
        where: { 
          ticketId: escalationTicketId,
          action: 'assignment'
        }
      });
      expect(history.length).to.be.greaterThan(0);
    });

    it('4. Admin resolve ticket escalado', async () => {
      const resolveData = {
        status: 'resolved',
        comment: 'Problema resolvido após análise detalhada da infraestrutura.'
      };

      await request(app)
        .put(`/api/tickets/${escalationTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(resolveData)
        .expect(200);
    });
  });

  describe('Fluxo de Filtros e Busca', () => {
    before(async () => {
      // Criar tickets adicionais para teste de filtros
      const ticketsData = [
        {
          title: 'Bug no sistema de login',
          description: 'Usuários não conseguem fazer login',
          status: 'open',
          categoryId: category.id,
          priorityId: priority.id,
          requesterId: regularUser.id,
          organizationId: organization.id
        },
        {
          title: 'Solicitação de nova funcionalidade',
          description: 'Implementar relatórios avançados',
          status: 'in_progress',
          categoryId: category.id,
          priorityId: priority.id,
          requesterId: regularUser.id,
          assignedToId: adminUser.id,
          organizationId: organization.id
        }
      ];

      await Ticket.bulkCreate(ticketsData);
    });

    it('1. Filtrar tickets por status', async () => {
      const response = await request(app)
        .get('/api/tickets?status=open')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.tickets).to.be.an('array');
      response.body.tickets.forEach(ticket => {
        expect(ticket.status).to.equal('open');
      });
    });

    it('2. Buscar tickets por título', async () => {
      const response = await request(app)
        .get('/api/tickets?search=login')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.tickets).to.be.an('array');
      const foundTicket = response.body.tickets.find(t => 
        t.title.toLowerCase().includes('login')
      );
      expect(foundTicket).to.not.be.undefined;
    });

    it('3. Filtrar tickets atribuídos a usuário específico', async () => {
      const response = await request(app)
        .get(`/api/tickets?assignedTo=${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.tickets).to.be.an('array');
      response.body.tickets.forEach(ticket => {
        if (ticket.assignedToId) {
          expect(ticket.assignedToId).to.equal(adminUser.id);
        }
      });
    });

    it('4. Combinar múltiplos filtros', async () => {
      const response = await request(app)
        .get(`/api/tickets?status=in_progress&assignedTo=${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.tickets).to.be.an('array');
      response.body.tickets.forEach(ticket => {
        expect(ticket.status).to.equal('in_progress');
        expect(ticket.assignedToId).to.equal(adminUser.id);
      });
    });
  });

  describe('Isolamento Multi-tenant', () => {
    let otherOrganization, otherUser, otherToken;

    before(async () => {
      // Criar segunda organização
      otherOrganization = await Organization.create({
        name: 'Outra Organização',
        slug: 'outra-org',
        primaryColor: '#0000FF',
        secondaryColor: '#FFFF00'
      });

      // Criar usuário na segunda organização
      const hashedPassword = await bcrypt.hash('password123', 10);
      otherUser = await User.create({
        name: 'Usuário Outra Org',
        email: 'user.other@empresa.com',
        password: hashedPassword,
        role: 'admin-org',
        organizationId: otherOrganization.id
      });

      // Fazer login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user.other@empresa.com',
          password: 'password123'
        });
      otherToken = loginResponse.body.token;
    });

    after(async () => {
      await User.destroy({ where: { organizationId: otherOrganization.id } });
      await Organization.destroy({ where: { id: otherOrganization.id } });
    });

    it('Usuário não deve ver tickets de outra organização', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.tickets).to.be.an('array');
      
      // Não deve haver tickets da primeira organização
      response.body.tickets.forEach(ticket => {
        expect(ticket.organizationId).to.not.equal(organization.id);
      });
    });

    it('Usuário não deve acessar ticket específico de outra organização', async () => {
      // Tentar acessar um ticket da primeira organização
      const ticketsFromFirstOrg = await Ticket.findOne({
        where: { organizationId: organization.id }
      });

      if (ticketsFromFirstOrg) {
        await request(app)
          .get(`/api/tickets/${ticketsFromFirstOrg.id}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(404); // Deve retornar 404 por isolamento
      }
    });
  });
});