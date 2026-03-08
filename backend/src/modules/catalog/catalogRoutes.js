/**
 * Rotas do Sistema de Catálogo de Serviços
 * 
 * Endpoints:
 * - /api/catalog/categories - Gestão de categorias (hierárquica)
 * - /api/catalog/items - Gestão de itens/serviços
 * - /api/catalog/requests - Service requests
 * - /api/catalog/portal - Portal do cliente
 * - /api/catalog/statistics - Estatísticas
 * - /api/catalog/effective-access - Permissões efetivas do utilizador
 */

import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permission.js';
import { auditLog } from '../../middleware/audit.js';
import upload from '../../config/multer.js';
import * as catalogController from './catalogControllerV2.js';
import * as catalogAccessController from '../catalogAccess/catalogAccessController.js';
import * as catalogOrganizationController from './catalogOrganizationController.js';

const router = express.Router();

// ==================== EFFECTIVE ACCESS ====================

/**
 * @route   GET /api/catalog/effective-access
 * @desc    Get current user's effective catalog permissions
 * @access  Private
 * Requirements: 7.5
 */
router.get(
  '/effective-access',
  authenticate,
  catalogAccessController.getEffectiveAccess
);

// ==================== ORGANIZATION CATALOG (Usuários da Organização) ====================

/**
 * @route   GET /api/catalog/organization/categories
 * @desc    Obter categorias acessíveis (filtradas por ACL)
 * @access  Private (Organization Users)
 */
router.get(
  '/organization/categories',
  authenticate,
  catalogOrganizationController.getOrganizationCategories
);

/**
 * @route   GET /api/catalog/organization/items
 * @desc    Obter itens acessíveis (filtrados por ACL)
 * @query   categoryId - Filtrar por categoria
 * @query   search - Busca textual
 * @access  Private (Organization Users)
 */
router.get(
  '/organization/items',
  authenticate,
  catalogOrganizationController.getOrganizationItems
);

/**
 * @route   GET /api/catalog/organization/items/:id
 * @desc    Obter item específico (com verificação de acesso)
 * @access  Private (Organization Users)
 */
router.get(
  '/organization/items/:id',
  authenticate,
  catalogOrganizationController.getOrganizationItemById
);

/**
 * @route   POST /api/catalog/organization/items/:id/ticket
 * @desc    Criar ticket a partir de item do catálogo
 * @body    formData - Dados do formulário customizado
 * @access  Private (Organization Users)
 */
router.post(
  '/organization/items/:id/ticket',
  authenticate,
  upload.array('attachments', 10),
  auditLog('create', 'ticket_from_catalog'),
  catalogOrganizationController.createTicketFromCatalogItem
);

// ==================== ACCESS CONTROL (Admin) ====================

/**
 * @route   POST /api/catalog/access-control
 * @desc    Criar regra de acesso
 * @access  Private (Admin)
 */
router.post(
  '/access-control',
  authenticate,
  requirePermission('catalog', 'manage'),
  auditLog('create', 'catalog_access_rule'),
  catalogAccessController.createAccessRule
);

/**
 * @route   GET /api/catalog/access-control
 * @desc    Listar regras de acesso
 * @access  Private (Admin)
 */
router.get(
  '/access-control',
  authenticate,
  requirePermission('catalog', 'read'),
  catalogAccessController.getAccessRules
);

/**
 * @route   PUT /api/catalog/access-control/:id
 * @desc    Atualizar regra de acesso
 * @access  Private (Admin)
 */
router.put(
  '/access-control/:id',
  authenticate,
  requirePermission('catalog', 'manage'),
  auditLog('update', 'catalog_access_rule'),
  catalogAccessController.updateAccessRule
);

/**
 * @route   DELETE /api/catalog/access-control/:id
 * @desc    Deletar regra de acesso
 * @access  Private (Admin)
 */
router.delete(
  '/access-control/:id',
  authenticate,
  requirePermission('catalog', 'manage'),
  auditLog('delete', 'catalog_access_rule'),
  catalogAccessController.deleteAccessRule
);

/**
 * @route   GET /api/catalog/access-control/entity/:entityType/:entityId
 * @desc    Obter regras de uma entidade
 * @access  Private (Admin)
 */
router.get(
  '/access-control/entity/:entityType/:entityId',
  authenticate,
  requirePermission('catalog', 'read'),
  catalogAccessController.getEntityRules
);

/**
 * @route   GET /api/catalog/access-control/resource/:resourceType/:resourceId
 * @desc    Obter regras de um recurso
 * @access  Private (Admin)
 */
router.get(
  '/access-control/resource/:resourceType/:resourceId',
  authenticate,
  requirePermission('catalog', 'read'),
  catalogAccessController.getResourceRules
);

// ==================== CATEGORIAS ====================

/**
 * @route   GET /api/catalog/categories
 * @desc    Listar categorias (com hierarquia opcional)
 * @query   hierarchy=true - Retornar estrutura de árvore
 * @query   includeInactive=true - Incluir inativas
 * @access  Private (Admin, Agente)
 */
router.get(
  '/categories',
  authenticate,
  catalogController.getCatalogCategories
);

/**
 * @route   GET /api/catalog/categories/:id
 * @desc    Obter categoria específica com path completo
 * @access  Private
 */
router.get(
  '/categories/:id',
  authenticate,
  catalogController.getCategoryById
);

/**
 * @route   POST /api/catalog/categories
 * @desc    Criar nova categoria (ou subcategoria)
 * @access  Private (Admin)
 */
router.post(
  '/categories',
  authenticate,
  requirePermission('catalog', 'create'),
  auditLog('create', 'catalog_category'),
  catalogController.createCatalogCategory
);

/**
 * @route   PUT /api/catalog/categories/:id
 * @desc    Atualizar categoria
 * @access  Private (Admin)
 */
router.put(
  '/categories/:id',
  authenticate,
  requirePermission('catalog', 'update'),
  auditLog('update', 'catalog_category'),
  catalogController.updateCatalogCategory
);

/**
 * @route   DELETE /api/catalog/categories/:id
 * @desc    Deletar categoria (validação de subcategorias/itens)
 * @access  Private (Admin)
 */
router.delete(
  '/categories/:id',
  authenticate,
  requirePermission('catalog', 'delete'),
  auditLog('delete', 'catalog_category'),
  catalogController.deleteCatalogCategory
);

// ==================== ITENS DO CATÁLOGO ====================

/**
 * @route   GET /api/catalog/items
 * @desc    Buscar itens com filtros avançados
 * @query   categoryId - Filtrar por categoria
 * @query   itemType - Filtrar por tipo (incident, service, support, request)
 * @query   search - Busca textual
 * @query   keywords - Filtrar por keywords
 * @query   requiresApproval - Filtrar por aprovação
 * @query   includeInactive - Incluir inativos
 * @access  Private
 */
router.get(
  '/items',
  authenticate,
  catalogController.getCatalogItems
);

/**
 * @route   GET /api/catalog/items/:id
 * @desc    Obter item específico com detalhes completos
 * @access  Private
 */
router.get(
  '/items/:id',
  authenticate,
  catalogController.getCatalogItemById
);

/**
 * @route   POST /api/catalog/items
 * @desc    Criar novo item/serviço
 * @access  Private (Admin)
 */
router.post(
  '/items',
  authenticate,
  requirePermission('catalog', 'create'),
  auditLog('create', 'catalog_item'),
  catalogController.createCatalogItem
);

/**
 * @route   PUT /api/catalog/items/:id
 * @desc    Atualizar item
 * @access  Private (Admin)
 */
router.put(
  '/items/:id',
  authenticate,
  requirePermission('catalog', 'update'),
  auditLog('update', 'catalog_item'),
  catalogController.updateCatalogItem
);

/**
 * @route   DELETE /api/catalog/items/:id
 * @desc    Deletar item (ou desativar se tem solicitações)
 * @access  Private (Admin)
 */
router.delete(
  '/items/:id',
  authenticate,
  requirePermission('catalog', 'delete'),
  auditLog('delete', 'catalog_item'),
  catalogController.deleteCatalogItem
);

// ==================== SERVICE REQUESTS ====================

/**
 * @route   POST /api/catalog/requests
 * @desc    Criar solicitação de serviço (aplica regras de negócio)
 * @body    catalogItemId, formData, userProvidedPriority (opcional)
 * @access  Private (Cliente, Agente, Admin)
 */
router.post(
  '/requests',
  authenticate,
  auditLog('create', 'catalog'),
  catalogController.createServiceRequest
);

/**
 * @route   GET /api/catalog/requests
 * @desc    Listar service requests
 * @query   status - Filtrar por status
 * @query   catalogItemId - Filtrar por item
 * @query   requestType - Filtrar por tipo
 * @access  Private
 */
router.get(
  '/requests',
  authenticate,
  catalogController.getServiceRequests
);

/**
 * @route   GET /api/catalog/requests/:id
 * @desc    Obter detalhes de uma solicitação
 * @access  Private
 */
router.get(
  '/requests/:id',
  authenticate,
  catalogController.getServiceRequestById
);

/**
 * @route   POST /api/catalog/requests/:id/approve
 * @desc    Aprovar ou rejeitar service request
 * @body    approved (boolean), comments, approvedCost
 * @access  Private (Aprovador, Admin)
 */
router.post(
  '/requests/:id/approve',
  authenticate,
  requirePermission('catalog', 'manage'),
  auditLog('update', 'catalog'),
  catalogController.approveServiceRequest
);

// ==================== PORTAL DO CLIENTE ====================

/**
 * @route   GET /api/catalog/portal/categories
 * @desc    Portal - Hierarquia de categorias para o cliente
 * @access  Private (Cliente)
 */
router.get(
  '/portal/categories',
  authenticate,
  catalogController.getPortalCategories
);

/**
 * @route   GET /api/catalog/portal/categories/:categoryId/items
 * @desc    Portal - Itens de uma categoria específica
 * @access  Private (Cliente)
 */
router.get(
  '/portal/categories/:categoryId/items',
  authenticate,
  catalogController.getPortalCategoryItems
);

/**
 * @route   GET /api/catalog/portal/popular
 * @desc    Portal - Itens mais populares
 * @query   limit - Número de itens (padrão: 10)
 * @query   itemType - Filtrar por tipo (opcional)
 * @access  Private (Cliente)
 */
router.get(
  '/portal/popular',
  authenticate,
  catalogController.getPortalPopularItems
);

// ==================== ESTATÍSTICAS ====================

/**
 * @route   GET /api/catalog/statistics
 * @desc    Estatísticas gerais do catálogo
 * @access  Private (Admin, Agente)
 */
router.get(
  '/statistics',
  authenticate,
  requirePermission('catalog', 'read'),
  catalogController.getCatalogStatistics
);

/**
 * @route   GET /api/catalog/analytics
 * @desc    Analytics detalhados do catálogo
 * @query   period - Período em dias (padrão: 30)
 * @access  Private (Admin, Agente)
 */
router.get(
  '/analytics',
  authenticate,
  requirePermission('catalog', 'read'),
  catalogController.getAnalytics
);

export default router;
