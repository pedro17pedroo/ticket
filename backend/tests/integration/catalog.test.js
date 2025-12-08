import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/config/database.js';
import { Organization, User, CatalogCategory, CatalogItem } from '../../src/modules/models/index.js';
import bcrypt from 'bcryptjs';

describe('Catalog API Integration Tests', () => {
  let organization, adminUser, clientUser, authToken, clientToken;
  let rootCategory, subCategory, catalogItem;

  before(async () => {
    // Sincronizar banco de dados de teste
    await sequelize.sync({ force: true });

    // Criar organização
    organization = await Organization.create({
      name: 'Test Organization',
      slug: 'test-org',
      email: 'test@testorg.com'
    });

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@testorg.com',
      password: hashedPassword,
      role: 'admin-org',
      organizationId: organization.id
    });

    // Criar usuário cliente
    const clientHashedPassword = await bcrypt.hash('Client@123', 10);
    clientUser = await User.create({
      name: 'Client User',
      email: 'client@testorg.com',
      password: clientHashedPassword,
      role: 'client-user',
      organizationId: organization.id
    });

    // Fazer login admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@testorg.com',
        password: 'Admin@123'
      });
    authToken = loginResponse.body.token;

    // Fazer login cliente
    const clientLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'client@testorg.com',
        password: 'Client@123'
      });
    clientToken = clientLoginResponse.body.token;
  });

  after(async () => {
    await sequelize.close();
  });

  describe('POST /api/catalog/categories', () => {
    it('deve criar categoria raiz com sucesso', async () => {
      const response = await request(app)
        .post('/api/catalog/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'TI',
          description: 'Tecnologia da Informação',
          icon: 'Monitor',
          color: 'blue',
          imageUrl: 'https://example.com/ti.png'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('category');
      expect(response.body.category.name).to.equal('TI');
      expect(response.body.category.level).to.equal(1);
      expect(response.body.category.parentCategoryId).to.be.null;

      rootCategory = response.body.category;
    });

    it('deve criar subcategoria com sucesso', async () => {
      const response = await request(app)
        .post('/api/catalog/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Infraestrutura',
          description: 'Serviços de infraestrutura',
          icon: 'Server',
          color: 'green',
          parentCategoryId: rootCategory.id
        });

      expect(response.status).to.equal(201);
      expect(response.body.category.name).to.equal('Infraestrutura');
      expect(response.body.category.level).to.equal(2);
      expect(response.body.category.parentCategoryId).to.equal(rootCategory.id);

      subCategory = response.body.category;
    });

    it('não deve permitir criar categoria sem autenticação', async () => {
      const response = await request(app)
        .post('/api/catalog/categories')
        .send({
          name: 'Categoria Sem Auth',
          description: 'Teste'
        });

      expect(response.status).to.equal(401);
    });

    it('não deve permitir cliente criar categoria', async () => {
      const response = await request(app)
        .post('/api/catalog/categories')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'Categoria Cliente',
          description: 'Teste'
        });

      expect(response.status).to.be.oneOf([403, 401]);
    });
  });

  describe('GET /api/catalog/categories', () => {
    it('deve listar categorias com hierarquia', async () => {
      const response = await request(app)
        .get('/api/catalog/categories?hierarchy=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('categories');
      expect(response.body.categories).to.be.an('array');
      expect(response.body.categories.length).to.be.greaterThan(0);

      const rootCat = response.body.categories.find(c => c.id === rootCategory.id);
      expect(rootCat).to.exist;
      expect(rootCat.subcategories).to.be.an('array');
      expect(rootCat.subcategories.length).to.be.greaterThan(0);
    });

    it('deve permitir cliente visualizar categorias', async () => {
      const response = await request(app)
        .get('/api/catalog/portal/categories')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('categories');
    });
  });

  describe('POST /api/catalog/items', () => {
    it('deve criar item de catálogo com sucesso', async () => {
      const response = await request(app)
        .post('/api/catalog/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: subCategory.id,
          name: 'Falha na VPN',
          shortDescription: 'Problemas de acesso à VPN',
          itemType: 'incident',
          autoAssignPriority: true,
          skipApprovalForIncidents: true,
          defaultPriority: 'alta',
          keywords: ['vpn', 'acesso', 'rede'],
          customFields: [
            {
              name: 'sistema_operacional',
              type: 'dropdown',
              label: 'Sistema Operacional',
              required: true,
              options: ['Windows', 'macOS', 'Linux']
            }
          ]
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('item');
      expect(response.body.item.name).to.equal('Falha na VPN');
      expect(response.body.item.itemType).to.equal('incident');
      expect(response.body.item.autoAssignPriority).to.be.true;
      expect(response.body.item.keywords).to.include('vpn');

      catalogItem = response.body.item;
    });

    it('deve validar tipo de item', async () => {
      const response = await request(app)
        .post('/api/catalog/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          categoryId: subCategory.id,
          name: 'Item Inválido',
          itemType: 'tipo_invalido'
        });

      expect(response.status).to.equal(400);
    });
  });

  describe('GET /api/catalog/items', () => {
    it('deve buscar itens por categoria', async () => {
      const response = await request(app)
        .get(`/api/catalog/items?categoryId=${subCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('items');
      expect(response.body.items).to.be.an('array');
      expect(response.body.items.length).to.be.greaterThan(0);
    });

    it('deve buscar itens por tipo', async () => {
      const response = await request(app)
        .get('/api/catalog/items?itemType=incident')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.items).to.be.an('array');
      const allIncidents = response.body.items.every(item => item.itemType === 'incident');
      expect(allIncidents).to.be.true;
    });

    it('deve buscar itens por keyword', async () => {
      const response = await request(app)
        .get('/api/catalog/items?search=vpn')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.items).to.be.an('array');
    });
  });

  describe('POST /api/catalog/requests', () => {
    it('deve criar solicitação de serviço com sucesso', async () => {
      const response = await request(app)
        .post('/api/catalog/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          catalogItemId: catalogItem.id,
          formData: {
            sistema_operacional: 'Windows'
          },
          additionalDetails: 'Não consigo conectar à VPN desde ontem',
          userPriority: 'alta'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('request');
      
      // Se for incidente, deve criar ticket automaticamente
      if (catalogItem.itemType === 'incident' && catalogItem.skipApprovalForIncidents) {
        expect(response.body).to.have.property('ticket');
        expect(response.body.ticket).to.have.property('id');
      }
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/catalog/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          catalogItemId: catalogItem.id,
          formData: {}
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('errors');
    });

    it('não deve permitir criar solicitação sem autenticação', async () => {
      const response = await request(app)
        .post('/api/catalog/requests')
        .send({
          catalogItemId: catalogItem.id,
          formData: {
            sistema_operacional: 'Windows'
          }
        });

      expect(response.status).to.equal(401);
    });
  });

  describe('GET /api/catalog/statistics', () => {
    it('deve retornar estatísticas do catálogo', async () => {
      const response = await request(app)
        .get('/api/catalog/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('totalCategories');
      expect(response.body).to.have.property('totalItems');
      expect(response.body).to.have.property('totalRequests');
      expect(response.body).to.have.property('byType');
      expect(response.body.byType).to.be.an('object');
    });
  });

  describe('GET /api/catalog/portal/popular', () => {
    it('deve retornar itens mais populares', async () => {
      const response = await request(app)
        .get('/api/catalog/portal/popular?limit=5')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('items');
      expect(response.body.items).to.be.an('array');
      expect(response.body.items.length).to.be.at.most(5);
    });
  });

  describe('PUT /api/catalog/categories/:id', () => {
    it('deve atualizar categoria com sucesso', async () => {
      const response = await request(app)
        .put(`/api/catalog/categories/${rootCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Descrição atualizada'
        });

      expect(response.status).to.equal(200);
      expect(response.body.category.description).to.equal('Descrição atualizada');
    });

    it('não deve permitir criar loop hierárquico', async () => {
      const response = await request(app)
        .put(`/api/catalog/categories/${rootCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parentCategoryId: subCategory.id
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.include('circular');
    });
  });

  describe('DELETE /api/catalog/items/:id', () => {
    it('deve desativar item com solicitações', async () => {
      const response = await request(app)
        .delete(`/api/catalog/items/${catalogItem.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      
      // Verificar se foi desativado
      const getResponse = await request(app)
        .get(`/api/catalog/items/${catalogItem.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getResponse.body.item.isActive).to.be.false;
    });
  });
});
