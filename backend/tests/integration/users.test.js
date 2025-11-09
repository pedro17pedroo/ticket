/**
 * Testes de Integração - Users API
 * Testa endpoints completos da API de usuários
 */

import request from 'supertest';
import { expect } from 'chai';
import app from '../../src/app.js';
import { User, Organization } from '../../src/modules/models/index.js';
import bcrypt from 'bcryptjs';

describe('Users API Integration Tests', () => {
  let organization, adminUser, regularUser, authToken;

  before(async () => {
    // Criar organização de teste
    organization = await Organization.create({
      name: 'Organização Users Teste',
      slug: 'org-users-teste',
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00'
    });

    // Criar usuário admin (senha será hasheada automaticamente pelo hook do modelo)
    adminUser = await User.create({
      name: 'Admin Users Teste',
      email: 'admin.users@empresa.com',
      password: 'password123',
      role: 'admin-org',
      organizationId: organization.id
    });

    // Criar usuário regular
    regularUser = await User.create({
      name: 'Usuário Regular',
      email: 'regular.users@empresa.com',
      password: 'password123',
      role: 'agente',
      organizationId: organization.id
    });

    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.users@empresa.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  after(async () => {
    // Limpar dados de teste
    await User.destroy({ where: { organizationId: organization.id } });
    await Organization.destroy({ where: { id: organization.id } });
  });

  describe('GET /api/users', () => {
    it('deve listar usuários com autenticação válida', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('users');
      expect(response.body.users).to.be.an('array');
      expect(response.body.users.length).to.be.greaterThan(0);
      
      // Verificar estrutura dos usuários
      const user = response.body.users[0];
      expect(user).to.have.property('id');
      expect(user).to.have.property('name');
      expect(user).to.have.property('email');
      expect(user).to.have.property('role');
      expect(user).to.not.have.property('password');
    });

    it('deve filtrar usuários por nome', async () => {
      const response = await request(app)
        .get('/api/users?search=Admin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.users).to.be.an('array');
      expect(response.body.users.length).to.be.greaterThan(0);
      
      const foundUser = response.body.users.find(u => u.name.includes('Admin'));
      expect(foundUser).to.not.be.undefined;
    });

    it('deve filtrar usuários por role', async () => {
      const response = await request(app)
        .get('/api/users?role=admin-org')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.users).to.be.an('array');
      response.body.users.forEach(user => {
        expect(user.role).to.equal('admin-org');
      });
    });

    it('deve retornar usuários ativos por padrão', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.users).to.be.an('array');
      // Todos os usuários retornados devem ser internos (não clientes)
      response.body.users.forEach(user => {
        expect(user.role).to.not.equal('cliente-org');
      });
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    it('deve retornar erro 401 com token inválido', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('deve retornar usuário específico', async () => {
      const response = await request(app)
        .get(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user).to.have.property('name');
      expect(response.body.user).to.have.property('email');
      expect(response.body.user).to.have.property('role');
      expect(response.body.user).to.not.have.property('password');
      
      expect(response.body.user.id).to.equal(regularUser.id);
      expect(response.body.user.email).to.equal('regular.users@empresa.com');
    });

    it('deve retornar erro 404 para usuário inexistente', async () => {
      // Usar um UUID válido mas inexistente
      const nonExistentUUID = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .get(`/api/users/${nonExistentUUID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      await request(app)
        .get(`/api/users/${regularUser.id}`)
        .expect(401);
    });
  });

  describe('POST /api/users', () => {
    afterEach(async () => {
      // Limpar usuários criados nos testes
      await User.destroy({ 
        where: { 
          email: ['novo.user@empresa.com', 'outro.user@empresa.com'],
          organizationId: organization.id
        } 
      });
    });

    it('deve criar novo usuário com dados válidos', async () => {
      const userData = {
        name: 'Novo Usuário API',
        email: 'novo.user@empresa.com',
        password: 'password123',
        role: 'agente'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user).to.have.property('name');
      expect(response.body.user).to.have.property('email');
      expect(response.body.user).to.have.property('role');
      expect(response.body.user).to.not.have.property('password');
      
      expect(response.body.user.name).to.equal('Novo Usuário API');
      expect(response.body.user.email).to.equal('novo.user@empresa.com');
      expect(response.body.user.role).to.equal('agente');

      // Verificar se foi criado no banco
      const createdUser = await User.findOne({ 
        where: { email: 'novo.user@empresa.com' } 
      });
      expect(createdUser).to.not.be.null;
      expect(createdUser.organizationId).to.equal(organization.id);
    });

    it('deve retornar erro 400 para email já existente', async () => {
      const userData = {
        name: 'Usuário Duplicado',
        email: 'admin.users@empresa.com', // Email já existe
        password: 'password123',
        role: 'cliente-org'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = {
        name: '',
        email: 'email-invalido',
        password: '123', // Senha muito curta
        role: 'role-invalida'
      };

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('deve retornar erro 400 ao tentar criar usuário com role cliente-org', async () => {
      const userData = {
        name: 'Usuário Cliente',
        email: 'cliente.test@empresa.com',
        password: 'password123',
        role: 'cliente-org'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('cliente');
    });

    it('deve retornar erro 400 para campos obrigatórios ausentes', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      const userData = {
        name: 'Teste',
        email: 'teste@empresa.com',
        password: 'password123',
        role: 'cliente-org'
      };

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(401);
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Usuário Para Editar',
        email: 'editar.user@empresa.com',
        password: 'password123',
        role: 'agente',
        organizationId: organization.id
      });
    });

    afterEach(async () => {
      await User.destroy({ where: { id: testUser.id } });
    });

    it('deve atualizar usuário com dados válidos', async () => {
      const updateData = {
        name: 'Nome Atualizado',
        email: 'email.atualizado@empresa.com',
        role: 'admin-org'
      };

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('user');
      expect(response.body.user.name).to.equal('Nome Atualizado');
      expect(response.body.user.email).to.equal('email.atualizado@empresa.com');
      expect(response.body.user.role).to.equal('admin-org');

      // Verificar se foi atualizado no banco
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.name).to.equal('Nome Atualizado');
      expect(updatedUser.email).to.equal('email.atualizado@empresa.com');
      expect(updatedUser.role).to.equal('admin-org');
    });

    it('deve atualizar senha quando fornecida', async () => {
      const updateData = {
        password: 'novaSenha123'
      };

      await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verificar se a senha foi atualizada
      const updatedUser = await User.findByPk(testUser.id);
      const isNewPassword = await bcrypt.compare('novaSenha123', updatedUser.password);
      expect(isNewPassword).to.be.true;
    });

    it('deve retornar erro 404 para usuário inexistente', async () => {
      const updateData = { name: 'Teste' };
      // Usar um UUID válido mas inexistente
      const nonExistentUUID = '550e8400-e29b-41d4-a716-446655440000';

      await request(app)
        .put(`/api/users/${nonExistentUUID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = {
        email: 'email-invalido',
        role: 'role-invalida'
      };

      await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      await request(app)
        .put(`/api/users/${testUser.id}`)
        .send({ name: 'Teste' })
        .expect(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Usuário Para Deletar',
        email: 'deletar.user@empresa.com',
        password: 'password123',
        role: 'cliente-org',
        organizationId: organization.id
      });
    });

    it('deve deletar usuário existente', async () => {
      await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verificar se foi deletado do banco
      const deletedUser = await User.findByPk(testUser.id);
      expect(deletedUser).to.be.null;
    });

    it('deve retornar erro 404 para usuário inexistente', async () => {
      // Usar um UUID válido mas inexistente
      const nonExistentUUID = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .delete(`/api/users/${nonExistentUUID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve retornar erro 400 ao tentar deletar a si mesmo', async () => {
      await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      await request(app)
        .delete(`/api/users/${testUser.id}`)
        .expect(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user).to.have.property('name');
      expect(response.body.user).to.have.property('email');
      expect(response.body.user).to.have.property('role');
      expect(response.body.user).to.not.have.property('password');
      
      expect(response.body.user.id).to.equal(adminUser.id);
      expect(response.body.user.email).to.equal('admin.users@empresa.com');
      expect(response.body.user.role).to.equal('admin-org');
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('deve retornar erro 401 com token inválido', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });
});