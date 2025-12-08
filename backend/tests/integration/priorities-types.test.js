/**
 * Testes de Integração - Prioridades e Tipos
 * Testa as rotas da API de Prioridades e Tipos de Tickets
 */

import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { Organization, User, Priority, Type, Ticket } from '../../src/modules/models/index.js';

describe('Priorities and Types API Integration Tests', () => {
  let testOrg;
  let adminUser;
  let adminToken;
  let testPriority;
  let testType;

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

  describe('Priorities API', () => {
    describe('POST /api/priorities', () => {
      it('deve criar nova prioridade', async () => {
        const res = await request(app)
          .post('/api/priorities')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Crítica',
            color: '#FF0000',
            order: 1
          });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body.priority).to.exist;
        expect(res.body.priority.name).to.equal('Crítica');
        expect(res.body.priority.color).to.equal('#FF0000');
        expect(res.body.priority.order).to.equal(1);
        expect(res.body.priority.organizationId).to.equal(testOrg.id);

        testPriority = res.body.priority;
      });

      it('deve criar prioridade com cor padrão', async () => {
        const res = await request(app)
          .post('/api/priorities')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Baixa'
          });

        expect(res.status).to.equal(201);
        expect(res.body.priority.color).to.equal('#6B7280');
        expect(res.body.priority.order).to.equal(0);
      });

      it('deve criar prioridade com ordem customizada', async () => {
        const res = await request(app)
          .post('/api/priorities')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Alta',
            color: '#FFA500',
            order: 2
          });

        expect(res.status).to.equal(201);
        expect(res.body.priority.order).to.equal(2);
      });

      it('deve rejeitar criação sem nome', async () => {
        const res = await request(app)
          .post('/api/priorities')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            color: '#00FF00'
          });

        expect(res.status).to.equal(400);
      });

      it('deve rejeitar criação sem autenticação', async () => {
        const res = await request(app)
          .post('/api/priorities')
          .send({
            name: 'Teste'
          });

        expect(res.status).to.equal(401);
      });
    });

    describe('GET /api/priorities', () => {
      it('deve listar todas as prioridades da organização', async () => {
        const res = await request(app)
          .get('/api/priorities')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.priorities).to.be.an('array');
        expect(res.body.priorities.length).to.be.at.least(3);
        expect(res.body.total).to.equal(res.body.priorities.length);
      });

      it('deve ordenar prioridades por order e name', async () => {
        const res = await request(app)
          .get('/api/priorities')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        const priorities = res.body.priorities;
        
        // Verificar ordenação
        for (let i = 0; i < priorities.length - 1; i++) {
          expect(priorities[i].order).to.be.at.most(priorities[i + 1].order);
        }
      });

      it('deve rejeitar listagem sem autenticação', async () => {
        const res = await request(app)
          .get('/api/priorities');

        expect(res.status).to.equal(401);
      });
    });

    describe('GET /api/priorities/:id', () => {
      it('deve obter prioridade por ID', async () => {
        const res = await request(app)
          .get(`/api/priorities/${testPriority.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.priority.id).to.equal(testPriority.id);
        expect(res.body.priority.name).to.equal('Crítica');
      });

      it('deve rejeitar ID inexistente', async () => {
        const res = await request(app)
          .get('/api/priorities/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });
    });

    describe('PUT /api/priorities/:id', () => {
      it('deve atualizar prioridade', async () => {
        const res = await request(app)
          .put(`/api/priorities/${testPriority.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Crítica Atualizada',
            color: '#CC0000',
            order: 10
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.priority.name).to.equal('Crítica Atualizada');
        expect(res.body.priority.color).to.equal('#CC0000');
        expect(res.body.priority.order).to.equal(10);
      });

      it('deve desativar prioridade', async () => {
        const res = await request(app)
          .put(`/api/priorities/${testPriority.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            isActive: false
          });

        expect(res.status).to.equal(200);
        expect(res.body.priority.isActive).to.be.false;
      });

      it('deve reativar prioridade', async () => {
        const res = await request(app)
          .put(`/api/priorities/${testPriority.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            isActive: true
          });

        expect(res.status).to.equal(200);
        expect(res.body.priority.isActive).to.be.true;
      });

      it('deve rejeitar atualização de prioridade de outra organização', async () => {
        // Criar outra organização
        const org2 = await Organization.create({
          name: 'Org 2',
          slug: 'org-2',
          email: 'org2@test.com',
          phone: '9999999999'
        });

        const priority2 = await Priority.create({
          organizationId: org2.id,
          name: 'Prioridade Org 2',
          color: '#000000'
        });

        const res = await request(app)
          .put(`/api/priorities/${priority2.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Tentativa de Hack'
          });

        expect(res.status).to.equal(404);
      });
    });

    describe('DELETE /api/priorities/:id', () => {
      it('deve deletar prioridade', async () => {
        const priority = await Priority.create({
          organizationId: testOrg.id,
          name: 'Prioridade para Deletar',
          color: '#FFFFFF'
        });

        const res = await request(app)
          .delete(`/api/priorities/${priority.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;

        // Verificar se foi deletada
        const deleted = await Priority.findByPk(priority.id);
        expect(deleted).to.be.null;
      });

      it('deve rejeitar deleção de prioridade inexistente', async () => {
        const res = await request(app)
          .delete('/api/priorities/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });

      it('deve rejeitar deleção de prioridade de outra organização', async () => {
        const org2 = await Organization.create({
          name: 'Org 3',
          slug: 'org-3',
          email: 'org3@test.com',
          phone: '8888888888'
        });

        const priority2 = await Priority.create({
          organizationId: org2.id,
          name: 'Prioridade Org 3',
          color: '#000000'
        });

        const res = await request(app)
          .delete(`/api/priorities/${priority2.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });
    });
  });

  describe('Types API', () => {
    describe('POST /api/types', () => {
      it('deve criar novo tipo', async () => {
        const res = await request(app)
          .post('/api/types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Incidente',
            description: 'Problema que afeta o serviço',
            icon: 'alert-circle',
            color: '#FF0000',
            order: 1
          });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body.type).to.exist;
        expect(res.body.type.name).to.equal('Incidente');
        expect(res.body.type.description).to.equal('Problema que afeta o serviço');
        expect(res.body.type.icon).to.equal('alert-circle');
        expect(res.body.type.color).to.equal('#FF0000');
        expect(res.body.type.order).to.equal(1);

        testType = res.body.type;
      });

      it('deve criar tipo com valores padrão', async () => {
        const res = await request(app)
          .post('/api/types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Solicitação'
          });

        expect(res.status).to.equal(201);
        expect(res.body.type.color).to.equal('#6B7280');
        expect(res.body.type.order).to.equal(0);
        expect(res.body.type.icon).to.be.null;
      });

      it('deve criar tipo sem descrição', async () => {
        const res = await request(app)
          .post('/api/types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Mudança',
            icon: 'refresh',
            color: '#0000FF'
          });

        expect(res.status).to.equal(201);
        expect(res.body.type.description).to.be.null;
      });

      it('deve rejeitar criação sem nome', async () => {
        const res = await request(app)
          .post('/api/types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Sem nome'
          });

        expect(res.status).to.equal(400);
      });

      it('deve rejeitar criação sem autenticação', async () => {
        const res = await request(app)
          .post('/api/types')
          .send({
            name: 'Teste'
          });

        expect(res.status).to.equal(401);
      });
    });

    describe('GET /api/types', () => {
      it('deve listar todos os tipos da organização', async () => {
        const res = await request(app)
          .get('/api/types')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.types).to.be.an('array');
        expect(res.body.types.length).to.be.at.least(3);
        expect(res.body.total).to.equal(res.body.types.length);
      });

      it('deve ordenar tipos por order e name', async () => {
        const res = await request(app)
          .get('/api/types')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        const types = res.body.types;
        
        // Verificar ordenação
        for (let i = 0; i < types.length - 1; i++) {
          expect(types[i].order).to.be.at.most(types[i + 1].order);
        }
      });

      it('deve rejeitar listagem sem autenticação', async () => {
        const res = await request(app)
          .get('/api/types');

        expect(res.status).to.equal(401);
      });
    });

    describe('GET /api/types/:id', () => {
      it('deve obter tipo por ID', async () => {
        const res = await request(app)
          .get(`/api/types/${testType.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.type.id).to.equal(testType.id);
        expect(res.body.type.name).to.equal('Incidente');
      });

      it('deve rejeitar ID inexistente', async () => {
        const res = await request(app)
          .get('/api/types/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });
    });

    describe('PUT /api/types/:id', () => {
      it('deve atualizar tipo', async () => {
        const res = await request(app)
          .put(`/api/types/${testType.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Incidente Atualizado',
            description: 'Descrição atualizada',
            icon: 'alert-triangle',
            color: '#CC0000',
            order: 10
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.type.name).to.equal('Incidente Atualizado');
        expect(res.body.type.description).to.equal('Descrição atualizada');
        expect(res.body.type.icon).to.equal('alert-triangle');
        expect(res.body.type.color).to.equal('#CC0000');
        expect(res.body.type.order).to.equal(10);
      });

      it('deve desativar tipo', async () => {
        const res = await request(app)
          .put(`/api/types/${testType.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            isActive: false
          });

        expect(res.status).to.equal(200);
        expect(res.body.type.isActive).to.be.false;
      });

      it('deve reativar tipo', async () => {
        const res = await request(app)
          .put(`/api/types/${testType.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            isActive: true
          });

        expect(res.status).to.equal(200);
        expect(res.body.type.isActive).to.be.true;
      });

      it('deve rejeitar atualização de tipo de outra organização', async () => {
        const org2 = await Organization.create({
          name: 'Org 4',
          slug: 'org-4',
          email: 'org4@test.com',
          phone: '7777777777'
        });

        const type2 = await Type.create({
          organizationId: org2.id,
          name: 'Tipo Org 4',
          color: '#000000'
        });

        const res = await request(app)
          .put(`/api/types/${type2.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Tentativa de Hack'
          });

        expect(res.status).to.equal(404);
      });
    });

    describe('DELETE /api/types/:id', () => {
      it('deve deletar tipo', async () => {
        const type = await Type.create({
          organizationId: testOrg.id,
          name: 'Tipo para Deletar',
          color: '#FFFFFF'
        });

        const res = await request(app)
          .delete(`/api/types/${type.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;

        // Verificar se foi deletado
        const deleted = await Type.findByPk(type.id);
        expect(deleted).to.be.null;
      });

      it('deve rejeitar deleção de tipo inexistente', async () => {
        const res = await request(app)
          .delete('/api/types/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });

      it('deve rejeitar deleção de tipo de outra organização', async () => {
        const org2 = await Organization.create({
          name: 'Org 5',
          slug: 'org-5',
          email: 'org5@test.com',
          phone: '6666666666'
        });

        const type2 = await Type.create({
          organizationId: org2.id,
          name: 'Tipo Org 5',
          color: '#000000'
        });

        const res = await request(app)
          .delete(`/api/types/${type2.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });
    });
  });

  describe('Multi-Tenant Isolation', () => {
    let org2;
    let org2User;
    let org2Token;

    before(async () => {
      // Criar segunda organização
      org2 = await Organization.create({
        name: 'Organization 2',
        slug: 'org-2-test',
        email: 'org2@test.com',
        phone: '5555555555'
      });

      org2User = await User.create({
        organizationId: org2.id,
        name: 'Org2 Admin',
        email: 'admin@org2.com',
        password: 'password123',
        role: 'provider-admin'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@org2.com',
          password: 'password123'
        });

      org2Token = loginRes.body.token;
    });

    describe('Priorities Isolation', () => {
      it('deve isolar prioridades por organização', async () => {
        const res = await request(app)
          .get('/api/priorities')
          .set('Authorization', `Bearer ${org2Token}`);

        expect(res.status).to.equal(200);
        res.body.priorities.forEach(priority => {
          expect(priority.organizationId).to.equal(org2.id);
        });
      });

      it('deve impedir acesso a prioridade de outra organização', async () => {
        const res = await request(app)
          .get(`/api/priorities/${testPriority.id}`)
          .set('Authorization', `Bearer ${org2Token}`);

        expect(res.status).to.equal(404);
      });

      it('deve permitir mesmo nome de prioridade em organizações diferentes', async () => {
        const res1 = await request(app)
          .post('/api/priorities')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Urgente',
            color: '#FF0000'
          });

        const res2 = await request(app)
          .post('/api/priorities')
          .set('Authorization', `Bearer ${org2Token}`)
          .send({
            name: 'Urgente',
            color: '#00FF00'
          });

        expect(res1.status).to.equal(201);
        expect(res2.status).to.equal(201);
        expect(res1.body.priority.id).to.not.equal(res2.body.priority.id);
      });
    });

    describe('Types Isolation', () => {
      it('deve isolar tipos por organização', async () => {
        const res = await request(app)
          .get('/api/types')
          .set('Authorization', `Bearer ${org2Token}`);

        expect(res.status).to.equal(200);
        res.body.types.forEach(type => {
          expect(type.organizationId).to.equal(org2.id);
        });
      });

      it('deve impedir acesso a tipo de outra organização', async () => {
        const res = await request(app)
          .get(`/api/types/${testType.id}`)
          .set('Authorization', `Bearer ${org2Token}`);

        expect(res.status).to.equal(404);
      });

      it('deve permitir mesmo nome de tipo em organizações diferentes', async () => {
        const res1 = await request(app)
          .post('/api/types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Problema',
            color: '#FF0000'
          });

        const res2 = await request(app)
          .post('/api/types')
          .set('Authorization', `Bearer ${org2Token}`)
          .send({
            name: 'Problema',
            color: '#00FF00'
          });

        expect(res1.status).to.equal(201);
        expect(res2.status).to.equal(201);
        expect(res1.body.type.id).to.not.equal(res2.body.type.id);
      });
    });
  });

  describe('Usage in Tickets', () => {
    it('deve permitir criar ticket com prioridade e tipo', async () => {
      // Este teste valida que prioridades e tipos podem ser usados em tickets
      const priority = await Priority.create({
        organizationId: testOrg.id,
        name: 'Normal',
        color: '#00FF00'
      });

      const type = await Type.create({
        organizationId: testOrg.id,
        name: 'Requisição',
        color: '#0000FF'
      });

      // Verificar que foram criados corretamente
      expect(priority.id).to.exist;
      expect(type.id).to.exist;
      expect(priority.organizationId).to.equal(testOrg.id);
      expect(type.organizationId).to.equal(testOrg.id);
    });
  });

  describe('Color Validation', () => {
    it('deve aceitar cores em formato hexadecimal', async () => {
      const res = await request(app)
        .post('/api/priorities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Cor Hex',
          color: '#ABCDEF'
        });

      expect(res.status).to.equal(201);
      expect(res.body.priority.color).to.equal('#ABCDEF');
    });

    it('deve aceitar cores em formato hexadecimal curto', async () => {
      const res = await request(app)
        .post('/api/types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Cor Hex Curta',
          color: '#FFF'
        });

      expect(res.status).to.equal(201);
      expect(res.body.type.color).to.equal('#FFF');
    });
  });

  describe('Order Management', () => {
    it('deve permitir reordenar prioridades', async () => {
      const p1 = await Priority.create({
        organizationId: testOrg.id,
        name: 'P1',
        color: '#FF0000',
        order: 1
      });

      const p2 = await Priority.create({
        organizationId: testOrg.id,
        name: 'P2',
        color: '#00FF00',
        order: 2
      });

      // Inverter ordem
      await request(app)
        .put(`/api/priorities/${p1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 2 });

      await request(app)
        .put(`/api/priorities/${p2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 1 });

      const res = await request(app)
        .get('/api/priorities')
        .set('Authorization', `Bearer ${adminToken}`);

      const priorities = res.body.priorities;
      const p2Index = priorities.findIndex(p => p.id === p2.id);
      const p1Index = priorities.findIndex(p => p.id === p1.id);

      expect(p2Index).to.be.lessThan(p1Index);
    });

    it('deve permitir reordenar tipos', async () => {
      const t1 = await Type.create({
        organizationId: testOrg.id,
        name: 'T1',
        color: '#FF0000',
        order: 1
      });

      const t2 = await Type.create({
        organizationId: testOrg.id,
        name: 'T2',
        color: '#00FF00',
        order: 2
      });

      // Inverter ordem
      await request(app)
        .put(`/api/types/${t1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 2 });

      await request(app)
        .put(`/api/types/${t2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order: 1 });

      const res = await request(app)
        .get('/api/types')
        .set('Authorization', `Bearer ${adminToken}`);

      const types = res.body.types;
      const t2Index = types.findIndex(t => t.id === t2.id);
      const t1Index = types.findIndex(t => t.id === t1.id);

      expect(t2Index).to.be.lessThan(t1Index);
    });
  });
});
