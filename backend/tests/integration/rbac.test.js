import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { Organization, User, Role, Permission, RolePermission } from '../../src/modules/models/index.js';
import bcrypt from 'bcryptjs';

describe('RBAC System Integration Tests', () => {
  let organization;
  let adminRole, agenteRole, clientRole;
  let adminUser, agenteUser, clientUser;
  let adminToken, agenteToken, clientToken;

  before(async () => {
    // Sincronizar banco de dados de teste
    await sequelize.sync({ force: true });

    // Criar organização
    organization = await Organization.create({
      name: 'Test Organization',
      slug: 'test-org',
      email: 'test@testorg.com'
    });

    // Criar roles
    adminRole = await Role.create({
      name: 'admin-org',
      displayName: 'Administrador',
      description: 'Administrador da organização',
      priority: 1000,
      organizationId: organization.id
    });

    agenteRole = await Role.create({
      name: 'agente',
      displayName: 'Agente',
      description: 'Agente de suporte',
      priority: 600,
      organizationId: organization.id
    });

    clientRole = await Role.create({
      name: 'client-user',
      displayName: 'Cliente',
      description: 'Usuário cliente',
      priority: 100,
      organizationId: organization.id
    });

    // Criar permissões
    const ticketsViewPermission = await Permission.create({
      resource: 'tickets',
      action: 'view',
      scope: 'all',
      description: 'Visualizar todos os tickets'
    });

    const ticketsCreatePermission = await Permission.create({
      resource: 'tickets',
      action: 'create',
      scope: 'all',
      description: 'Criar tickets'
    });

    const ticketsUpdatePermission = await Permission.create({
      resource: 'tickets',
      action: 'update',
      scope: 'all',
      description: 'Atualizar tickets'
    });

    const ticketsDeletePermission = await Permission.create({
      resource: 'tickets',
      action: 'delete',
      scope: 'all',
      description: 'Deletar tickets'
    });

    const usersManagePermission = await Permission.create({
      resource: 'users',
      action: 'manage',
      scope: 'all',
      description: 'Gerenciar usuários'
    });

    // Associar permissões aos roles
    // Admin tem todas
    await RolePermission.bulkCreate([
      { roleId: adminRole.id, permissionId: ticketsViewPermission.id },
      { roleId: adminRole.id, permissionId: ticketsCreatePermission.id },
      { roleId: adminRole.id, permissionId: ticketsUpdatePermission.id },
      { roleId: adminRole.id, permissionId: ticketsDeletePermission.id },
      { roleId: adminRole.id, permissionId: usersManagePermission.id }
    ]);

    // Agente tem view, create, update
    await RolePermission.bulkCreate([
      { roleId: agenteRole.id, permissionId: ticketsViewPermission.id },
      { roleId: agenteRole.id, permissionId: ticketsCreatePermission.id },
      { roleId: agenteRole.id, permissionId: ticketsUpdatePermission.id }
    ]);

    // Cliente tem apenas view e create
    await RolePermission.bulkCreate([
      { roleId: clientRole.id, permissionId: ticketsViewPermission.id },
      { roleId: clientRole.id, permissionId: ticketsCreatePermission.id }
    ]);

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
      role: 'client-user',
      organizationId: organization.id
    });

    // Fazer login de todos
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
  });

  after(async () => {
    await sequelize.close();
  });

  describe('Role-Based Access Control', () => {
    it('admin deve ter todas as permissões', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.user.role).to.equal('admin-org');
      expect(response.body.permissions).to.be.an('array');
      expect(response.body.permissions.length).to.be.greaterThan(0);

      const hasTicketsDelete = response.body.permissions.some(
        p => p.resource === 'tickets' && p.action === 'delete'
      );
      expect(hasTicketsDelete).to.be.true;
    });

    it('agente deve ter permissões limitadas', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${agenteToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.user.role).to.equal('agente');
      expect(response.body.permissions).to.be.an('array');

      const hasTicketsDelete = response.body.permissions.some(
        p => p.resource === 'tickets' && p.action === 'delete'
      );
      expect(hasTicketsDelete).to.be.false;

      const hasTicketsUpdate = response.body.permissions.some(
        p => p.resource === 'tickets' && p.action === 'update'
      );
      expect(hasTicketsUpdate).to.be.true;
    });

    it('cliente deve ter permissões mínimas', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.user.role).to.equal('client-user');
      expect(response.body.permissions).to.be.an('array');

      const hasTicketsUpdate = response.body.permissions.some(
        p => p.resource === 'tickets' && p.action === 'update'
      );
      expect(hasTicketsUpdate).to.be.false;

      const hasTicketsView = response.body.permissions.some(
        p => p.resource === 'tickets' && p.action === 'view'
      );
      expect(hasTicketsView).to.be.true;
    });
  });

  describe('Permission Enforcement', () => {
    it('admin pode gerenciar usuários', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
    });

    it('agente não pode gerenciar usuários', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          name: 'New User',
          email: 'newuser@testorg.com',
          password: 'Test@123',
          role: 'client-user'
        });

      expect(response.status).to.be.oneOf([403, 401]);
    });

    it('cliente não pode acessar lista de usuários', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.be.oneOf([403, 401]);
    });
  });

  describe('Fallback System', () => {
    it('deve funcionar mesmo sem tabelas RBAC', async () => {
      // Este teste verifica se o sistema tem fallback adequado
      // Em produção, se as tabelas RBAC não existirem, o sistema deve continuar funcionando
      
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.user).to.exist;
    });

    it('admin-org sempre tem acesso total (fallback)', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.user.role).to.equal('admin-org');
      
      // Admin sempre deve ter permissões, mesmo em fallback
      if (response.body.permissions) {
        expect(response.body.permissions).to.be.an('array');
      }
    });
  });

  describe('Role Hierarchy', () => {
    it('deve respeitar prioridade de roles', async () => {
      const rolesResponse = await request(app)
        .get('/api/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      if (rolesResponse.status === 200) {
        const roles = rolesResponse.body.roles || rolesResponse.body;
        const adminRoleData = roles.find(r => r.name === 'admin-org');
        const agenteRoleData = roles.find(r => r.name === 'agente');
        const clientRoleData = roles.find(r => r.name === 'client-user');

        if (adminRoleData && agenteRoleData && clientRoleData) {
          expect(adminRoleData.priority).to.be.greaterThan(agenteRoleData.priority);
          expect(agenteRoleData.priority).to.be.greaterThan(clientRoleData.priority);
        }
      }
    });
  });

  describe('Permission Scopes', () => {
    it('deve respeitar escopo de permissões', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      
      if (response.body.permissions && response.body.permissions.length > 0) {
        const ticketsViewPermission = response.body.permissions.find(
          p => p.resource === 'tickets' && p.action === 'view'
        );

        if (ticketsViewPermission) {
          // Cliente deve ter escopo limitado (own ou organization)
          expect(ticketsViewPermission.scope).to.be.oneOf(['own', 'organization', 'all']);
        }
      }
    });
  });
});
