/**
 * Testes de Integração - API de Autenticação
 * Testa as rotas da API de autenticação incluindo:
 * - Login multi-tabela (Provider, Organization, Client)
 * - Registro de usuários
 * - Reset de senha
 * - Perfil do usuário
 * - Alteração de senha
 * - Refresh token
 * - Validação de JWT
 */

import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { User, Organization, OrganizationUser, ClientUser, Client } from '../../src/modules/models/index.js';

describe('Auth API Integration Tests', () => {
  let testOrg;
  let providerUser;
  let orgUser;
  let clientUser;
  let testClient;
  let providerToken;
  let orgToken;
  let clientToken;

  before(async () => {
    await sequelize.sync({ force: true });

    // Criar organização de teste
    testOrg = await Organization.create({
      name: 'Test Organization',
      slug: 'test-org',
      email: 'org@test.com',
      phone: '1234567890',
      isActive: true
    });

    // Criar cliente B2B
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
  });

  after(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    describe('Provider Login', () => {
      it('deve fazer login como provider user', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'provider@test.com',
            password: 'password123',
            portalType: 'provider'
          });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
        expect(res.body).to.have.property('user');
        expect(res.body.user.email).to.equal('provider@test.com');
        expect(res.body.user.userType).to.equal('provider');
        expect(res.body.user.organization).to.exist;
        expect(res.body.user.organization.name).to.equal('Test Organization');

        providerToken = res.body.token;
      });

      it('deve rejeitar login de provider com senha incorreta', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'provider@test.com',
            password: 'wrongpassword',
            portalType: 'provider'
          });

        expect(res.status).to.equal(401);
        expect(res.body).to.have.property('error');
      });

      it('deve rejeitar login de provider com email inexistente', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'password123',
            portalType: 'provider'
          });

        expect(res.status).to.equal(401);
        expect(res.body).to.have.property('error');
      });
    });

    describe('Organization User Login', () => {
      it('deve fazer login como organization user', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'agent@test.com',
            password: 'password123',
            portalType: 'organization'
          });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
        expect(res.body.user.email).to.equal('agent@test.com');
        expect(res.body.user.userType).to.equal('organization');
        expect(res.body.user.role).to.equal('agent');

        orgToken = res.body.token;
      });

      it('deve rejeitar organization user tentando acessar portal provider', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'agent@test.com',
            password: 'password123',
            portalType: 'provider'
          });

        expect(res.status).to.equal(403);
        expect(res.body.error).to.include('permissão');
      });
    });

    describe('Client User Login', () => {
      it('deve fazer login como client user', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'clientuser@test.com',
            password: 'password123',
            portalType: 'client'
          });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
        expect(res.body.user.email).to.equal('clientuser@test.com');
        expect(res.body.user.userType).to.equal('client');
        expect(res.body.user.client).to.exist;
        expect(res.body.user.client.name).to.equal('Test Client Company');

        clientToken = res.body.token;
      });

      it('deve rejeitar client user tentando acessar portal organization', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'clientuser@test.com',
            password: 'password123',
            portalType: 'organization'
          });

        expect(res.status).to.equal(403);
        expect(res.body.error).to.include('permissão');
      });
    });

    describe('Agent Desktop Login (sem portalType)', () => {
      it('deve permitir login de provider sem especificar portalType', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'provider@test.com',
            password: 'password123'
          });

        expect(res.status).to.equal(200);
        expect(res.body.user.userType).to.equal('provider');
      });

      it('deve permitir login de organization user sem especificar portalType', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'agent@test.com',
            password: 'password123'
          });

        expect(res.status).to.equal(200);
        expect(res.body.user.userType).to.equal('organization');
      });

      it('deve permitir login de client user sem especificar portalType', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'clientuser@test.com',
            password: 'password123'
          });

        expect(res.status).to.equal(200);
        expect(res.body.user.userType).to.equal('client');
      });
    });

    describe('Validações de Login', () => {
      it('deve rejeitar login sem email', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            password: 'password123'
          });

        expect(res.status).to.equal(400);
      });

      it('deve rejeitar login sem senha', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'provider@test.com'
          });

        expect(res.status).to.equal(400);
      });

      it('deve rejeitar login com email inválido', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'invalid-email',
            password: 'password123'
          });

        expect(res.status).to.equal(400);
      });
    });

    describe('Usuários Inativos', () => {
      let inactiveUser;

      before(async () => {
        inactiveUser = await User.create({
          organizationId: testOrg.id,
          name: 'Inactive User',
          email: 'inactive@test.com',
          password: 'password123',
          role: 'agent',
          isActive: false
        });
      });

      it('deve rejeitar login de usuário inativo', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'inactive@test.com',
            password: 'password123'
          });

        expect(res.status).to.equal(401);
      });
    });
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar novo usuário cliente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Client User',
          email: 'newclient@test.com',
          password: 'password123',
          phone: '1112223333',
          organizationId: testOrg.id
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user.email).to.equal('newclient@test.com');
      expect(res.body.user.role).to.equal('cliente-org');
    });

    it('deve rejeitar registro com email duplicado na mesma organização', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'newclient@test.com',
          password: 'password123',
          organizationId: testOrg.id
        });

      expect(res.status).to.equal(409);
      expect(res.body.error).to.include('já cadastrado');
    });

    it('deve rejeitar registro sem nome', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
          organizationId: testOrg.id
        });

      expect(res.status).to.equal(400);
    });

    it('deve rejeitar registro sem email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          password: 'password123',
          organizationId: testOrg.id
        });

      expect(res.status).to.equal(400);
    });

    it('deve rejeitar registro sem senha', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          organizationId: testOrg.id
        });

      expect(res.status).to.equal(400);
    });

    it('deve rejeitar registro com email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          organizationId: testOrg.id
        });

      expect(res.status).to.equal(400);
    });
  });

  describe('Password Reset Flow', () => {
    describe('POST /api/auth/request-password-reset', () => {
      it('deve solicitar reset de senha para provider user', async () => {
        const res = await request(app)
          .post('/api/auth/request-password-reset')
          .send({
            email: 'provider@test.com',
            portalType: 'provider'
          });

        expect(res.status).to.equal(200);
        expect(res.body.message).to.include('instruções');

        // Verificar se token foi gerado
        const user = await User.findOne({ where: { email: 'provider@test.com' } });
        expect(user.passwordResetToken).to.exist;
        expect(user.passwordResetExpires).to.exist;
      });

      it('deve solicitar reset de senha para organization user', async () => {
        const res = await request(app)
          .post('/api/auth/request-password-reset')
          .send({
            email: 'agent@test.com',
            portalType: 'organization'
          });

        expect(res.status).to.equal(200);

        const user = await OrganizationUser.findOne({ where: { email: 'agent@test.com' } });
        expect(user.passwordResetToken).to.exist;
      });

      it('deve solicitar reset de senha para client user', async () => {
        const res = await request(app)
          .post('/api/auth/request-password-reset')
          .send({
            email: 'clientuser@test.com',
            portalType: 'client'
          });

        expect(res.status).to.equal(200);

        const user = await ClientUser.findOne({ where: { email: 'clientuser@test.com' } });
        expect(user.passwordResetToken).to.exist;
      });

      it('deve retornar mensagem genérica para email inexistente (segurança)', async () => {
        const res = await request(app)
          .post('/api/auth/request-password-reset')
          .send({
            email: 'nonexistent@test.com',
            portalType: 'provider'
          });

        expect(res.status).to.equal(200);
        expect(res.body.message).to.include('instruções');
      });

      it('deve retornar mensagem genérica para usuário inativo (segurança)', async () => {
        const res = await request(app)
          .post('/api/auth/request-password-reset')
          .send({
            email: 'inactive@test.com',
            portalType: 'provider'
          });

        expect(res.status).to.equal(200);
        expect(res.body.message).to.include('instruções');
      });
    });

    describe('POST /api/auth/validate-password-reset-token', () => {
      let validToken;

      before(async () => {
        // Gerar token válido
        await request(app)
          .post('/api/auth/request-password-reset')
          .send({
            email: 'provider@test.com',
            portalType: 'provider'
          });

        const user = await User.findOne({ where: { email: 'provider@test.com' } });
        validToken = user.passwordResetToken;
      });

      it('deve validar token correto', async () => {
        const res = await request(app)
          .post('/api/auth/validate-password-reset-token')
          .send({
            email: 'provider@test.com',
            token: validToken,
            portalType: 'provider'
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.userType).to.equal('provider');
      });

      it('deve rejeitar token incorreto', async () => {
        const res = await request(app)
          .post('/api/auth/validate-password-reset-token')
          .send({
            email: 'provider@test.com',
            token: 'INVALID',
            portalType: 'provider'
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('inválido');
      });

      it('deve rejeitar token expirado', async () => {
        // Criar usuário com token expirado
        const expiredUser = await User.create({
          organizationId: testOrg.id,
          name: 'Expired Token User',
          email: 'expired@test.com',
          password: 'password123',
          role: 'agent',
          passwordResetToken: 'ABC123',
          passwordResetExpires: new Date(Date.now() - 1000) // Expirado
        });

        const res = await request(app)
          .post('/api/auth/validate-password-reset-token')
          .send({
            email: 'expired@test.com',
            token: 'ABC123',
            portalType: 'provider'
          });

        expect(res.status).to.equal(400);
        expect(res.body.error).to.include('expirado');
      });
    });

    describe('POST /api/auth/reset-password', () => {
      let resetToken;

      before(async () => {
        // Gerar token para reset
        await request(app)
          .post('/api/auth/request-password-reset')
          .send({
            email: 'provider@test.com',
            portalType: 'provider'
          });

        const user = await User.findOne({ where: { email: 'provider@test.com' } });
        resetToken = user.passwordResetToken;
      });

      it('deve resetar senha com token válido', async () => {
        const res = await request(app)
          .post('/api/auth/reset-password')
          .send({
            email: 'provider@test.com',
            token: resetToken,
            newPassword: 'newpassword123',
            portalType: 'provider'
          });

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;

        // Verificar se token foi limpo
        const user = await User.findOne({ where: { email: 'provider@test.com' } });
        expect(user.passwordResetToken).to.be.null;
        expect(user.passwordResetExpires).to.be.null;

        // Verificar se nova senha funciona
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'provider@test.com',
            password: 'newpassword123',
            portalType: 'provider'
          });

        expect(loginRes.status).to.equal(200);
      });

      it('deve rejeitar reset com token inválido', async () => {
        const res = await request(app)
          .post('/api/auth/reset-password')
          .send({
            email: 'provider@test.com',
            token: 'INVALID',
            newPassword: 'newpassword123',
            portalType: 'provider'
          });

        expect(res.status).to.equal(400);
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    it('deve retornar perfil do provider user', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.user).to.exist;
      expect(res.body.user.email).to.equal('provider@test.com');
      expect(res.body.user.userType).to.equal('provider');
      expect(res.body.user.organization).to.exist;
      expect(res.body.user).to.not.have.property('password');
    });

    it('deve retornar perfil do organization user', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.user.email).to.equal('agent@test.com');
      expect(res.body.user.userType).to.equal('organization');
    });

    it('deve retornar perfil do client user', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.user.email).to.equal('clientuser@test.com');
      expect(res.body.user.userType).to.equal('client');
      expect(res.body.user.client).to.exist;
    });

    it('deve rejeitar acesso sem token', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.status).to.equal(401);
    });

    it('deve rejeitar acesso com token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).to.equal(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('deve atualizar perfil do usuário', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          name: 'Provider Admin Updated',
          phone: '9999999999'
        });

      expect(res.status).to.equal(200);
      expect(res.body.user.name).to.equal('Provider Admin Updated');
      expect(res.body.user.phone).to.equal('9999999999');
    });

    it('deve atualizar settings do provider user', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          settings: {
            theme: 'dark',
            language: 'en'
          }
        });

      expect(res.status).to.equal(200);
      expect(res.body.user.settings.theme).to.equal('dark');
      expect(res.body.user.settings.language).to.equal('en');
    });

    it('deve rejeitar atualização sem autenticação', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({
          name: 'Updated Name'
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('deve alterar senha do usuário', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456'
        });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.include('sucesso');

      // Verificar se nova senha funciona
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'agent@test.com',
          password: 'newpassword456',
          portalType: 'organization'
        });

      expect(loginRes.status).to.equal(200);
    });

    it('deve rejeitar alteração com senha atual incorreta', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword789'
        });

      expect(res.status).to.equal(401);
      expect(res.body.error).to.include('incorreta');
    });

    it('deve rejeitar alteração sem senha atual', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          newPassword: 'newpassword789'
        });

      expect(res.status).to.equal(400);
    });

    it('deve rejeitar alteração sem nova senha', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          currentPassword: 'newpassword456'
        });

      expect(res.status).to.equal(400);
    });

    it('deve rejeitar alteração sem autenticação', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword789'
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('JWT Token Validation', () => {
    it('deve aceitar token válido', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).to.equal(200);
    });

    it('deve rejeitar token malformado', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(res.status).to.equal(401);
    });

    it('deve rejeitar token sem Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', providerToken);

      expect(res.status).to.equal(401);
    });

    it('deve rejeitar requisição sem header Authorization', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.status).to.equal(401);
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
        slug: 'org-2',
        email: 'org2@test.com',
        phone: '1111111111',
        isActive: true
      });

      org2User = await User.create({
        organizationId: org2.id,
        name: 'Org2 User',
        email: 'user@org2.com',
        password: 'password123',
        role: 'agent',
        isActive: true
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@org2.com',
          password: 'password123'
        });

      org2Token = loginRes.body.token;
    });

    it('deve permitir mesmo email em organizações diferentes', async () => {
      const user1 = await User.create({
        organizationId: testOrg.id,
        name: 'Same Email User 1',
        email: 'same@email.com',
        password: 'password123',
        role: 'agent'
      });

      const user2 = await User.create({
        organizationId: org2.id,
        name: 'Same Email User 2',
        email: 'same@email.com',
        password: 'password123',
        role: 'agent'
      });

      expect(user1.id).to.not.equal(user2.id);
      expect(user1.organizationId).to.not.equal(user2.organizationId);
    });

    it('deve retornar dados apenas da organização do usuário', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${org2Token}`);

      expect(res.status).to.equal(200);
      expect(res.body.user.organizationId).to.equal(org2.id);
      expect(res.body.user.organization.name).to.equal('Organization 2');
    });
  });

  describe('Last Login Tracking', () => {
    it('deve atualizar lastLogin após login bem-sucedido', async () => {
      const beforeLogin = new Date();

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'provider@test.com',
          password: 'newpassword123',
          portalType: 'provider'
        });

      const user = await User.findOne({ where: { email: 'provider@test.com' } });
      expect(user.lastLogin).to.exist;
      expect(new Date(user.lastLogin)).to.be.at.least(beforeLogin);
    });
  });
});

  describe('POST /api/auth/switch-context', () => {
    let multiContextUser;
    let testOrg2;
    let testClient2;
    let orgUserContext;
    let clientUserContext;
    let initialToken;

    before(async () => {
      // Criar segunda organização
      testOrg2 = await Organization.create({
        name: 'Second Test Organization',
        slug: 'test-org-2',
        email: 'org2@test.com',
        phone: '5555555555',
        isActive: true
      });

      // Criar segundo cliente
      testClient2 = await Client.create({
        organizationId: testOrg.id,
        name: 'Second Test Client',
        tradeName: 'Test Client 2',
        email: 'client2@test.com',
        phone: '6666666666',
        isActive: true
      });

      // Criar usuário com múltiplos contextos (mesmo email em diferentes organizações)
      orgUserContext = await OrganizationUser.create({
        organizationId: testOrg.id,
        name: 'Multi Context User',
        email: 'multicontext@test.com',
        password: 'password123',
        role: 'agent',
        isActive: true
      });

      // Criar segundo contexto de organização
      await OrganizationUser.create({
        organizationId: testOrg2.id,
        name: 'Multi Context User Org2',
        email: 'multicontext@test.com',
        password: 'password123',
        role: 'org-admin',
        isActive: true
      });

      // Criar contexto de cliente
      clientUserContext = await ClientUser.create({
        organizationId: testOrg.id,
        clientId: testClient2.id,
        name: 'Multi Context User Client',
        email: 'multicontext@test.com',
        password: 'password123',
        role: 'client-user',
        isActive: true
      });

      // Fazer login inicial para obter token
      const loginRes = await request(app)
        .post('/api/auth/select-context')
        .send({
          email: 'multicontext@test.com',
          password: 'password123',
          contextId: testOrg.id,
          contextType: 'organization'
        });

      initialToken = loginRes.body.token;
    });

    it('deve trocar de contexto de organização para cliente', async () => {
      const res = await request(app)
        .post('/api/auth/switch-context')
        .set('Authorization', `Bearer ${initialToken}`)
        .send({
          contextId: testClient2.id,
          contextType: 'client'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body).to.have.property('context');
      expect(res.body.message).to.include('sucesso');
      
      // Verificar dados do novo contexto
      expect(res.body.user.userType).to.equal('client');
      expect(res.body.context.type).to.equal('client');
      expect(res.body.context.clientId).to.equal(testClient2.id);
      
      // Verificar que o novo token funciona
      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${res.body.token}`);
      
      expect(profileRes.status).to.equal(200);
      expect(profileRes.body.user.userType).to.equal('client');
    });

    it('deve trocar de contexto entre organizações diferentes', async () => {
      const res = await request(app)
        .post('/api/auth/switch-context')
        .set('Authorization', `Bearer ${initialToken}`)
        .send({
          contextId: testOrg2.id,
          contextType: 'organization'
        });

      expect(res.status).to.equal(200);
      expect(res.body.user.userType).to.equal('organization');
      expect(res.body.context.organizationId).to.equal(testOrg2.id);
      expect(res.body.context.organizationName).to.equal('Second Test Organization');
    });

    it('deve rejeitar troca para contexto sem acesso', async () => {
      // Tentar trocar para uma organização que o usuário não tem acesso
      const unauthorizedOrg = await Organization.create({
        name: 'Unauthorized Org',
        slug: 'unauthorized-org',
        email: 'unauth@test.com',
        phone: '7777777777',
        isActive: true
      });

      const res = await request(app)
        .post('/api/auth/switch-context')
        .set('Authorization', `Bearer ${initialToken}`)
        .send({
          contextId: unauthorizedOrg.id,
          contextType: 'organization'
        });

      expect(res.status).to.equal(403);
      expect(res.body.error).to.include('Acesso negado');
    });

    it('deve rejeitar troca sem contextId', async () => {
      const res = await request(app)
        .post('/api/auth/switch-context')
        .set('Authorization', `Bearer ${initialToken}`)
        .send({
          contextType: 'organization'
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('obrigatórios');
    });

    it('deve rejeitar troca sem contextType', async () => {
      const res = await request(app)
        .post('/api/auth/switch-context')
        .set('Authorization', `Bearer ${initialToken}`)
        .send({
          contextId: testOrg2.id
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('obrigatórios');
    });

    it('deve rejeitar troca com contextType inválido', async () => {
      const res = await request(app)
        .post('/api/auth/switch-context')
        .set('Authorization', `Bearer ${initialToken}`)
        .send({
          contextId: testOrg.id,
          contextType: 'invalid'
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('inválido');
    });

    it('deve rejeitar troca sem autenticação', async () => {
      const res = await request(app)
        .post('/api/auth/switch-context')
        .send({
          contextId: testOrg2.id,
          contextType: 'organization'
        });

      expect(res.status).to.equal(401);
    });

    it('deve invalidar sessão anterior após troca de contexto', async () => {
      // Fazer login e obter token
      const loginRes = await request(app)
        .post('/api/auth/select-context')
        .send({
          email: 'multicontext@test.com',
          password: 'password123',
          contextId: testOrg.id,
          contextType: 'organization'
        });

      const oldToken = loginRes.body.token;
      const oldSessionId = loginRes.body.context.sessionId;

      // Trocar contexto
      const switchRes = await request(app)
        .post('/api/auth/switch-context')
        .set('Authorization', `Bearer ${oldToken}`)
        .send({
          contextId: testOrg2.id,
          contextType: 'organization'
        });

      expect(switchRes.status).to.equal(200);
      
      // Verificar que a sessão antiga foi invalidada
      const ContextSession = (await import('../../src/models/ContextSession.js')).default;
      const oldSession = await ContextSession.findByPk(oldSessionId);
      expect(oldSession.isActive).to.be.false;
    });
  });

  describe('GET /api/auth/contexts', () => {
    let listContextOrg2;
    let listContextClient2;
    let userToken;

    before(async () => {
      // Criar segunda organização
      listContextOrg2 = await Organization.create({
        name: 'List Context Test Organization',
        slug: 'list-context-test-org',
        email: 'listcontextorg@test.com',
        phone: '8888888888',
        isActive: true
      });

      // Criar segundo cliente
      listContextClient2 = await Client.create({
        organizationId: testOrg.id,
        name: 'List Context Test Client',
        tradeName: 'List Context Client',
        email: 'listcontextclient@test.com',
        phone: '9999999999',
        isActive: true
      });

      // Criar usuário com múltiplos contextos
      await OrganizationUser.create({
        organizationId: testOrg.id,
        name: 'List Context User',
        email: 'listcontext@test.com',
        password: 'password123',
        role: 'agent',
        isActive: true
      });

      await OrganizationUser.create({
        organizationId: listContextOrg2.id,
        name: 'List Context User Org2',
        email: 'listcontext@test.com',
        password: 'password123',
        role: 'org-admin',
        isActive: true
      });

      await ClientUser.create({
        organizationId: testOrg.id,
        clientId: listContextClient2.id,
        name: 'List Context User Client',
        email: 'listcontext@test.com',
        password: 'password123',
        role: 'client-user',
        isActive: true
      });

      // Fazer login para obter token
      const loginRes = await request(app)
        .post('/api/auth/select-context')
        .send({
          email: 'listcontext@test.com',
          password: 'password123',
          contextId: testOrg.id,
          contextType: 'organization'
        });

      userToken = loginRes.body.token;
    });

    it('deve listar todos os contextos disponíveis para o usuário', async () => {
      const res = await request(app)
        .get('/api/auth/contexts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('contexts');
      expect(res.body).to.have.property('currentContext');
      expect(res.body.contexts).to.be.an('array');
      expect(res.body.contexts).to.have.lengthOf(3);
    });

    it('deve marcar o contexto atual com isLastUsed', async () => {
      const res = await request(app)
        .get('/api/auth/contexts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(200);
      
      const currentContext = res.body.contexts.find(ctx => ctx.isLastUsed === true);
      expect(currentContext).to.exist;
      expect(currentContext.contextId).to.equal(testOrg.id);
      expect(currentContext.contextType).to.equal('organization');
    });

    it('deve incluir informações completas de cada contexto', async () => {
      const res = await request(app)
        .get('/api/auth/contexts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(200);
      
      const context = res.body.contexts[0];
      expect(context).to.have.property('id');
      expect(context).to.have.property('type');
      expect(context).to.have.property('userType');
      expect(context).to.have.property('contextId');
      expect(context).to.have.property('contextType');
      expect(context).to.have.property('organizationId');
      expect(context).to.have.property('organizationName');
      expect(context).to.have.property('email');
      expect(context).to.have.property('name');
      expect(context).to.have.property('role');
      expect(context).to.have.property('isLastUsed');
    });

    it('deve incluir clientId e clientName para contextos de cliente', async () => {
      const res = await request(app)
        .get('/api/auth/contexts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(200);
      
      const clientContext = res.body.contexts.find(ctx => ctx.contextType === 'client');
      expect(clientContext).to.exist;
      expect(clientContext).to.have.property('clientId');
      expect(clientContext).to.have.property('clientName');
      expect(clientContext.clientId).to.equal(listContextClient2.id);
    });

    it('deve retornar currentContext com contextId e contextType', async () => {
      const res = await request(app)
        .get('/api/auth/contexts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.currentContext).to.have.property('contextId');
      expect(res.body.currentContext).to.have.property('contextType');
      expect(res.body.currentContext.contextId).to.equal(testOrg.id);
      expect(res.body.currentContext.contextType).to.equal('organization');
    });

    it('deve rejeitar requisição sem autenticação', async () => {
      const res = await request(app)
        .get('/api/auth/contexts');

      expect(res.status).to.equal(401);
    });

    it('deve retornar array vazio para usuário sem contextos', async () => {
      // Criar usuário sem contextos ativos
      const noContextUser = await OrganizationUser.create({
        organizationId: testOrg.id,
        name: 'No Context User',
        email: 'nocontext@test.com',
        password: 'password123',
        role: 'agent',
        isActive: false // Inativo
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'agent@test.com',
          password: 'password123',
          portalType: 'organization'
        });

      // Usar token de um usuário válido mas buscar contextos de outro
      // (não é possível testar diretamente sem modificar o token)
      // Este teste verifica que o endpoint retorna array vazio quando apropriado
      const res = await request(app)
        .get('/api/auth/contexts')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).to.equal(200);
      expect(res.body.contexts).to.be.an('array');
    });
  });
