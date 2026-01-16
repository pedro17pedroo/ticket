import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { Organization, User, CatalogCategory, KnowledgeArticle } from '../../src/modules/models/index.js';
import bcrypt from 'bcryptjs';

describe('Knowledge Base API Integration Tests', () => {
  let organization, adminUser, agenteUser, clientUser;
  let adminToken, agenteToken, clientToken;
  let category, publishedArticle, draftArticle;

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

    // Criar categoria
    category = await CatalogCategory.create({
      name: 'Tutoriais',
      icon: '📚',
      color: '#3B82F6',
      organizationId: organization.id
    });
  });

  after(async () => {
    await sequelize.close();
  });

  describe('POST /api/knowledge', () => {
    it('admin deve criar artigo publicado com sucesso', async () => {
      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Como Resetar Senha',
          content: '<p>Passo 1: Clique em "Esqueci minha senha"...</p>',
          categoryId: category.id,
          isPublished: true
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('article');
      expect(response.body.article.title).to.equal('Como Resetar Senha');
      expect(response.body.article.slug).to.equal('como-resetar-senha');
      expect(response.body.article.isPublished).to.be.true;
      expect(response.body.article.publishedAt).to.exist;

      publishedArticle = response.body.article;
    });

    it('agente deve criar artigo rascunho com sucesso', async () => {
      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          title: 'Guia de Instalação (Rascunho)',
          content: '<p>Conteúdo em desenvolvimento...</p>',
          categoryId: category.id,
          isPublished: false
        });

      expect(response.status).to.equal(201);
      expect(response.body.article.isPublished).to.be.false;
      expect(response.body.article.publishedAt).to.be.null;

      draftArticle = response.body.article;
    });

    it('deve gerar slug único para títulos duplicados', async () => {
      const response1 = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Artigo Teste',
          content: '<p>Conteúdo 1</p>',
          isPublished: true
        });

      const response2 = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Artigo Teste',
          content: '<p>Conteúdo 2</p>',
          isPublished: true
        });

      expect(response1.status).to.equal(201);
      expect(response2.status).to.equal(201);
      expect(response1.body.article.slug).to.equal('artigo-teste');
      expect(response2.body.article.slug).to.equal('artigo-teste-1');
    });

    it('deve remover acentos e caracteres especiais do slug', async () => {
      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Configuração Básica do Sistema!',
          content: '<p>Conteúdo</p>',
          isPublished: true
        });

      expect(response.status).to.equal(201);
      expect(response.body.article.slug).to.equal('configuracao-basica-do-sistema');
    });

    it('cliente não deve poder criar artigo', async () => {
      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Artigo Cliente',
          content: '<p>Conteúdo</p>',
          isPublished: true
        });

      expect(response.status).to.equal(403);
      expect(response.body.error).to.include('Sem permissão');
    });

    it('não deve criar artigo sem autenticação', async () => {
      const response = await request(app)
        .post('/api/knowledge')
        .send({
          title: 'Artigo Sem Auth',
          content: '<p>Conteúdo</p>'
        });

      expect(response.status).to.equal(401);
    });
  });

  describe('GET /api/knowledge', () => {
    it('admin deve ver todos os artigos (publicados e rascunhos)', async () => {
      const response = await request(app)
        .get('/api/knowledge')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('articles');
      expect(response.body.articles).to.be.an('array');
      expect(response.body.articles.length).to.be.greaterThan(0);

      const hasPublished = response.body.articles.some(a => a.isPublished);
      const hasDraft = response.body.articles.some(a => !a.isPublished);
      expect(hasPublished).to.be.true;
      expect(hasDraft).to.be.true;
    });

    it('cliente deve ver apenas artigos publicados', async () => {
      const response = await request(app)
        .get('/api/knowledge')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.articles).to.be.an('array');

      const allPublished = response.body.articles.every(a => a.isPublished);
      expect(allPublished).to.be.true;
    });

    it('deve filtrar por categoria', async () => {
      const response = await request(app)
        .get(`/api/knowledge?categoryId=${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      const allInCategory = response.body.articles.every(
        a => a.categoryId === category.id
      );
      expect(allInCategory).to.be.true;
    });

    it('deve buscar por termo', async () => {
      const response = await request(app)
        .get('/api/knowledge?search=senha')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.articles.length).to.be.greaterThan(0);
      
      const hasSearchTerm = response.body.articles.some(
        a => a.title.toLowerCase().includes('senha') || 
             a.content.toLowerCase().includes('senha')
      );
      expect(hasSearchTerm).to.be.true;
    });

    it('deve filtrar apenas publicados quando especificado', async () => {
      const response = await request(app)
        .get('/api/knowledge?isPublished=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      const allPublished = response.body.articles.every(a => a.isPublished);
      expect(allPublished).to.be.true;
    });
  });

  describe('GET /api/knowledge/:id', () => {
    it('deve obter artigo publicado por ID', async () => {
      const response = await request(app)
        .get(`/api/knowledge/${publishedArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('article');
      expect(response.body.article.id).to.equal(publishedArticle.id);
      expect(response.body.article.title).to.equal(publishedArticle.title);
    });

    it('deve incrementar visualizações ao acessar artigo', async () => {
      const initialViews = publishedArticle.views || 0;

      await request(app)
        .get(`/api/knowledge/${publishedArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const response = await request(app)
        .get(`/api/knowledge/${publishedArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.article.views).to.be.greaterThan(initialViews);
    });

    it('cliente não deve ver artigo rascunho', async () => {
      const response = await request(app)
        .get(`/api/knowledge/${draftArticle.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(404);
    });

    it('admin deve ver artigo rascunho', async () => {
      const response = await request(app)
        .get(`/api/knowledge/${draftArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.article.id).to.equal(draftArticle.id);
    });

    it('deve retornar 404 para artigo inexistente', async () => {
      const response = await request(app)
        .get('/api/knowledge/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('PUT /api/knowledge/:id', () => {
    it('admin deve atualizar artigo com sucesso', async () => {
      const response = await request(app)
        .put(`/api/knowledge/${publishedArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Como Resetar Senha - Atualizado',
          content: '<p>Conteúdo atualizado...</p>'
        });

      expect(response.status).to.equal(200);
      expect(response.body.article.title).to.equal('Como Resetar Senha - Atualizado');
      expect(response.body.article.slug).to.equal('como-resetar-senha-atualizado');
    });

    it('deve publicar artigo rascunho', async () => {
      const response = await request(app)
        .put(`/api/knowledge/${draftArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isPublished: true
        });

      expect(response.status).to.equal(200);
      expect(response.body.article.isPublished).to.be.true;
      expect(response.body.article.publishedAt).to.exist;
    });

    it('agente deve atualizar próprio artigo', async () => {
      const response = await request(app)
        .put(`/api/knowledge/${draftArticle.id}`)
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          content: '<p>Conteúdo atualizado pelo agente</p>'
        });

      expect(response.status).to.equal(200);
    });

    it('cliente não deve atualizar artigo', async () => {
      const response = await request(app)
        .put(`/api/knowledge/${publishedArticle.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Tentativa de atualização'
        });

      expect(response.status).to.equal(403);
    });

    it('deve retornar 404 ao atualizar artigo inexistente', async () => {
      const response = await request(app)
        .put('/api/knowledge/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Teste'
        });

      expect(response.status).to.equal(404);
    });
  });

  describe('DELETE /api/knowledge/:id', () => {
    let articleToDelete;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Artigo para Deletar',
          content: '<p>Será deletado</p>',
          isPublished: true
        });
      articleToDelete = response.body.article;
    });

    it('admin deve deletar artigo com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/knowledge/${articleToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.include('eliminado');

      // Verificar que foi deletado
      const getResponse = await request(app)
        .get(`/api/knowledge/${articleToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).to.equal(404);
    });

    it('agente deve deletar artigo', async () => {
      const response = await request(app)
        .delete(`/api/knowledge/${articleToDelete.id}`)
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).to.equal(200);
    });

    it('cliente não deve deletar artigo', async () => {
      const response = await request(app)
        .delete(`/api/knowledge/${articleToDelete.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(403);
    });

    it('deve retornar 404 ao deletar artigo inexistente', async () => {
      const response = await request(app)
        .delete('/api/knowledge/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('Multi-tenant Isolation', () => {
    let otherOrganization, otherUser, otherToken, otherArticle;

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

      // Criar artigo na outra organização
      otherArticle = await KnowledgeArticle.create({
        title: 'Artigo Outra Org',
        slug: 'artigo-outra-org',
        content: '<p>Conteúdo</p>',
        isPublished: true,
        authorId: otherUser.id,
        organizationId: otherOrganization.id
      });
    });

    it('usuário não deve ver artigos de outra organização', async () => {
      const response = await request(app)
        .get('/api/knowledge')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      const hasOtherOrgArticle = response.body.articles.some(
        a => a.organizationId === otherOrganization.id
      );
      expect(hasOtherOrgArticle).to.be.false;
    });

    it('usuário não deve acessar artigo de outra organização', async () => {
      const response = await request(app)
        .get(`/api/knowledge/${otherArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(404);
    });

    it('usuário não deve atualizar artigo de outra organização', async () => {
      const response = await request(app)
        .put(`/api/knowledge/${otherArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Tentativa de atualização'
        });

      expect(response.status).to.equal(404);
    });

    it('usuário não deve deletar artigo de outra organização', async () => {
      const response = await request(app)
        .delete(`/api/knowledge/${otherArticle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(404);
    });
  });
});
