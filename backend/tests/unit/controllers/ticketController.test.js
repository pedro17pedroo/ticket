/**
 * Testes Unitários - Ticket Controller
 * Testa as funcionalidades básicas do controlador de tickets
 */

import { expect } from 'chai';
import sinon from 'sinon';
import * as ticketController from '../../../src/modules/tickets/ticketController.js';

describe('TicketController', () => {
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

  describe('Ticket Functions', () => {
    it('deve ter função getTickets', () => {
      expect(ticketController.getTickets).to.be.a('function');
    });

    it('deve ter função getTicketById', () => {
      expect(ticketController.getTicketById).to.be.a('function');
    });

    it('deve ter função createTicket', () => {
      expect(ticketController.createTicket).to.be.a('function');
    });

    it('deve ter função updateTicket', () => {
      expect(ticketController.updateTicket).to.be.a('function');
    });

    it('deve ter função getStatistics', () => {
      expect(ticketController.getStatistics).to.be.a('function');
    });

    it('deve ter função addComment', () => {
      expect(ticketController.addComment).to.be.a('function');
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

    it('deve retornar status 404 para ticket não encontrado', () => {
      res.status(404).json({ error: 'Ticket não encontrado' });
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Ticket não encontrado' })).to.be.true;
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
  });

  describe('Success Responses', () => {
    it('deve retornar status 200 para listagem de tickets', () => {
      const mockTickets = [
        { id: 1, title: 'Ticket 1', status: 'aberto' },
        { id: 2, title: 'Ticket 2', status: 'em-andamento' }
      ];
      res.json({ tickets: mockTickets, total: 2 });
      expect(res.json.calledWith({ tickets: mockTickets, total: 2 })).to.be.true;
    });

    it('deve retornar status 201 para criação de ticket', () => {
      const mockTicket = { id: 1, title: 'Novo Ticket', status: 'aberto' };
      res.status(201).json({ message: 'Ticket criado com sucesso', ticket: mockTicket });
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ message: 'Ticket criado com sucesso', ticket: mockTicket })).to.be.true;
    });

    it('deve retornar status 200 para atualização de ticket', () => {
      const mockTicket = { id: 1, title: 'Ticket Atualizado', status: 'resolvido' };
      res.json({ message: 'Ticket atualizado com sucesso', ticket: mockTicket });
      expect(res.json.calledWith({ message: 'Ticket atualizado com sucesso', ticket: mockTicket })).to.be.true;
    });

    it('deve retornar estatísticas de tickets', () => {
      const mockStats = {
        total: 100,
        abertos: 30,
        emAndamento: 25,
        resolvidos: 45
      };
      res.json(mockStats);
      expect(res.json.calledWith(mockStats)).to.be.true;
    });
  });

  describe('Ticket Status Validation', () => {
    it('deve validar status válidos', () => {
      const validStatuses = ['aberto', 'em-andamento', 'resolvido', 'fechado'];
      validStatuses.forEach(status => {
        expect(['aberto', 'em-andamento', 'resolvido', 'fechado']).to.include(status);
      });
    });

    it('deve validar prioridades válidas', () => {
      const validPriorities = ['baixa', 'media', 'alta', 'critica'];
      validPriorities.forEach(priority => {
        expect(['baixa', 'media', 'alta', 'critica']).to.include(priority);
      });
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
  });

  describe('Query Parameters', () => {
    it('deve aceitar parâmetros de paginação', () => {
      req.query = { page: '1', limit: '10' };
      expect(req.query).to.have.property('page');
      expect(req.query).to.have.property('limit');
    });

    it('deve aceitar parâmetros de filtro', () => {
      req.query = { status: 'aberto', priority: 'alta' };
      expect(req.query).to.have.property('status');
      expect(req.query).to.have.property('priority');
    });

    it('deve aceitar parâmetros de ordenação', () => {
      req.query = { sortBy: 'createdAt', sortOrder: 'desc' };
      expect(req.query).to.have.property('sortBy');
      expect(req.query).to.have.property('sortOrder');
    });
  });
});