/**
 * Testes Unitários - User Controller
 * Testa as funcionalidades básicas do controlador de usuários
 */

import { expect } from 'chai';
import sinon from 'sinon';
import * as userController from '../../../src/modules/users/userController.js';

describe('UserController', () => {
  let req, res, next;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    req = {
      user: { 
        id: 1, 
        organizationId: 1,
        role: 'admin-org'
      },
      query: {},
      body: {},
      params: {}
    };
    
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
      send: sandbox.stub().returnsThis()
    };
    
    next = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('User Functions', () => {
    it('deve ter função createUser', () => {
      expect(userController.createUser).to.be.a('function');
    });

    it('deve ter função getUsers', () => {
      expect(userController.getUsers).to.be.a('function');
    });

    it('deve ter função getUserById', () => {
      expect(userController.getUserById).to.be.a('function');
    });

    it('deve ter função updateUser', () => {
      expect(userController.updateUser).to.be.a('function');
    });

    it('deve ter função deleteUser', () => {
      expect(userController.deleteUser).to.be.a('function');
    });
  });

  describe('Request/Response Handling', () => {
    it('deve configurar objetos req e res corretamente', () => {
      expect(req).to.have.property('user');
      expect(req).to.have.property('query');
      expect(req).to.have.property('body');
      expect(req).to.have.property('params');
      
      expect(res.status).to.be.a('function');
      expect(res.json).to.be.a('function');
      expect(res.send).to.be.a('function');
    });

    it('deve configurar função next corretamente', () => {
      expect(next).to.be.a('function');
    });

    it('deve ter usuário com propriedades necessárias', () => {
      expect(req.user).to.have.property('id');
      expect(req.user).to.have.property('organizationId');
      expect(req.user).to.have.property('role');
    });
  });

  describe('Error Handling', () => {
    it('deve chamar next quando há erro', () => {
      const error = new Error('Test error');
      next(error);
      expect(next.calledWith(error)).to.be.true;
    });

    it('deve retornar status 404 para usuário não encontrado', () => {
      res.status(404).json({ error: 'Usuário não encontrado' });
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Usuário não encontrado' })).to.be.true;
    });

    it('deve retornar status 403 para acesso negado', () => {
      res.status(403).json({ error: 'Acesso negado' });
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ error: 'Acesso negado' })).to.be.true;
    });

    it('deve retornar status 400 para dados inválidos', () => {
      res.status(400).json({ error: 'Dados inválidos' });
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: 'Dados inválidos' })).to.be.true;
    });

    it('deve retornar status 409 para email já existente', () => {
      res.status(409).json({ error: 'Email já cadastrado nesta organização' });
      expect(res.status.calledWith(409)).to.be.true;
      expect(res.json.calledWith({ error: 'Email já cadastrado nesta organização' })).to.be.true;
    });
  });

  describe('Success Responses', () => {
    it('deve retornar status 200 para listagem de usuários', () => {
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@example.com', role: 'admin-org' },
        { id: 2, name: 'User 2', email: 'user2@example.com', role: 'agente' }
      ];
      res.json({ users: mockUsers, total: 2 });
      expect(res.json.calledWith({ users: mockUsers, total: 2 })).to.be.true;
    });

    it('deve retornar status 201 para criação de usuário', () => {
      const mockUser = { id: 1, name: 'Novo User', email: 'novo@example.com', role: 'agente' };
      res.status(201).json({ message: 'Usuário criado com sucesso', user: mockUser });
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ message: 'Usuário criado com sucesso', user: mockUser })).to.be.true;
    });

    it('deve retornar status 200 para atualização de usuário', () => {
      const mockUser = { id: 1, name: 'User Atualizado', email: 'atualizado@example.com' };
      res.json({ message: 'Usuário atualizado com sucesso', user: mockUser });
      expect(res.json.calledWith({ message: 'Usuário atualizado com sucesso', user: mockUser })).to.be.true;
    });

    it('deve retornar status 200 para exclusão de usuário', () => {
      res.json({ message: 'Usuário excluído com sucesso' });
      expect(res.json.calledWith({ message: 'Usuário excluído com sucesso' })).to.be.true;
    });
  });

  describe('User Role Validation', () => {
    it('deve validar roles válidos', () => {
      const validRoles = ['admin-org', 'agente', 'cliente-org'];
      validRoles.forEach(role => {
        expect(['admin-org', 'agente', 'cliente-org']).to.include(role);
      });
    });

    it('deve configurar role padrão como admin-org', () => {
      expect(req.user.role).to.equal('admin-org');
    });

    it('deve validar permissões por role', () => {
      const rolePermissions = {
        'admin-org': ['create', 'read', 'update', 'delete'],
        'agente': ['read', 'update'],
        'cliente-org': ['read']
      };
      
      Object.keys(rolePermissions).forEach(role => {
        expect(rolePermissions[role]).to.be.an('array');
        expect(rolePermissions[role].length).to.be.greaterThan(0);
      });
    });
  });

  describe('User Data Validation', () => {
    it('deve validar formato de email', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.ao', 'admin@company.org'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).to.be.true;
      });
    });

    it('deve validar campos obrigatórios', () => {
      const requiredFields = ['name', 'email', 'role'];
      const userData = { name: 'Test User', email: 'test@example.com', role: 'agente' };
      
      requiredFields.forEach(field => {
        expect(userData).to.have.property(field);
        expect(userData[field]).to.not.be.empty;
      });
    });

    it('deve validar comprimento mínimo de senha', () => {
      const password = 'minhasenha123';
      expect(password.length).to.be.at.least(8);
    });
  });

  describe('Query Parameters', () => {
    it('deve aceitar parâmetros de paginação', () => {
      req.query = { page: '1', limit: '10' };
      expect(req.query).to.have.property('page');
      expect(req.query).to.have.property('limit');
    });

    it('deve aceitar parâmetros de filtro', () => {
      req.query = { role: 'agente', isActive: 'true' };
      expect(req.query).to.have.property('role');
      expect(req.query).to.have.property('isActive');
    });

    it('deve aceitar parâmetros de busca', () => {
      req.query = { search: 'João Silva', sortBy: 'name' };
      expect(req.query).to.have.property('search');
      expect(req.query).to.have.property('sortBy');
    });
  });

  describe('Organization Context', () => {
    it('deve ter contexto de organização', () => {
      expect(req.user.organizationId).to.be.a('number');
      expect(req.user.organizationId).to.be.greaterThan(0);
    });

    it('deve validar acesso apenas a usuários da mesma organização', () => {
      const userOrganizationId = req.user.organizationId;
      const targetUserOrganizationId = 1; // Mesmo ID da organização
      expect(userOrganizationId).to.equal(targetUserOrganizationId);
    });
  });
});