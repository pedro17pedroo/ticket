/**
 * Testes de Integração - Comments (Comentários)
 * Testa as rotas da API de comentários em tickets
 */

import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { Organization, User, OrganizationUser, ClientUser, Client, Ticket, Comment } from '../../src/modules/models/index.js';

describe('Comments API Integration Tests', () => {
  let testOrg;
  let providerUser;
  let orgUser;
  let clientUser;
  let testClient;
  let testTicket;
  let providerToken;
  let orgToken;
  let clientToken;

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

    // Criar cliente
    testClient = await Client.create({
      organizationId: testOrg.id,
      name: 'Test Client Company',
      tradeName: 'Test Client',
      email: 'client@test.com',
      phone: '9876543210',
      isActive: true
    });

    // Criar usuário provider
    providerUser = await User.create({
      organizationId: testOrg.id,
      name: 'Provider Admin',
      email: 'provider@test.com',
      password: 'password123',
      role: 'provider-admin',
      isActive: true
    });

    // Criar usuário da organização
    orgUser = await OrganizationUser.create({
      organizationId: testOrg.id,
      name: 'Org Agent',
      email: 'agent@test.com',
      password: 'password123',
      role: 'agent',
      isActive: true
    });

    // Criar usuário cliente
    clientUser = await ClientUser.create({
      organizationId: testOrg.id,
      clientId: testClient.id,
      name: 'Client User',
      email: 'clientuser@test.com',
      password: 'password123',
      role: 'client-user',
      isActive: true
    });

    // Criar ticket
    testTicket = await Ticket.create({
      organizationId: testOrg.id,
      ticketNumber: 'TKT-001',
      subject: 'Test Ticket',
      description: 'Test ticket for comments',
      status: 'aberto',
      priority: 'media',
      requesterId: clientUser.id
    });

    // Login dos usuários
    const providerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'provider@test.com',
        password: 'password123'
      });
    providerToken = providerLogin.body.token;

    const orgLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'agent@test.com',
        password: 'password123'
      });
    orgToken = orgLogin.body.token;

    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'clientuser@test.com',
        password: 'password123'
      });
    clientToken = clientLogin.body.token;
  });

  after(async () => {
    await sequelize.close();
  });

  describe('POST /api/tickets/:ticketId/comments', () => {
    it('deve criar comentário como provider user', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          content: 'Comentário do provider'
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.comment).to.exist;
      expect(res.body.comment.content).to.equal('Comentário do provider');
      expect(res.body.comment.authorType).to.equal('provider');
      expect(res.body.comment.author).to.exist;
      expect(res.body.comment.author.type).to.equal('provider');
    });

    it('deve criar comentário como organization user', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          content: 'Comentário do agente'
        });

      expect(res.status).to.equal(201);
      expect(res.body.comment.content).to.equal('Comentário do agente');
      expect(res.body.comment.authorType).to.equal('organization');
      expect(res.body.comment.author.type).to.equal('organization');
    });

    it('deve criar comentário como client user', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          content: 'Comentário do cliente'
        });

      expect(res.status).to.equal(201);
      expect(res.body.comment.content).to.equal('Comentário do cliente');
      expect(res.body.comment.authorType).to.equal('client');
      expect(res.body.comment.author.type).to.equal('client');
    });

    it('deve criar comentário interno', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          content: 'Comentário interno',
          isInternal: true
        });

      expect(res.status).to.equal(201);
      expect(res.body.comment.isInternal).to.be.true;
    });

    it('deve criar comentário público por padrão', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          content: 'Comentário público'
        });

      expect(res.status).to.equal(201);
      expect(res.body.comment.isInternal).to.be.false;
    });

    it('deve remover espaços em branco do conteúdo', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          content: '  Comentário com espaços  '
        });

      expect(res.status).to.equal(201);
      expect(res.body.comment.content).to.equal('Comentário com espaços');
    });

    it('deve rejeitar comentário vazio', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          content: ''
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('obrigatório');
    });

    it('deve rejeitar comentário apenas com espaços', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          content: '   '
        });

      expect(res.status).to.equal(400);
    });

    it('deve rejeitar comentário sem conteúdo', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({});

      expect(res.status).to.equal(400);
    });

    it('deve rejeitar criação sem autenticação', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .send({
          content: 'Comentário sem auth'
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/tickets/:ticketId/comments', () => {
    let comment1, comment2, comment3;

    before(async () => {
      // Criar comentários de teste
      comment1 = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Primeiro comentário',
        authorType: 'provider',
        authorUserId: providerUser.id,
        userId: providerUser.id
      });

      comment2 = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Segundo comentário',
        authorType: 'organization',
        authorOrgUserId: orgUser.id,
        userId: orgUser.id
      });

      comment3 = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Terceiro comentário',
        authorType: 'client',
        authorClientUserId: clientUser.id,
        userId: clientUser.id,
        isInternal: true
      });
    });

    it('deve listar todos os comentários do ticket', async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.comments).to.be.an('array');
      expect(res.body.comments.length).to.be.at.least(3);
    });

    it('deve ordenar comentários por data de criação (ASC)', async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(200);
      const comments = res.body.comments;
      
      for (let i = 0; i < comments.length - 1; i++) {
        const date1 = new Date(comments[i].createdAt);
        const date2 = new Date(comments[i + 1].createdAt);
        expect(date1.getTime()).to.be.at.most(date2.getTime());
      }
    });

    it('deve incluir informações do autor', async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(200);
      const comment = res.body.comments[0];
      expect(comment.author).to.exist;
      expect(comment.author.name).to.exist;
      expect(comment.author.type).to.exist;
    });

    it('deve incluir comentários de diferentes tipos de autores', async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(200);
      const authorTypes = res.body.comments.map(c => c.authorType);
      expect(authorTypes).to.include('provider');
      expect(authorTypes).to.include('organization');
      expect(authorTypes).to.include('client');
    });

    it('deve incluir comentários internos e públicos', async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(200);
      const hasInternal = res.body.comments.some(c => c.isInternal === true);
      const hasPublic = res.body.comments.some(c => c.isInternal === false);
      expect(hasInternal).to.be.true;
      expect(hasPublic).to.be.true;
    });

    it('deve rejeitar listagem sem autenticação', async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`);

      expect(res.status).to.equal(401);
    });
  });

  describe('PUT /api/tickets/:ticketId/comments/:commentId', () => {
    let providerComment, orgComment, clientComment;

    before(async () => {
      providerComment = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Comentário do provider para editar',
        authorType: 'provider',
        authorUserId: providerUser.id,
        userId: providerUser.id
      });

      orgComment = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Comentário do org para editar',
        authorType: 'organization',
        authorOrgUserId: orgUser.id,
        userId: orgUser.id
      });

      clientComment = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Comentário do cliente para editar',
        authorType: 'client',
        authorClientUserId: clientUser.id,
        userId: clientUser.id
      });
    });

    it('deve permitir autor editar seu próprio comentário', async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicket.id}/comments/${providerComment.id}`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          content: 'Comentário editado pelo autor'
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.comment.content).to.equal('Comentário editado pelo autor');
    });

    it('deve remover espaços em branco ao editar', async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicket.id}/comments/${orgComment.id}`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          content: '  Comentário editado com espaços  '
        });

      expect(res.status).to.equal(200);
      expect(res.body.comment.content).to.equal('Comentário editado com espaços');
    });

    it('deve rejeitar edição por não-autor', async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicket.id}/comments/${providerComment.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          content: 'Tentativa de edição'
        });

      expect(res.status).to.equal(403);
      expect(res.body.error).to.include('autor');
    });

    it('deve permitir admin editar qualquer comentário', async () => {
      // Criar admin
      const admin = await User.create({
        organizationId: testOrg.id,
        name: 'Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'org-admin',
        isActive: true
      });

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      const res = await request(app)
        .put(`/api/tickets/${testTicket.id}/comments/${clientComment.id}`)
        .set('Authorization', `Bearer ${adminLogin.body.token}`)
        .send({
          content: 'Editado pelo admin'
        });

      expect(res.status).to.equal(200);
      expect(res.body.comment.content).to.equal('Editado pelo admin');
    });

    it('deve rejeitar edição de comentário inexistente', async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicket.id}/comments/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          content: 'Edição'
        });

      expect(res.status).to.equal(404);
    });

    it('deve rejeitar edição sem autenticação', async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicket.id}/comments/${providerComment.id}`)
        .send({
          content: 'Edição sem auth'
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('DELETE /api/tickets/:ticketId/comments/:commentId', () => {
    let commentToDelete1, commentToDelete2;

    beforeEach(async () => {
      commentToDelete1 = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Comentário para deletar 1',
        authorType: 'provider',
        authorUserId: providerUser.id,
        userId: providerUser.id
      });

      commentToDelete2 = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Comentário para deletar 2',
        authorType: 'client',
        authorClientUserId: clientUser.id,
        userId: clientUser.id
      });
    });

    it('deve permitir autor deletar seu próprio comentário', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${testTicket.id}/comments/${commentToDelete1.id}`)
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;

      // Verificar se foi deletado
      const deleted = await Comment.findByPk(commentToDelete1.id);
      expect(deleted).to.be.null;
    });

    it('deve rejeitar deleção por não-autor', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${testTicket.id}/comments/${commentToDelete1.id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).to.equal(403);
      expect(res.body.error).to.include('autor');
    });

    it('deve permitir admin deletar qualquer comentário', async () => {
      const admin = await User.create({
        organizationId: testOrg.id,
        name: 'Admin Delete',
        email: 'admin-delete@test.com',
        password: 'password123',
        role: 'org-admin',
        isActive: true
      });

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-delete@test.com',
          password: 'password123'
        });

      const res = await request(app)
        .delete(`/api/tickets/${testTicket.id}/comments/${commentToDelete2.id}`)
        .set('Authorization', `Bearer ${adminLogin.body.token}`);

      expect(res.status).to.equal(200);
    });

    it('deve rejeitar deleção de comentário inexistente', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${testTicket.id}/comments/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(404);
    });

    it('deve rejeitar deleção sem autenticação', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${testTicket.id}/comments/${commentToDelete1.id}`);

      expect(res.status).to.equal(401);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    let org2;
    let org2User;
    let org2Token;
    let org2Ticket;
    let org2Comment;

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
        name: 'Org2 User',
        email: 'user@org2.com',
        password: 'password123',
        role: 'provider-admin'
      });

      org2Ticket = await Ticket.create({
        organizationId: org2.id,
        ticketNumber: 'TKT-ORG2',
        subject: 'Org2 Ticket',
        description: 'Test',
        status: 'aberto',
        priority: 'media',
        requesterId: org2User.id
      });

      org2Comment = await Comment.create({
        ticketId: org2Ticket.id,
        organizationId: org2.id,
        content: 'Comentário da org2',
        authorType: 'provider',
        authorUserId: org2User.id,
        userId: org2User.id
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@org2.com',
          password: 'password123'
        });

      org2Token = loginRes.body.token;
    });

    it('deve isolar comentários por organização', async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${org2Token}`);

      expect(res.status).to.equal(200);
      expect(res.body.comments.length).to.equal(0);
    });

    it('deve impedir acesso a comentário de outra organização', async () => {
      const comment = await Comment.findOne({
        where: { ticketId: testTicket.id }
      });

      const res = await request(app)
        .put(`/api/tickets/${testTicket.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${org2Token}`)
        .send({
          content: 'Tentativa de edição'
        });

      expect(res.status).to.equal(404);
    });

    it('deve impedir deleção de comentário de outra organização', async () => {
      const comment = await Comment.findOne({
        where: { ticketId: testTicket.id }
      });

      const res = await request(app)
        .delete(`/api/tickets/${testTicket.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${org2Token}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('Polymorphic Author Relationships', () => {
    it('deve manter relacionamento correto para provider user', async () => {
      const comment = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Test provider',
        authorType: 'provider',
        authorUserId: providerUser.id,
        userId: providerUser.id
      });

      const found = await Comment.findByPk(comment.id, {
        include: [
          { model: User, as: 'authorUser' },
          { model: OrganizationUser, as: 'authorOrgUser' },
          { model: ClientUser, as: 'authorClientUser' }
        ]
      });

      expect(found.authorUser).to.exist;
      expect(found.authorOrgUser).to.be.null;
      expect(found.authorClientUser).to.be.null;
    });

    it('deve manter relacionamento correto para organization user', async () => {
      const comment = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Test org',
        authorType: 'organization',
        authorOrgUserId: orgUser.id,
        userId: orgUser.id
      });

      const found = await Comment.findByPk(comment.id, {
        include: [
          { model: User, as: 'authorUser' },
          { model: OrganizationUser, as: 'authorOrgUser' },
          { model: ClientUser, as: 'authorClientUser' }
        ]
      });

      expect(found.authorUser).to.be.null;
      expect(found.authorOrgUser).to.exist;
      expect(found.authorClientUser).to.be.null;
    });

    it('deve manter relacionamento correto para client user', async () => {
      const comment = await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Test client',
        authorType: 'client',
        authorClientUserId: clientUser.id,
        userId: clientUser.id
      });

      const found = await Comment.findByPk(comment.id, {
        include: [
          { model: User, as: 'authorUser' },
          { model: OrganizationUser, as: 'authorOrgUser' },
          { model: ClientUser, as: 'authorClientUser' }
        ]
      });

      expect(found.authorUser).to.be.null;
      expect(found.authorOrgUser).to.be.null;
      expect(found.authorClientUser).to.exist;
    });
  });

  describe('Internal Comments', () => {
    it('deve criar comentário interno', async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          content: 'Nota interna para equipe',
          isInternal: true
        });

      expect(res.status).to.equal(201);
      expect(res.body.comment.isInternal).to.be.true;
    });

    it('deve listar comentários internos junto com públicos', async () => {
      // Criar comentário interno
      await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Interno',
        isInternal: true,
        authorType: 'organization',
        authorOrgUserId: orgUser.id,
        userId: orgUser.id
      });

      // Criar comentário público
      await Comment.create({
        ticketId: testTicket.id,
        organizationId: testOrg.id,
        content: 'Público',
        isInternal: false,
        authorType: 'organization',
        authorOrgUserId: orgUser.id,
        userId: orgUser.id
      });

      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/comments`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).to.equal(200);
      const hasInternal = res.body.comments.some(c => c.isInternal === true);
      const hasPublic = res.body.comments.some(c => c.isInternal === false);
      expect(hasInternal).to.be.true;
      expect(hasPublic).to.be.true;
    });
  });
});
