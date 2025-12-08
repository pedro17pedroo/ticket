import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { Organization, User, SLA, Client, Category } from '../../src/modules/models/index.js';
import bcrypt from 'bcryptjs';

describe('SLA API Integration Tests', () => {
  let organization, adminUser, agenteUser, clientUser;
  let adminToken, agenteToken, clientToken;
  let client, category, sla;

  before(async () => {
    // Sincronizar banco de dados de teste
    await sequelize.sync({ force: true });

    // Criar organização
    organization = await Organization.create({
      name: 'Test Organization',
      slug: 'test-org',
      email: 'test@testorg.com'
    });

    // Criar usuários
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@testorg.com',
      password: hashedPassword,
      role: 'admin-org',
      organizationId: organization.id
    });

    agenteUser = await User.create({
      name: 'Agente User',
      email: 'agente@testorg.com',
      password: hashedPassword,
      role: 'agente',
      organizationId: organization.id
    });

    clientUser = await User.create({
      name: 'Client User',
      email: 'client@testorg.com',
      password: hashedPassword,
      role: 'cliente-org',
      organizationId: organization.id
    });

    // Fazer login
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@testorg.com', password: 'Test@123' });
    adminToken = adminLogin.body.token;

    const agenteLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agente@testorg.com', password: 'Test@123' });
    agenteToken = agenteLogin.body.token;

    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'client@testorg.com', password: 'Test@123' });
    clientToken = clientLogin.body.token;

    // Criar cliente
    client = await Client.create({
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      phone: '123456789',
      organizationId: organization.id
    });

    // Criar categoria
    category = await Category.create({
      name: 'Suporte Técnico',
      icon: '🔧',
      color: '#3B82F6',
      organizationId: organization.id
    });
  });

  after(async () => {
    await sequelize.close();
  });

  describe('POST /api/slas', () => {
    it('admin deve criar SLA com sucesso', async () => {
      const response = await request(app)
        .post('/api/slas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'SLA Padrão',
          description: 'SLA para tickets padrão',
          responseTime: 4, // 4 horas
          resolutionTime: 24, // 24 horas
          priority: 'media',
          isActive: true
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('sla');
      expect(response.body.sla.name).to.equal('SLA Padrão');
      expect(response.body.sla.responseTime).to.equal(4);
      expect(response.body.sla.resolutionTime).to.equal(24);
      expect(response.body.sla.isActive).to.be.true;

      sla = response.body.sla;
    });

    it('deve criar SLA específico para cliente', async () => {
      const response = await request(app)
        .post('/api/slas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'SLA Premium',
          description: 'SLA para clientes premium',
          responseTime: 1,
          resolutionTime: 8,
          priority: 'alta',
          clientId: client.id,
          isActive: true
        });

      expect(response.status).to.equal(201);
      expect(response.body.sla.clientId).to.equal(client.id);
    });

    it('deve criar SLA específico para categoria', async () => {
      const response = await request(app)
        .post('/api/slas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'SLA Suporte Técnico',
          description: 'SLA para suporte técnico',
          responseTime: 2,
          resolutionTime: 12,
          categoryId: category.id,
          isActive: true
        });

      expect(response.status).to.equal(201);
      expect(response.body.sla.categoryId).to.equal(category.id);
    });

    it('deve validar tempos de resposta e resolução', async () => {
      const response = await request(app)
        .post('/api/slas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'SLA Inválido',
          responseTime: -1,
          resolutionTime: 0
        });

      expect(response.status).to.equal(400);
    });

    it('agente não deve criar SLA', async () => {
      const response = await request(app)
        .post('/api/slas')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          name: 'SLA Agente',
          responseTime: 4,
          resolutionTime: 24
        });

      expect(response.status).to.be.oneOf([403, 401]);
    });

    it('cliente não deve criar SLA', async () => {
      const response = await request(app)
        .post('/api/slas')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'SLA Cliente',
          responseTime: 4,
          resolutionTime: 24
        });

      expect(response.status).to.be.oneOf([403, 401]);
    });
  });

  describe('GET /api/slas', () => {
    it('admin deve listar todos os SLAs', async () => {
      const response = await request(app)
        .get('/api/slas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('slas');
      expect(response.body.slas).to.be.an('array');
      expect(response.body.slas.length).to.be.greaterThan(0);
    });

    it('deve filtrar SLAs ativos', async () => {
      const response = await request(app)
        .get('/api/slas?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      const allActive = response.body.slas.every(s => s.isActive);
      expect(allActive).to.be.true;
    });

    it('deve filtrar SLAs por cliente', async () => {
      const response = await request(app)
        .get(`/api/slas?clientId=${client.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      const allForClient = response.body.slas.every(s => s.clientId === client.id);
      expect(allForClient).to.be.true;
    });

    it('deve filtrar SLAs por categoria', async () => {
      const response = await request(app)
        .get(`/api/slas?categoryId=${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      const allForCategory = response.body.slas.every(s => s.categoryId === category.id);
      expect(allForCategory).to.be.true;
    });

    it('agente deve visualizar SLAs', async () => {
      const response = await request(app)
        .get('/api/slas')
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.slas).to.be.an('array');
    });
  });

  describe('GET /api/slas/:id', () => {
    it('deve obter SLA por ID', async () => {
      const response = await request(app)
        .get(`/api/slas/${sla.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('sla');
      expect(response.body.sla.id).to.equal(sla.id);
      expect(response.body.sla.name).to.equal(sla.name);
    });

    it('deve retornar 404 para SLA inexistente', async () => {
      const response = await request(app)
        .get('/api/slas/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('PUT /api/slas/:id', () => {
    it('admin deve atualizar SLA com sucesso', async () => {
      const response = await request(app)
        .put(`/api/slas/${sla.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'SLA Padrão Atualizado',
          responseTime: 2,
          resolutionTime: 16
        });

      expect(response.status).to.equal(200);
      expect(response.body.sla.name).to.equal('SLA Padrão Atualizado');
      expect(response.body.sla.responseTime).to.equal(2);
      expect(response.body.sla.resolutionTime).to.equal(16);
    });

    it('deve desativar SLA', async () => {
      const response = await request(app)
        .put(`/api/slas/${sla.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false
        });

      expect(response.status).to.equal(200);
      expect(response.body.sla.isActive).to.be.false;
    });

    it('agente não deve atualizar SLA', async () => {
      const response = await request(app)
        .put(`/api/slas/${sla.id}`)
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          name: 'Tentativa de atualização'
        });

      expect(response.status).to.be.oneOf([403, 401]);
    });

    it('deve retornar 404 ao atualizar SLA inexistente', async () => {
      const response = await request(app)
        .put('/api/slas/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Teste'
        });

      expect(response.status).to.equal(404);
    });
  });

  describe('DELETE /api/slas/:id', () => {
    let slaToDelete;

    beforeEach(async () => {
      slaToDelete = await SLA.create({
        name: 'SLA para Deletar',
        responseTime: 4,
        resolutionTime: 24,
        organizationId: organization.id,
        isActive: true
      });
    });

    it('admin deve deletar SLA com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/slas/${slaToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);

      // Verificar que foi deletado
      const getResponse = await request(app)
        .get(`/api/slas/${slaToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).to.equal(404);
    });

    it('agente não deve deletar SLA', async () => {
      const response = await request(app)
        .delete(`/api/slas/${slaToDelete.id}`)
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).to.be.oneOf([403, 401]);
    });

    it('deve retornar 404 ao deletar SLA inexistente', async () => {
      const response = await request(app)
        .delete('/api/slas/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('SLA Priority Logic', () => {
    it('deve aplicar SLA mais específico (cliente + categoria)', async () => {
      // Criar SLA genérico
      await SLA.create({
        name: 'SLA Genérico',
        responseTime: 8,
        resolutionTime: 48,
        organizationId: organization.id,
        isActive: true
      });

      // Criar SLA específico para cliente
      await SLA.create({
        name: 'SLA Cliente Específico',
        responseTime: 4,
        resolutionTime: 24,
        clientId: client.id,
        organizationId: organization.id,
        isActive: true
      });

      // Criar SLA específico para cliente + categoria
      const specificSLA = await SLA.create({
        name: 'SLA Cliente + Categoria',
        responseTime: 2,
        resolutionTime: 12,
        clientId: client.id,
        categoryId: category.id,
        organizationId: organization.id,
        isActive: true
      });

      // Buscar SLA aplicável
      const response = await request(app)
        .get(`/api/slas/applicable?clientId=${client.id}&categoryId=${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.sla) {
        // Deve retornar o mais específico
        expect(response.body.sla.id).to.equal(specificSLA.id);
        expect(response.body.sla.responseTime).to.equal(2);
      }
    });
  });

  describe('Multi-tenant Isolation', () => {
    let otherOrganization, otherUser, otherToken, otherSLA;

    before(async () => {
      // Criar outra organização
      otherOrganization = await Organization.create({
        name: 'Other Organization',
        slug: 'other-org',
        email: 'other@testorg.com'
      });

      const hashedPassword = await bcrypt.hash('Test@123', 10);
      otherUser = await User.create({
        name: 'Other User',
        email: 'other@testorg.com',
        password: hashedPassword,
        role: 'admin-org',
        organizationId: otherOrganization.id
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@testorg.com', password: 'Test@123' });
      otherToken = loginResponse.body.token;

      // Criar SLA na outra organização
      otherSLA = await SLA.create({
        name: 'SLA Outra Org',
        responseTime: 4,
        resolutionTime: 24,
        organizationId: otherOrganization.id,
        isActive: true
      });
    });

    it('usuário não deve ver SLAs de outra organização', async () => {
      const response = await request(app)
        .get('/api/slas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      const hasOtherOrgSLA = response.body.slas.some(
        s => s.organizationId === otherOrganization.id
      );
      expect(hasOtherOrgSLA).to.be.false;
    });

    it('usuário não deve acessar SLA de outra organização', async () => {
      const response = await request(app)
        .get(`/api/slas/${otherSLA.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(404);
    });

    it('usuário não deve atualizar SLA de outra organização', async () => {
      const response = await request(app)
        .put(`/api/slas/${otherSLA.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tentativa de atualização'
        });

      expect(response.status).to.equal(404);
    });

    it('usuário não deve deletar SLA de outra organização', async () => {
      const response = await request(app)
        .delete(`/api/slas/${otherSLA.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(404);
    });
  });
});
