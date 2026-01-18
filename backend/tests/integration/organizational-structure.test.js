/**
 * Testes de Integração - Estrutura Organizacional
 * Testa as rotas da API de Direções, Departamentos e Secções
 * Valida hierarquia: Direction → Department → Section
 */

import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { Organization, User, Direction, Department, Section, Client } from '../../src/modules/models/index.js';

describe('Organizational Structure API Integration Tests', () => {
  let testOrg;
  let adminUser;
  let adminToken;
  let testDirection;
  let testDepartment;
  let testSection;

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

  describe('Directions API', () => {
    describe('POST /api/directions', () => {
      it('deve criar nova direção', async () => {
        const res = await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção de TI',
            description: 'Direção de Tecnologia da Informação',
            code: 'DTI'
          });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body.direction).to.exist;
        expect(res.body.direction.name).to.equal('Direção de TI');
        expect(res.body.direction.code).to.equal('DTI');
        expect(res.body.direction.organizationId).to.equal(testOrg.id);

        testDirection = res.body.direction;
      });

      it('deve criar direção sem código', async () => {
        const res = await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção Financeira',
            description: 'Gestão financeira'
          });

        expect(res.status).to.equal(201);
        expect(res.body.direction.name).to.equal('Direção Financeira');
        expect(res.body.direction.code).to.be.null;
      });

      it('deve rejeitar criação sem nome', async () => {
        const res = await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Sem nome'
          });

        expect(res.status).to.equal(400);
      });

      it('deve rejeitar criação com nome duplicado na mesma organização', async () => {
        const res = await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção de TI',
            code: 'DTI2'
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('já existe');
      });

      it('deve rejeitar criação sem autenticação', async () => {
        const res = await request(app)
          .post('/api/directions')
          .send({
            name: 'Direção Teste'
          });

        expect(res.status).to.equal(401);
      });

      // Email field tests
      it('deve criar direção com email válido', async () => {
        const res = await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção com Email',
            description: 'Direção com email para roteamento',
            email: 'direcao@test.com'
          });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body.direction.email).to.equal('direcao@test.com');
      });

      it('deve rejeitar criação com email duplicado', async () => {
        // Create first direction with email
        await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção Email 1',
            email: 'duplicate@test.com'
          });

        // Try to create second direction with same email
        const res = await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção Email 2',
            email: 'duplicate@test.com'
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('email');
      });

      it('deve rejeitar criação com email inválido', async () => {
        const res = await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção Email Inválido',
            email: 'not-an-email'
          });

        expect(res.status).to.equal(400);
      });

      it('deve aceitar criação sem email (opcional)', async () => {
        const res = await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção Sem Email',
            description: 'Direção sem email'
          });

        expect(res.status).to.equal(201);
        expect(res.body.direction.email).to.be.null;
      });
    });

    describe('GET /api/directions', () => {
      it('deve listar todas as direções da organização', async () => {
        const res = await request(app)
          .get('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.directions).to.be.an('array');
        expect(res.body.directions.length).to.be.at.least(2);
        expect(res.body.total).to.equal(res.body.directions.length);
      });

      it('deve incluir campo email na resposta', async () => {
        const res = await request(app)
          .get('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        res.body.directions.forEach(direction => {
          expect(direction).to.have.property('email');
        });
      });

      it('deve listar apenas direções ativas', async () => {
        // Criar direção inativa
        await Direction.create({
          organizationId: testOrg.id,
          name: 'Direção Inativa',
          isActive: false
        });

        const res = await request(app)
          .get('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        const inactiveDirection = res.body.directions.find(d => d.name === 'Direção Inativa');
        expect(inactiveDirection).to.be.undefined;
      });

      it('deve incluir departamentos nas direções', async () => {
        const res = await request(app)
          .get('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        const direction = res.body.directions.find(d => d.id === testDirection.id);
        expect(direction).to.have.property('departments');
      });
    });

    describe('GET /api/directions/:id', () => {
      it('deve obter direção por ID', async () => {
        const res = await request(app)
          .get(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.direction.id).to.equal(testDirection.id);
        expect(res.body.direction.name).to.equal('Direção de TI');
      });

      it('deve rejeitar ID inexistente', async () => {
        const res = await request(app)
          .get('/api/directions/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });
    });

    describe('PUT /api/directions/:id', () => {
      it('deve atualizar direção', async () => {
        const res = await request(app)
          .put(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção de TI Atualizada',
            description: 'Descrição atualizada',
            code: 'DTI-UPD'
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.direction.name).to.equal('Direção de TI Atualizada');
        expect(res.body.direction.code).to.equal('DTI-UPD');
      });

      it('deve atualizar email da direção', async () => {
        const res = await request(app)
          .put(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção de TI Atualizada',
            email: 'updated@test.com'
          });

        expect(res.status).to.equal(200);
        expect(res.body.direction.email).to.equal('updated@test.com');
      });

      it('deve permitir atualizar email para o mesmo valor', async () => {
        // First set an email
        await request(app)
          .put(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção de TI Atualizada',
            email: 'same@test.com'
          });

        // Update with same email (should succeed)
        const res = await request(app)
          .put(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção de TI Atualizada',
            email: 'same@test.com'
          });

        expect(res.status).to.equal(200);
        expect(res.body.direction.email).to.equal('same@test.com');
      });

      it('deve rejeitar atualização com email duplicado de outra direção', async () => {
        // Create another direction with an email
        const otherDirection = await Direction.create({
          organizationId: testOrg.id,
          name: 'Outra Direção',
          email: 'other@test.com'
        });

        // Try to update testDirection with the same email
        const res = await request(app)
          .put(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção de TI Atualizada',
            email: 'other@test.com'
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('email');
      });

      it('deve rejeitar atualização com email inválido', async () => {
        const res = await request(app)
          .put(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção de TI Atualizada',
            email: 'invalid-email'
          });

        expect(res.status).to.equal(400);
      });

      it('deve rejeitar atualização com nome duplicado', async () => {
        const res = await request(app)
          .put(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção Financeira'
          });

        expect(res.status).to.equal(400);
      });

      it('deve rejeitar atualização de direção de outra organização', async () => {
        // Criar outra organização e direção
        const org2 = await Organization.create({
          name: 'Org 2',
          slug: 'org-2',
          email: 'org2@test.com',
          phone: '9999999999'
        });

        const direction2 = await Direction.create({
          organizationId: org2.id,
          name: 'Direção Org 2'
        });

        const res = await request(app)
          .put(`/api/directions/${direction2.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Tentativa de Atualização'
          });

        expect(res.status).to.equal(404);
      });
    });

    describe('DELETE /api/directions/:id', () => {
      it('deve rejeitar deleção de direção com departamentos', async () => {
        // Criar departamento na direção
        await Department.create({
          organizationId: testOrg.id,
          directionId: testDirection.id,
          name: 'Departamento Teste'
        });

        const res = await request(app)
          .delete(`/api/directions/${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('departamentos');
      });

      it('deve fazer soft delete de direção sem departamentos', async () => {
        const emptyDirection = await Direction.create({
          organizationId: testOrg.id,
          name: 'Direção Vazia'
        });

        const res = await request(app)
          .delete(`/api/directions/${emptyDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;

        // Verificar soft delete
        const deleted = await Direction.findByPk(emptyDirection.id);
        expect(deleted.isActive).to.be.false;
      });
    });
  });

  describe('Departments API', () => {
    describe('POST /api/departments', () => {
      it('deve criar novo departamento', async () => {
        const res = await request(app)
          .post('/api/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            directionId: testDirection.id,
            name: 'Departamento de Infraestrutura',
            description: 'Gestão de infraestrutura de TI',
            code: 'INFRA'
          });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body.department).to.exist;
        expect(res.body.department.name).to.equal('Departamento de Infraestrutura');
        expect(res.body.department.directionId).to.equal(testDirection.id);

        testDepartment = res.body.department;
      });

      it('deve criar departamento sem código', async () => {
        const res = await request(app)
          .post('/api/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            directionId: testDirection.id,
            name: 'Departamento de Desenvolvimento'
          });

        expect(res.status).to.equal(201);
        expect(res.body.department.code).to.be.null;
      });

      it('deve rejeitar criação sem directionId', async () => {
        const res = await request(app)
          .post('/api/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Departamento Sem Direção'
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('obrigatória');
      });

      it('deve rejeitar criação com directionId inexistente', async () => {
        const res = await request(app)
          .post('/api/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            directionId: '00000000-0000-0000-0000-000000000000',
            name: 'Departamento Teste'
          });

        expect(res.status).to.equal(404);
      });

      it('deve rejeitar criação com nome duplicado na mesma direção', async () => {
        const res = await request(app)
          .post('/api/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            directionId: testDirection.id,
            name: 'Departamento de Infraestrutura'
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('já existe');
      });

      it('deve permitir mesmo nome em direções diferentes', async () => {
        const direction2 = await Direction.create({
          organizationId: testOrg.id,
          name: 'Direção de RH'
        });

        const res = await request(app)
          .post('/api/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            directionId: direction2.id,
            name: 'Departamento de Infraestrutura' // Mesmo nome, direção diferente
          });

        expect(res.status).to.equal(201);
      });
    });

    describe('GET /api/departments', () => {
      it('deve listar todos os departamentos da organização', async () => {
        const res = await request(app)
          .get('/api/departments')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.departments).to.be.an('array');
        expect(res.body.departments.length).to.be.at.least(2);
      });

      it('deve filtrar departamentos por direção', async () => {
        const res = await request(app)
          .get(`/api/departments?directionId=${testDirection.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        res.body.departments.forEach(dept => {
          expect(dept.directionId).to.equal(testDirection.id);
        });
      });

      it('deve incluir direção e secções nos departamentos', async () => {
        const res = await request(app)
          .get('/api/departments')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        const dept = res.body.departments[0];
        expect(dept).to.have.property('direction');
        expect(dept).to.have.property('sections');
      });
    });

    describe('GET /api/departments/:id', () => {
      it('deve obter departamento por ID', async () => {
        const res = await request(app)
          .get(`/api/departments/${testDepartment.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.department.id).to.equal(testDepartment.id);
      });

      it('deve rejeitar ID inexistente', async () => {
        const res = await request(app)
          .get('/api/departments/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });
    });

    describe('PUT /api/departments/:id', () => {
      it('deve atualizar departamento', async () => {
        const res = await request(app)
          .put(`/api/departments/${testDepartment.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            directionId: testDirection.id,
            name: 'Departamento de Infraestrutura Atualizado',
            code: 'INFRA-UPD'
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.department.name).to.equal('Departamento de Infraestrutura Atualizado');
      });

      it('deve permitir mudar de direção', async () => {
        const newDirection = await Direction.create({
          organizationId: testOrg.id,
          name: 'Nova Direção'
        });

        const res = await request(app)
          .put(`/api/departments/${testDepartment.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            directionId: newDirection.id,
            name: 'Departamento Movido'
          });

        expect(res.status).to.equal(200);
        expect(res.body.department.directionId).to.equal(newDirection.id);
      });

      it('deve rejeitar atualização sem directionId', async () => {
        const res = await request(app)
          .put(`/api/departments/${testDepartment.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Departamento Sem Direção'
          });

        expect(res.status).to.equal(400);
      });
    });

    describe('DELETE /api/departments/:id', () => {
      it('deve rejeitar deleção de departamento com secções', async () => {
        // Criar secção no departamento
        await Section.create({
          organizationId: testOrg.id,
          departmentId: testDepartment.id,
          name: 'Secção Teste'
        });

        const res = await request(app)
          .delete(`/api/departments/${testDepartment.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('secções');
      });

      it('deve fazer soft delete de departamento sem secções', async () => {
        const emptyDept = await Department.create({
          organizationId: testOrg.id,
          directionId: testDirection.id,
          name: 'Departamento Vazio'
        });

        const res = await request(app)
          .delete(`/api/departments/${emptyDept.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);

        const deleted = await Department.findByPk(emptyDept.id);
        expect(deleted.isActive).to.be.false;
      });
    });
  });

  describe('Sections API', () => {
    describe('POST /api/sections', () => {
      it('deve criar nova secção', async () => {
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção de Redes',
            description: 'Gestão de redes',
            code: 'REDES'
          });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body.section).to.exist;
        expect(res.body.section.name).to.equal('Secção de Redes');
        expect(res.body.section.departmentId).to.equal(testDepartment.id);

        testSection = res.body.section;
      });

      it('deve criar secção sem código', async () => {
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção de Servidores'
          });

        expect(res.status).to.equal(201);
        expect(res.body.section.code).to.be.null;
      });

      it('deve rejeitar criação sem departmentId', async () => {
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Secção Sem Departamento'
          });

        expect(res.status).to.equal(400);
      });

      it('deve rejeitar criação com departmentId inexistente', async () => {
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: '00000000-0000-0000-0000-000000000000',
            name: 'Secção Teste'
          });

        expect(res.status).to.equal(404);
      });

      it('deve rejeitar criação com nome duplicado no mesmo departamento', async () => {
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção de Redes'
          });

        expect(res.status).to.equal(400);
      });

      it('deve permitir mesmo nome em departamentos diferentes', async () => {
        const dept2 = await Department.create({
          organizationId: testOrg.id,
          directionId: testDirection.id,
          name: 'Departamento 2'
        });

        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: dept2.id,
            name: 'Secção de Redes' // Mesmo nome, departamento diferente
          });

        expect(res.status).to.equal(201);
      });
    });

    describe('GET /api/sections', () => {
      it('deve listar todas as secções da organização', async () => {
        const res = await request(app)
          .get('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.sections).to.be.an('array');
        expect(res.body.sections.length).to.be.at.least(2);
      });

      it('deve filtrar secções por departamento', async () => {
        const res = await request(app)
          .get(`/api/sections?departmentId=${testDepartment.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        res.body.sections.forEach(section => {
          expect(section.departmentId).to.equal(testDepartment.id);
        });
      });

      it('deve incluir departamento nas secções', async () => {
        const res = await request(app)
          .get('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        const section = res.body.sections[0];
        expect(section).to.have.property('department');
      });
    });

    describe('GET /api/sections/:id', () => {
      it('deve obter secção por ID', async () => {
        const res = await request(app)
          .get(`/api/sections/${testSection.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.section.id).to.equal(testSection.id);
      });

      it('deve rejeitar ID inexistente', async () => {
        const res = await request(app)
          .get('/api/sections/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
      });
    });

    describe('PUT /api/sections/:id', () => {
      it('deve atualizar secção', async () => {
        const res = await request(app)
          .put(`/api/sections/${testSection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção de Redes Atualizada',
            code: 'REDES-UPD'
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.section.name).to.equal('Secção de Redes Atualizada');
      });

      it('deve permitir mudar de departamento', async () => {
        const newDept = await Department.create({
          organizationId: testOrg.id,
          directionId: testDirection.id,
          name: 'Novo Departamento'
        });

        const res = await request(app)
          .put(`/api/sections/${testSection.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: newDept.id,
            name: 'Secção Movida'
          });

        expect(res.status).to.equal(200);
        expect(res.body.section.departmentId).to.equal(newDept.id);
      });
    });

    describe('DELETE /api/sections/:id', () => {
      it('deve fazer soft delete de secção', async () => {
        const section = await Section.create({
          organizationId: testOrg.id,
          departmentId: testDepartment.id,
          name: 'Secção para Deletar'
        });

        const res = await request(app)
          .delete(`/api/sections/${section.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);

        const deleted = await Section.findByPk(section.id);
        expect(deleted.isActive).to.be.false;
      });
    });
  });

  describe('Hierarchical Integrity', () => {
    it('deve manter hierarquia Direction → Department → Section', async () => {
      // Criar hierarquia completa
      const direction = await Direction.create({
        organizationId: testOrg.id,
        name: 'Direção Hierarquia'
      });

      const department = await Department.create({
        organizationId: testOrg.id,
        directionId: direction.id,
        name: 'Departamento Hierarquia'
      });

      const section = await Section.create({
        organizationId: testOrg.id,
        departmentId: department.id,
        name: 'Secção Hierarquia'
      });

      // Verificar relacionamentos
      const sectionWithDept = await Section.findByPk(section.id, {
        include: [{
          model: Department,
          as: 'department',
          include: [{
            model: Direction,
            as: 'direction'
          }]
        }]
      });

      expect(sectionWithDept.department).to.exist;
      expect(sectionWithDept.department.direction).to.exist;
      expect(sectionWithDept.department.direction.id).to.equal(direction.id);
    });

    it('deve impedir deleção em cascata', async () => {
      const direction = await Direction.create({
        organizationId: testOrg.id,
        name: 'Direção Cascata'
      });

      const department = await Department.create({
        organizationId: testOrg.id,
        directionId: direction.id,
        name: 'Departamento Cascata'
      });

      await Section.create({
        organizationId: testOrg.id,
        departmentId: department.id,
        name: 'Secção Cascata'
      });

      // Tentar deletar direção com departamentos
      const res = await request(app)
        .delete(`/api/directions/${direction.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(400);
    });
  });

  describe('Section Email Integration Tests', () => {
    describe('POST /api/sections - Email Validation', () => {
      it('deve criar secção com email válido', async () => {
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção com Email',
            email: 'section-test@example.com'
          });

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
        expect(res.body.section.email).to.equal('section-test@example.com');
      });

      it('deve rejeitar criação com email duplicado (já usado em outra secção)', async () => {
        // Criar primeira secção com email
        await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção Email 1',
            email: 'duplicate-section@example.com'
          });

        // Tentar criar segunda secção com mesmo email
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção Email 2',
            email: 'duplicate-section@example.com'
          });

        expect(res.status).to.equal(400);
        expect(res.body.success).to.be.false;
        expect(res.body.error).to.include('Secção');
      });

      it('deve rejeitar criação com email duplicado (já usado em direção)', async () => {
        // Criar direção com email
        await request(app)
          .post('/api/directions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Direção com Email',
            email: 'direction-email@example.com'
          });

        // Tentar criar secção com mesmo email
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção Conflito',
            email: 'direction-email@example.com'
          });

        expect(res.status).to.equal(400);
        expect(res.body.success).to.be.false;
        expect(res.body.error).to.include('Direção');
      });

      it('deve rejeitar criação com email duplicado (já usado em departamento)', async () => {
        // Criar departamento com email
        const dept = await Department.create({
          organizationId: testOrg.id,
          directionId: testDirection.id,
          name: 'Departamento com Email',
          email: 'department-email@example.com'
        });

        // Tentar criar secção com mesmo email
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: dept.id,
            name: 'Secção Conflito Dept',
            email: 'department-email@example.com'
          });

        expect(res.status).to.equal(400);
        expect(res.body.success).to.be.false;
        expect(res.body.error).to.include('Departamento');
      });

      it('deve aceitar email null', async () => {
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção Sem Email',
            email: null
          });

        expect(res.status).to.equal(201);
        expect(res.body.section.email).to.be.null;
      });

      it('deve aceitar email vazio (convertido para null)', async () => {
        const res = await request(app)
          .post('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            departmentId: testDepartment.id,
            name: 'Secção Email Vazio',
            email: ''
          });

        expect(res.status).to.equal(201);
        expect(res.body.section.email).to.be.null;
      });
    });

    describe('PUT /api/sections/:id - Email Update', () => {
      let sectionForUpdate;

      beforeEach(async () => {
        sectionForUpdate = await Section.create({
          organizationId: testOrg.id,
          departmentId: testDepartment.id,
          name: 'Secção para Atualizar Email',
          email: 'original-section@example.com'
        });
      });

      it('deve atualizar secção com novo email válido', async () => {
        const res = await request(app)
          .put(`/api/sections/${sectionForUpdate.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Secção Atualizada',
            email: 'updated-section@example.com'
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.section.email).to.equal('updated-section@example.com');
      });

      it('deve rejeitar atualização com email duplicado', async () => {
        // Criar outra secção com email
        await Section.create({
          organizationId: testOrg.id,
          departmentId: testDepartment.id,
          name: 'Outra Secção',
          email: 'other-section@example.com'
        });

        // Tentar atualizar para email duplicado
        const res = await request(app)
          .put(`/api/sections/${sectionForUpdate.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Secção Atualizada',
            email: 'other-section@example.com'
          });

        expect(res.status).to.equal(400);
        expect(res.body.success).to.be.false;
        expect(res.body.error).to.include('Secção');
      });

      it('deve permitir atualização com mesmo email (idempotência)', async () => {
        const res = await request(app)
          .put(`/api/sections/${sectionForUpdate.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Secção Atualizada',
            email: 'original-section@example.com' // Mesmo email
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.section.email).to.equal('original-section@example.com');
      });

      it('deve permitir remover email (set to null)', async () => {
        const res = await request(app)
          .put(`/api/sections/${sectionForUpdate.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Secção Sem Email',
            email: null
          });

        expect(res.status).to.equal(200);
        expect(res.body.section.email).to.be.null;
      });

      it('deve permitir remover email (set to empty string)', async () => {
        const res = await request(app)
          .put(`/api/sections/${sectionForUpdate.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Secção Sem Email',
            email: ''
          });

        expect(res.status).to.equal(200);
        expect(res.body.section.email).to.be.null;
      });
    });

    describe('GET /api/sections - Email in Response', () => {
      it('deve incluir campo email na listagem de secções', async () => {
        // Criar secção com email
        await Section.create({
          organizationId: testOrg.id,
          departmentId: testDepartment.id,
          name: 'Secção com Email Lista',
          email: 'list-section@example.com'
        });

        const res = await request(app)
          .get('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.sections).to.be.an('array');
        
        const sectionWithEmail = res.body.sections.find(s => s.email === 'list-section@example.com');
        expect(sectionWithEmail).to.exist;
        expect(sectionWithEmail).to.have.property('email');
      });

      it('deve incluir campo email (null) para secções sem email', async () => {
        // Criar secção sem email
        const section = await Section.create({
          organizationId: testOrg.id,
          departmentId: testDepartment.id,
          name: 'Secção Sem Email Lista'
        });

        const res = await request(app)
          .get('/api/sections')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        
        const foundSection = res.body.sections.find(s => s.id === section.id);
        expect(foundSection).to.exist;
        expect(foundSection).to.have.property('email');
        expect(foundSection.email).to.be.null;
      });
    });

    describe('GET /api/sections/:id - Email in Response', () => {
      it('deve incluir campo email ao obter secção por ID', async () => {
        const section = await Section.create({
          organizationId: testOrg.id,
          departmentId: testDepartment.id,
          name: 'Secção Get By ID',
          email: 'getbyid-section@example.com'
        });

        const res = await request(app)
          .get(`/api/sections/${section.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.section).to.have.property('email');
        expect(res.body.section.email).to.equal('getbyid-section@example.com');
      });
    });
  });

  describe('Multi-Tenant Isolation', () => {
    let org2;
    let org2User;
    let org2Token;
    let org2Direction;

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

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@org2.com',
          password: 'password123'
        });

      org2Token = loginRes.body.token;

      org2Direction = await Direction.create({
        organizationId: org2.id,
        name: 'Direção Org2'
      });
    });

    it('deve isolar direções por organização', async () => {
      const res = await request(app)
        .get('/api/directions')
        .set('Authorization', `Bearer ${org2Token}`);

      expect(res.status).to.equal(200);
      res.body.directions.forEach(direction => {
        expect(direction.organizationId).to.equal(org2.id);
      });
    });

    it('deve impedir acesso a direção de outra organização', async () => {
      const res = await request(app)
        .get(`/api/directions/${testDirection.id}`)
        .set('Authorization', `Bearer ${org2Token}`);

      expect(res.status).to.equal(404);
    });

    it('deve impedir atualização de direção de outra organização', async () => {
      const res = await request(app)
        .put(`/api/directions/${testDirection.id}`)
        .set('Authorization', `Bearer ${org2Token}`)
        .send({
          name: 'Tentativa de Hack'
        });

      expect(res.status).to.equal(404);
    });

    it('deve impedir deleção de direção de outra organização', async () => {
      const res = await request(app)
        .delete(`/api/directions/${testDirection.id}`)
        .set('Authorization', `Bearer ${org2Token}`);

      expect(res.status).to.equal(404);
    });
  });
});
