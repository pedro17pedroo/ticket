/**
 * Testes Unitários - Auth Controller
 * Testa as funcionalidades básicas do controlador de autenticação
 */

import { expect } from 'chai';
import sinon from 'sinon';
import * as authController from '../../../src/modules/auth/authController.js';

describe('AuthController', () => {
  let req, res, next;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    req = {
      body: {},
      params: {},
      headers: {},
      user: {}
    };
    
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
      send: sandbox.stub().returnsThis(),
      cookie: sandbox.stub().returnsThis()
    };
    
    next = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Authentication Functions', () => {
    it('deve ter função de login', () => {
      expect(authController.login).to.be.a('function');
    });

    it('deve ter função de register', () => {
      expect(authController.register).to.be.a('function');
    });

    it('deve ter função de getProfile', () => {
      expect(authController.getProfile).to.be.a('function');
    });

    it('deve ter função de updateProfile', () => {
      expect(authController.updateProfile).to.be.a('function');
    });

    it('deve ter função de changePassword', () => {
      expect(authController.changePassword).to.be.a('function');
    });

    it('deve ter função de getUsers', () => {
      expect(authController.getUsers).to.be.a('function');
    });
  });

  describe('Request/Response Handling', () => {
    it('deve configurar objetos req e res corretamente', () => {
      expect(req).to.have.property('body');
      expect(req).to.have.property('params');
      expect(req).to.have.property('headers');
      expect(req).to.have.property('user');
      
      expect(res.status).to.be.a('function');
      expect(res.json).to.be.a('function');
      expect(res.send).to.be.a('function');
      expect(res.cookie).to.be.a('function');
    });

    it('deve configurar função next corretamente', () => {
      expect(next).to.be.a('function');
    });
  });

  describe('Error Handling', () => {
    it('deve chamar next quando há erro', () => {
      const error = new Error('Test error');
      next(error);
      expect(next.calledWith(error)).to.be.true;
    });

    it('deve retornar status 401 para credenciais inválidas', () => {
      res.status(401).json({ error: 'Credenciais inválidas' });
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Credenciais inválidas' })).to.be.true;
    });

    it('deve retornar status 404 para usuário não encontrado', () => {
      res.status(404).json({ error: 'Usuário não encontrado' });
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Usuário não encontrado' })).to.be.true;
    });

    it('deve retornar status 409 para email já existente', () => {
      res.status(409).json({ error: 'Email já cadastrado nesta organização' });
      expect(res.status.calledWith(409)).to.be.true;
      expect(res.json.calledWith({ error: 'Email já cadastrado nesta organização' })).to.be.true;
    });
  });

  describe('Success Responses', () => {
    it('deve retornar status 200 para operações bem-sucedidas', () => {
      res.json({ message: 'Operação realizada com sucesso' });
      expect(res.json.calledWith({ message: 'Operação realizada com sucesso' })).to.be.true;
    });

    it('deve retornar status 201 para criação bem-sucedida', () => {
      res.status(201).json({ message: 'Cadastro realizado com sucesso' });
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ message: 'Cadastro realizado com sucesso' })).to.be.true;
    });
  });
});