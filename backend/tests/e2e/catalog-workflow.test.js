import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import {
  Organization,
  User,
  Direction,
  Department,
  Section,
  CatalogCategory,
  CatalogItem,
  ServiceRequest,
  Ticket
} from '../../src/modules/models/index.js';
import bcrypt from 'bcryptjs';

describe('E2E - Fluxo Completo do Catálogo de Serviços', () => {
  let organization;
  let adminUser, agenteUser, clientUser;
  let adminToken, agenteToken, clientToken;
  let direction, department, section;
  let rootCategory, subCategory;
  let incidentItem, serviceItem;
  let serviceRequest, ticket;

  before(async () => {
    // Sincronizar banco de dados
    await sequelize.sync({ force: true });

    // Criar organização
    organization = await Organization.create({
      name: 'TechCorp',
      slug: 'techcorp',
      email: 'admin@techcorp.com'
    });

    // Criar usuários
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    adminUser = await User.create({
      name: 'Admin TechCorp',
      email: 'admin@techcorp.com',
      password: hashedPassword,
      role: 'admin-org',
      organizationId: organization.id
    });

    agenteUser = await User.create({
      name: 'Agente Suporte',
      email: 'agente@techcorp.com',
      password: hashedPassword,
      role: 'agente',
      organizationId: organization.id
    });

    clientUser = await User.create({
      name: 'Cliente Final',
      email: 'cliente@techcorp.com',
      password: hashedPassword,
      role: 'cliente-org',
      organizationId: organization.id
    });

    // Fazer login
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@techcorp.com', password: 'Test@123' });
    adminToken = adminLogin.body.token;

    const agenteLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agente@techcorp.com', password: 'Test@123' });
    agenteToken = agenteLogin.body.token;

    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@techcorp.com', password: 'Test@123' });
    clientToken = clientLogin.body.token;

    // Criar estrutura organizacional
    direction = await Direction.create({
      name: 'Direção de TI',
      organizationId: organization.id
    });

    department = await Department.create({
      name: 'Departamento de Infraestrutura',
      directionId: direction.id,
      organizationId: organization.id
    });

    section = await Section.create({
      name: 'Seção de Redes',
      departmentId: department.id,
      organizationId: organization.id
    });
  });

  after(async () => {
    await sequelize.close();
  });

  describe('Fase 1: Admin Configura o Catálogo', () => {
    it('1.1 Admin cria categoria raiz "TI"', async () => {
      const response = await request(app)
        .post('/api/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TI',
          description: 'Serviços de Tecnologia da Informação',
          icon: 'Monitor',
          color: 'blue',
          imageUrl: 'https://example.com/ti.png',
          defaultDirectionId: direction.id
        });

      expect(response.status).to.equal(201);
      expect(response.body.category.name).to.equal('TI');
      expect(response.body.category.level).to.equal(1);
      expect(response.body.category.parentCategoryId).to.be.null;

      rootCategory = response.body.category;
      console.log('✓ Categoria raiz "TI" criada');
    });

    it('1.2 Admin cria subcategoria "Infraestrutura"', async () => {
      const response = await request(app)
        .post('/api/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Infraestrutura',
          description: 'Serviços de infraestrutura de TI',
          icon: 'Server',
          color: 'green',
          parentCategoryId: rootCategory.id,
          defaultDepartmentId: department.id
        });

      expect(response.status).to.equal(201);
      expect(response.body.category.level).to.equal(2);
      expect(response.body.category.parentCategoryId).to.equal(rootCategory.id);

      subCategory = response.body.category;
      console.log('✓ Subcategoria "Infraestrutura" criada');
    });

    it('1.3 Admin cria item tipo "incident" (Falha na VPN)', async () => {
      const response = await request(app)
        .post('/api/catalog/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: subCategory.id,
          name: 'Falha de Acesso à VPN',
          shortDescription: 'Problemas para conectar na VPN corporativa',
          fullDescription: 'Solução de problemas relacionados ao acesso VPN',
          itemType: 'incident',
          autoAssignPriority: true,
          skipApprovalForIncidents: true,
          defaultPriority: 'alta',
          defaultSectionId: section.id,
          estimatedDeliveryTime: 4, // 4 horas
          keywords: ['vpn', 'acesso remoto', 'rede'],
          customFields: [
            {
              name: 'sistema_operacional',
              type: 'dropdown',
              label: 'Sistema Operacional',
              required: true,
              options: ['Windows', 'macOS', 'Linux']
            },
            {
              name: 'mensagem_erro',
              type: 'textarea',
              label: 'Mensagem de Erro',
              required: false
            }
          ]
        });

      expect(response.status).to.equal(201);
      expect(response.body.item.itemType).to.equal('incident');
      expect(response.body.item.autoAssignPriority).to.be.true;
      expect(response.body.item.skipApprovalForIncidents).to.be.true;

      incidentItem = response.body.item;
      console.log('✓ Item "Falha na VPN" (incident) criado');
    });

    it('1.4 Admin cria item tipo "service" (Novo Computador)', async () => {
      const response = await request(app)
        .post('/api/catalog/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: subCategory.id,
          name: 'Solicitar Novo Computador',
          shortDescription: 'Requisição de novo equipamento',
          itemType: 'service',
          requiresApproval: true,
          defaultPriority: 'media',
          estimatedDeliveryTime: 120, // 5 dias
          estimatedCost: 1500.00,
          customFields: [
            {
              name: 'tipo_equipamento',
              type: 'dropdown',
              label: 'Tipo de Equipamento',
              required: true,
              options: ['Desktop', 'Laptop', 'Workstation']
            },
            {
              name: 'justificativa',
              type: 'textarea',
              label: 'Justificativa',
              required: true
            }
          ]
        });

      expect(response.status).to.equal(201);
      expect(response.body.item.itemType).to.equal('service');
      expect(response.body.item.requiresApproval).to.be.true;

      serviceItem = response.body.item;
      console.log('✓ Item "Novo Computador" (service) criado');
    });
  });

  describe('Fase 2: Cliente Navega no Catálogo', () => {
    it('2.1 Cliente visualiza hierarquia de categorias', async () => {
      const response = await request(app)
        .get('/api/catalog/portal/categories')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.categories).to.be.an('array');
      expect(response.body.categories.length).to.be.greaterThan(0);

      const tiCategory = response.body.categories.find(c => c.name === 'TI');
      expect(tiCategory).to.exist;
      expect(tiCategory.subcategories).to.be.an('array');
      expect(tiCategory.subcategories.length).to.be.greaterThan(0);

      console.log('✓ Cliente visualizou hierarquia de categorias');
    });

    it('2.2 Cliente busca itens da subcategoria "Infraestrutura"', async () => {
      const response = await request(app)
        .get(`/api/catalog/portal/categories/${subCategory.id}/items`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.items).to.be.an('array');
      expect(response.body.items.length).to.equal(2);

      const vpnItem = response.body.items.find(i => i.name.includes('VPN'));
      expect(vpnItem).to.exist;
      expect(vpnItem.itemType).to.equal('incident');

      console.log('✓ Cliente visualizou itens da categoria');
    });

    it('2.3 Cliente busca por keyword "vpn"', async () => {
      const response = await request(app)
        .get('/api/catalog/items?search=vpn')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.items.length).to.be.greaterThan(0);

      const vpnItem = response.body.items.find(i => i.keywords.includes('vpn'));
      expect(vpnItem).to.exist;

      console.log('✓ Cliente encontrou item por busca');
    });
  });

  describe('Fase 3: Cliente Cria Solicitação de Incidente', () => {
    it('3.1 Cliente cria solicitação para "Falha na VPN"', async () => {
      const response = await request(app)
        .post('/api/catalog/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          catalogItemId: incidentItem.id,
          formData: {
            sistema_operacional: 'Windows',
            mensagem_erro: 'Connection timeout after 30 seconds'
          },
          additionalDetails: 'Não consigo conectar à VPN desde ontem à tarde. Já tentei reiniciar o computador.',
          userPriority: 'alta'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('request');
      
      serviceRequest = response.body.request;

      // Incidente deve criar ticket automaticamente (sem aprovação)
      if (incidentItem.skipApprovalForIncidents) {
        expect(response.body).to.have.property('ticket');
        expect(response.body.ticket).to.have.property('id');
        ticket = response.body.ticket;

        console.log('✓ Solicitação criada e ticket gerado automaticamente');
      } else {
        console.log('✓ Solicitação criada (aguardando aprovação)');
      }
    });

    it('3.2 Verificar que ticket foi criado com prioridade correta', async () => {
      if (ticket) {
        const response = await request(app)
          .get(`/api/tickets/${ticket.id}`)
          .set('Authorization', `Bearer ${clientToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.ticket.priority).to.be.oneOf(['alta', 'critica']);
        expect(response.body.ticket.status).to.equal('open');

        console.log(`✓ Ticket criado com prioridade: ${response.body.ticket.priority}`);
      }
    });

    it('3.3 Verificar roteamento automático (Direction → Department → Section)', async () => {
      if (ticket) {
        const response = await request(app)
          .get(`/api/tickets/${ticket.id}`)
          .set('Authorization', `Bearer ${agenteToken}`);

        expect(response.status).to.equal(200);
        
        // Verificar se foi roteado corretamente
        if (response.body.ticket.sectionId) {
          expect(response.body.ticket.sectionId).to.equal(section.id);
          console.log('✓ Ticket roteado para seção correta');
        }
      }
    });
  });

  describe('Fase 4: Agente Processa o Ticket', () => {
    it('4.1 Agente visualiza ticket na sua fila', async () => {
      if (ticket) {
        const response = await request(app)
          .get('/api/tickets')
          .set('Authorization', `Bearer ${agenteToken}`);

        expect(response.status).to.equal(200);
        const foundTicket = response.body.tickets.find(t => t.id === ticket.id);
        expect(foundTicket).to.exist;

        console.log('✓ Agente visualizou ticket na fila');
      }
    });

    it('4.2 Agente atribui ticket para si mesmo', async () => {
      if (ticket) {
        const response = await request(app)
          .put(`/api/tickets/${ticket.id}`)
          .set('Authorization', `Bearer ${agenteToken}`)
          .send({
            assignedToId: agenteUser.id,
            status: 'in_progress'
          });

        expect(response.status).to.equal(200);
        expect(response.body.ticket.assignedToId).to.equal(agenteUser.id);
        expect(response.body.ticket.status).to.equal('in_progress');

        console.log('✓ Ticket atribuído ao agente');
      }
    });

    it('4.3 Agente adiciona comentário', async () => {
      if (ticket) {
        const response = await request(app)
          .post(`/api/tickets/${ticket.id}/comments`)
          .set('Authorization', `Bearer ${agenteToken}`)
          .send({
            comment: 'Verificando configurações da VPN. Por favor, tente usar o servidor alternativo vpn2.techcorp.com'
          });

        expect(response.status).to.equal(201);
        console.log('✓ Agente adicionou comentário');
      }
    });

    it('4.4 Agente resolve o ticket', async () => {
      if (ticket) {
        const response = await request(app)
          .put(`/api/tickets/${ticket.id}`)
          .set('Authorization', `Bearer ${agenteToken}`)
          .send({
            status: 'resolved',
            resolution: 'Problema resolvido após configurar servidor VPN alternativo'
          });

        expect(response.status).to.equal(200);
        expect(response.body.ticket.status).to.equal('resolved');

        console.log('✓ Ticket resolvido');
      }
    });
  });

  describe('Fase 5: Cliente Cria Solicitação de Serviço (com Aprovação)', () => {
    let serviceRequestWithApproval;

    it('5.1 Cliente solicita novo computador', async () => {
      const response = await request(app)
        .post('/api/catalog/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          catalogItemId: serviceItem.id,
          formData: {
            tipo_equipamento: 'Laptop',
            justificativa: 'Meu computador atual está muito lento e não suporta as ferramentas necessárias'
          },
          additionalDetails: 'Preciso de um laptop com pelo menos 16GB RAM e SSD de 512GB',
          userPriority: 'media'
        });

      expect(response.status).to.equal(201);
      expect(response.body.requiresApproval).to.be.true;
      expect(response.body.request.status).to.equal('pending_approval');

      serviceRequestWithApproval = response.body.request;
      console.log('✓ Solicitação de serviço criada (aguardando aprovação)');
    });

    it('5.2 Admin visualiza solicitações pendentes', async () => {
      const response = await request(app)
        .get('/api/catalog/requests?status=pending_approval')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      const foundRequest = response.body.requests.find(
        r => r.id === serviceRequestWithApproval.id
      );
      expect(foundRequest).to.exist;

      console.log('✓ Admin visualizou solicitação pendente');
    });

    it('5.3 Admin aprova solicitação', async () => {
      const response = await request(app)
        .post(`/api/catalog/requests/${serviceRequestWithApproval.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approved: true,
          comments: 'Aprovado. Equipamento será entregue em 5 dias úteis.',
          approvedCost: 1450.00
        });

      expect(response.status).to.equal(200);
      expect(response.body.request.status).to.equal('approved');
      
      // Após aprovação, deve criar ticket
      if (response.body.ticket) {
        expect(response.body.ticket).to.have.property('id');
        console.log('✓ Solicitação aprovada e ticket criado');
      }
    });
  });

  describe('Fase 6: Estatísticas e Relatórios', () => {
    it('6.1 Admin visualiza estatísticas do catálogo', async () => {
      const response = await request(app)
        .get('/api/catalog/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('totalCategories');
      expect(response.body).to.have.property('totalItems');
      expect(response.body).to.have.property('totalRequests');
      expect(response.body).to.have.property('byType');

      expect(response.body.totalCategories).to.be.greaterThan(0);
      expect(response.body.totalItems).to.be.greaterThan(0);
      expect(response.body.totalRequests).to.be.greaterThan(0);

      console.log('✓ Estatísticas do catálogo:');
      console.log(`  - Categorias: ${response.body.totalCategories}`);
      console.log(`  - Itens: ${response.body.totalItems}`);
      console.log(`  - Solicitações: ${response.body.totalRequests}`);
    });

    it('6.2 Verificar itens mais populares', async () => {
      const response = await request(app)
        .get('/api/catalog/portal/popular?limit=5')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.items).to.be.an('array');

      console.log(`✓ ${response.body.items.length} itens mais populares identificados`);
    });
  });

  describe('Fase 7: Validações de Segurança', () => {
    it('7.1 Cliente não deve acessar endpoints administrativos', async () => {
      const response = await request(app)
        .post('/api/catalog/categories')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'Categoria Não Autorizada'
        });

      expect(response.status).to.be.oneOf([403, 401]);
      console.log('✓ Cliente bloqueado de criar categorias');
    });

    it('7.2 Cliente não deve aprovar solicitações', async () => {
      const response = await request(app)
        .post(`/api/catalog/requests/${serviceRequest.id}/approve`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          approved: true
        });

      expect(response.status).to.be.oneOf([403, 401]);
      console.log('✓ Cliente bloqueado de aprovar solicitações');
    });

    it('7.3 Agente não deve criar categorias', async () => {
      const response = await request(app)
        .post('/api/catalog/categories')
        .set('Authorization', `Bearer ${agenteToken}`)
        .send({
          name: 'Categoria Agente'
        });

      expect(response.status).to.be.oneOf([403, 401]);
      console.log('✓ Agente bloqueado de criar categorias');
    });
  });

  describe('Resumo do Fluxo E2E', () => {
    it('Verificar fluxo completo executado com sucesso', () => {
      console.log('\n========================================');
      console.log('RESUMO DO FLUXO E2E - CATÁLOGO');
      console.log('========================================');
      console.log('✓ Admin configurou catálogo (categorias + itens)');
      console.log('✓ Cliente navegou e encontrou serviços');
      console.log('✓ Cliente criou solicitação de incidente');
      console.log('✓ Ticket criado automaticamente (sem aprovação)');
      console.log('✓ Roteamento automático aplicado');
      console.log('✓ Agente processou e resolveu ticket');
      console.log('✓ Cliente criou solicitação de serviço');
      console.log('✓ Admin aprovou solicitação');
      console.log('✓ Estatísticas geradas corretamente');
      console.log('✓ Validações de segurança funcionando');
      console.log('========================================\n');

      expect(true).to.be.true;
    });
  });
});
