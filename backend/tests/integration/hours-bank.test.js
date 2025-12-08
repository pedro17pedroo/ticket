/**
 * Testes de Integração - Hours Bank (Bolsa de Horas)
 * Testa as rotas da API de gestão de bolsas de horas
 */

import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { Organization, User, Client, HoursBank, HoursTransaction, Ticket } from '../../src/modules/models/index.js';

describe('Hours Bank API Integration Tests', () => {
  let testOrg;
  let adminUser;
  let adminToken;
  let testClient;
  let testHoursBank;
  let testTicket;

  before(async () => {
    await sequelize.sync({ force: true });

    // Criar organização
    testOrg = await Organization.create({
      name: 'Test Organization',
      slug: 'test-org',
      email: 'org@test.com',
      phone: '1234567890',
      isActive: true
    });

    // Criar usuário admin
    adminUser = await User.create({
      organizationId: testOrg.id,
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'provider-admin',
      isActive: true
    });

    // Criar cliente
    testClient = await Client.create({
      organizationId: testOrg.id,
      name: 'Test Client Company',
      tradeName: 'Test Client',
      email: 'client@test.com',
      phone: '9876543210',
      isActive: true
    });

    // Criar ticket concluído para testes de consumo
    testTicket = await Ticket.create({
      organizationId: testOrg.id,
      ticketNumber: 'TKT-001',
      subject: 'Test Ticket',
      description: 'Test ticket for hours consumption',
      status: 'concluido',
      priority: 'media',
      requesterId: adminUser.id
    });

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    adminToken = loginRes.body.token;
  });

  after(async () => {
    await sequelize.close();
  });

  describe('POST /api/hours-banks', () => {
    it('deve criar nova bolsa de horas', async () => {
      const res = await request(app)
        .post('/api/hours-banks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClient.id,
          totalHours: 100,
          packageType: 'Pacote Premium 100h',
          notes: 'Pacote inicial'
        });

      expect(res.status).to.equal(201);
      expect(res.body.hoursBank).to.exist;
      expect(res.body.hoursBank.totalHours).to.equal('100.00');
      expect(res.body.hoursBank.usedHours).to.equal('0.00');
      expect(res.body.hoursBank.packageType).to.equal('Pacote Premium 100h');
      expect(res.body.hoursBank.clientId).to.equal(testClient.id);

      testHoursBank = res.body.hoursBank;

      // Verificar se transação inicial foi criada
      const transaction = await HoursTransaction.findOne({
        where: { hoursBankId: testHoursBank.id }
      });
      expect(transaction).to.exist;
      expect(transaction.type).to.equal('adicao');
      expect(transaction.hours).to.equal('100.00');
    });

    it('deve criar bolsa com datas de validade', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      const res = await request(app)
        .post('/api/hours-banks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClient.id,
          totalHours: 50,
          packageType: 'Pacote Básico 50h',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      expect(res.status).to.equal(201);
      expect(res.body.hoursBank.startDate).to.exist;
      expect(res.body.hoursBank.endDate).to.exist;
    });

    it('deve criar bolsa com saldo negativo permitido', async () => {
      const res = await request(app)
        .post('/api/hours-banks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClient.id,
          totalHours: 20,
          allowNegativeBalance: true,
          minBalance: -10
        });

      expect(res.status).to.equal(201);
      expect(res.body.hoursBank.allowNegativeBalance).to.be.true;
      expect(res.body.hoursBank.minBalance).to.equal('-10.00');
    });

    it('deve rejeitar criação com cliente inexistente', async () => {
      const res = await request(app)
        .post('/api/hours-banks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: '00000000-0000-0000-0000-000000000000',
          totalHours: 100
        });

      expect(res.status).to.equal(404);
    });

    it('deve rejeitar minBalance positivo com saldo negativo permitido', async () => {
      const res = await request(app)
        .post('/api/hours-banks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClient.id,
          totalHours: 50,
          allowNegativeBalance: true,
          minBalance: 10
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('negativo');
    });

    it('deve rejeitar criação sem autenticação', async () => {
      const res = await request(app)
        .post('/api/hours-banks')
        .send({
          clientId: testClient.id,
          totalHours: 100
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/hours-banks', () => {
    it('deve listar todas as bolsas de horas', async () => {
      const res = await request(app)
        .get('/api/hours-banks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.hoursBanks).to.be.an('array');
      expect(res.body.hoursBanks.length).to.be.at.least(3);
      expect(res.body.pagination).to.exist;
    });

    it('deve filtrar bolsas por cliente', async () => {
      const res = await request(app)
        .get(`/api/hours-banks?clientId=${testClient.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      res.body.hoursBanks.forEach(bank => {
        expect(bank.clientId).to.equal(testClient.id);
      });
    });

    it('deve filtrar bolsas ativas', async () => {
      const res = await request(app)
        .get('/api/hours-banks?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      res.body.hoursBanks.forEach(bank => {
        expect(bank.isActive).to.be.true;
      });
    });

    it('deve incluir informações do cliente', async () => {
      const res = await request(app)
        .get('/api/hours-banks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      const bank = res.body.hoursBanks[0];
      expect(bank.client).to.exist;
      expect(bank.client.name).to.exist;
    });

    it('deve suportar paginação', async () => {
      const res = await request(app)
        .get('/api/hours-banks?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.hoursBanks.length).to.be.at.most(2);
      expect(res.body.pagination.page).to.equal(1);
    });
  });

  describe('GET /api/hours-banks/:id', () => {
    it('deve obter bolsa de horas por ID', async () => {
      const res = await request(app)
        .get(`/api/hours-banks/${testHoursBank.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.hoursBank).to.exist;
      expect(res.body.hoursBank.id).to.equal(testHoursBank.id);
      expect(res.body.transactions).to.be.an('array');
    });

    it('deve incluir transações da bolsa', async () => {
      const res = await request(app)
        .get(`/api/hours-banks/${testHoursBank.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.transactions).to.be.an('array');
      expect(res.body.transactions.length).to.be.at.least(1);
    });

    it('deve rejeitar ID inexistente', async () => {
      const res = await request(app)
        .get('/api/hours-banks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /api/hours-banks/:id', () => {
    it('deve atualizar bolsa de horas', async () => {
      const res = await request(app)
        .put(`/api/hours-banks/${testHoursBank.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          packageType: 'Pacote Premium 100h - Atualizado',
          notes: 'Notas atualizadas'
        });

      expect(res.status).to.equal(200);
      expect(res.body.hoursBank.packageType).to.equal('Pacote Premium 100h - Atualizado');
      expect(res.body.hoursBank.notes).to.equal('Notas atualizadas');
    });

    it('deve desativar bolsa de horas', async () => {
      const bank = await HoursBank.create({
        organizationId: testOrg.id,
        clientId: testClient.id,
        totalHours: 10
      });

      const res = await request(app)
        .put(`/api/hours-banks/${bank.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false
        });

      expect(res.status).to.equal(200);
      expect(res.body.hoursBank.isActive).to.be.false;
    });

    it('deve rejeitar atualização de bolsa inexistente', async () => {
      const res = await request(app)
        .put('/api/hours-banks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Test'
        });

      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/hours-banks/:id/add', () => {
    it('deve adicionar horas à bolsa', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/add`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 50,
          description: 'Recarga de 50 horas'
        });

      expect(res.status).to.equal(200);
      expect(res.body.hoursBank.totalHours).to.equal('150.00');

      // Verificar transação
      const transaction = await HoursTransaction.findOne({
        where: {
          hoursBankId: testHoursBank.id,
          type: 'adicao',
          hours: 50
        }
      });
      expect(transaction).to.exist;
    });

    it('deve rejeitar adição de horas inválidas', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/add`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: -10
        });

      expect(res.status).to.equal(400);
    });

    it('deve rejeitar adição de zero horas', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/add`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 0
        });

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /api/hours-banks/:id/consume', () => {
    it('deve consumir horas da bolsa', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 10,
          ticketId: testTicket.id,
          description: 'Consumo de 10 horas'
        });

      expect(res.status).to.equal(200);
      expect(res.body.hoursBank.usedHours).to.equal('10.00');
      expect(res.body.availableHours).to.equal(140);

      // Verificar transação
      const transaction = await HoursTransaction.findOne({
        where: {
          hoursBankId: testHoursBank.id,
          type: 'consumo',
          ticketId: testTicket.id
        }
      });
      expect(transaction).to.exist;
    });

    it('deve rejeitar consumo sem ticket', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 5
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('obrigatório');
    });

    it('deve rejeitar consumo com ticket não concluído', async () => {
      const openTicket = await Ticket.create({
        organizationId: testOrg.id,
        ticketNumber: 'TKT-002',
        subject: 'Open Ticket',
        description: 'Test',
        status: 'aberto',
        priority: 'media',
        requesterId: adminUser.id
      });

      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 5,
          ticketId: openTicket.id
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Concluído');
    });

    it('deve rejeitar consumo maior que saldo disponível', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 200,
          ticketId: testTicket.id
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('insuficiente');
    });

    it('deve permitir saldo negativo se configurado', async () => {
      const negativeBank = await HoursBank.create({
        organizationId: testOrg.id,
        clientId: testClient.id,
        totalHours: 10,
        allowNegativeBalance: true,
        minBalance: -20
      });

      const ticket2 = await Ticket.create({
        organizationId: testOrg.id,
        ticketNumber: 'TKT-003',
        subject: 'Test',
        description: 'Test',
        status: 'concluido',
        priority: 'media',
        requesterId: adminUser.id
      });

      const res = await request(app)
        .post(`/api/hours-banks/${negativeBank.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 15,
          ticketId: ticket2.id
        });

      expect(res.status).to.equal(200);
      expect(parseFloat(res.body.hoursBank.usedHours)).to.equal(15);
    });

    it('deve rejeitar consumo abaixo do saldo mínimo', async () => {
      const limitedBank = await HoursBank.create({
        organizationId: testOrg.id,
        clientId: testClient.id,
        totalHours: 10,
        allowNegativeBalance: true,
        minBalance: -5
      });

      const ticket3 = await Ticket.create({
        organizationId: testOrg.id,
        ticketNumber: 'TKT-004',
        subject: 'Test',
        description: 'Test',
        status: 'concluido',
        priority: 'media',
        requesterId: adminUser.id
      });

      const res = await request(app)
        .post(`/api/hours-banks/${limitedBank.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 20,
          ticketId: ticket3.id
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('mínimo');
    });
  });

  describe('POST /api/hours-banks/:id/adjust', () => {
    it('deve ajustar horas positivamente', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 25,
          description: 'Ajuste de correção +25h'
        });

      expect(res.status).to.equal(200);
      expect(res.body.hoursBank.totalHours).to.equal('175.00');

      // Verificar transação
      const transaction = await HoursTransaction.findOne({
        where: {
          hoursBankId: testHoursBank.id,
          type: 'ajuste',
          hours: 25
        }
      });
      expect(transaction).to.exist;
    });

    it('deve ajustar horas negativamente', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: -5,
          description: 'Ajuste de correção -5h'
        });

      expect(res.status).to.equal(200);
      expect(res.body.hoursBank.usedHours).to.equal('5.00');
    });

    it('deve rejeitar ajuste de zero horas', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 0
        });

      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/hours-transactions', () => {
    it('deve listar todas as transações', async () => {
      const res = await request(app)
        .get('/api/hours-transactions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.transactions).to.be.an('array');
      expect(res.body.pagination).to.exist;
    });

    it('deve filtrar transações por bolsa', async () => {
      const res = await request(app)
        .get(`/api/hours-transactions?hoursBankId=${testHoursBank.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      res.body.transactions.forEach(transaction => {
        expect(transaction.hoursBankId).to.equal(testHoursBank.id);
      });
    });

    it('deve filtrar transações por tipo', async () => {
      const res = await request(app)
        .get('/api/hours-transactions?type=consumo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      res.body.transactions.forEach(transaction => {
        expect(transaction.type).to.equal('consumo');
      });
    });

    it('deve filtrar transações por data', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const res = await request(app)
        .get(`/api/hours-transactions?startDate=${startDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.transactions).to.be.an('array');
    });

    it('deve incluir informações relacionadas', async () => {
      const res = await request(app)
        .get('/api/hours-transactions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      const transaction = res.body.transactions[0];
      expect(transaction.hoursBank).to.exist;
      expect(transaction.hoursBank.client).to.exist;
    });
  });

  describe('GET /api/hours-banks/statistics', () => {
    it('deve retornar estatísticas gerais', async () => {
      const res = await request(app)
        .get('/api/hours-banks/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.banks).to.be.an('array');
      expect(res.body.transactionsByType).to.be.an('array');
    });

    it('deve filtrar estatísticas por cliente', async () => {
      const res = await request(app)
        .get(`/api/hours-banks/statistics?clientId=${testClient.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.banks).to.be.an('array');
    });

    it('deve filtrar estatísticas por período', async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const res = await request(app)
        .get(`/api/hours-banks/statistics?startDate=${startDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.transactionsByType).to.be.an('array');
    });
  });

  describe('GET /api/hours-banks/tickets/completed', () => {
    it('deve listar tickets concluídos', async () => {
      const res = await request(app)
        .get('/api/hours-banks/tickets/completed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.tickets).to.be.an('array');
      res.body.tickets.forEach(ticket => {
        expect(ticket.status).to.equal('concluido');
      });
    });

    it('deve filtrar tickets por cliente', async () => {
      const res = await request(app)
        .get(`/api/hours-banks/tickets/completed?clientId=${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.tickets).to.be.an('array');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    let org2;
    let org2User;
    let org2Token;
    let org2Client;
    let org2Bank;

    before(async () => {
      // Criar segunda organização
      org2 = await Organization.create({
        name: 'Organization 2',
        slug: 'org-2',
        email: 'org2@test.com',
        phone: '9999999999'
      });

      org2User = await User.create({
        organizationId: org2.id,
        name: 'Org2 Admin',
        email: 'admin@org2.com',
        password: 'password123',
        role: 'provider-admin'
      });

      org2Client = await Client.create({
        organizationId: org2.id,
        name: 'Org2 Client',
        tradeName: 'Org2 Client',
        email: 'client@org2.com',
        phone: '1111111111'
      });

      org2Bank = await HoursBank.create({
        organizationId: org2.id,
        clientId: org2Client.id,
        totalHours: 50
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@org2.com',
          password: 'password123'
        });

      org2Token = loginRes.body.token;
    });

    it('deve isolar bolsas por organização', async () => {
      const res = await request(app)
        .get('/api/hours-banks')
        .set('Authorization', `Bearer ${org2Token}`);

      expect(res.status).to.equal(200);
      res.body.hoursBanks.forEach(bank => {
        expect(bank.organizationId).to.equal(org2.id);
      });
    });

    it('deve impedir acesso a bolsa de outra organização', async () => {
      const res = await request(app)
        .get(`/api/hours-banks/${testHoursBank.id}`)
        .set('Authorization', `Bearer ${org2Token}`);

      expect(res.status).to.equal(404);
    });

    it('deve impedir consumo de horas de outra organização', async () => {
      const res = await request(app)
        .post(`/api/hours-banks/${testHoursBank.id}/consume`)
        .set('Authorization', `Bearer ${org2Token}`)
        .send({
          hours: 5,
          ticketId: testTicket.id
        });

      expect(res.status).to.equal(404);
    });
  });

  describe('Validações de Negócio', () => {
    it('deve calcular availableHours corretamente', async () => {
      const bank = await HoursBank.create({
        organizationId: testOrg.id,
        clientId: testClient.id,
        totalHours: 100,
        usedHours: 30
      });

      const res = await request(app)
        .get(`/api/hours-banks/${bank.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      const available = parseFloat(res.body.hoursBank.totalHours) - parseFloat(res.body.hoursBank.usedHours);
      expect(available).to.equal(70);
    });

    it('deve manter histórico completo de transações', async () => {
      const bank = await HoursBank.create({
        organizationId: testOrg.id,
        clientId: testClient.id,
        totalHours: 50
      });

      // Adicionar horas
      await request(app)
        .post(`/api/hours-banks/${bank.id}/add`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hours: 25 });

      // Consumir horas
      const ticket = await Ticket.create({
        organizationId: testOrg.id,
        ticketNumber: 'TKT-HIST',
        subject: 'Test',
        description: 'Test',
        status: 'concluido',
        priority: 'media',
        requesterId: adminUser.id
      });

      await request(app)
        .post(`/api/hours-banks/${bank.id}/consume`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hours: 10, ticketId: ticket.id });

      // Ajustar horas
      await request(app)
        .post(`/api/hours-banks/${bank.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hours: 5 });

      // Verificar histórico
      const transactions = await HoursTransaction.findAll({
        where: { hoursBankId: bank.id }
      });

      expect(transactions.length).to.be.at.least(4); // inicial + add + consume + adjust
    });
  });
});
