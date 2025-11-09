/**
 * Rotas do Sistema de Catálogo de Serviços
 * 
 * Endpoints:
 * - /api/catalog/categories - Gestão de categorias (hierárquica)
 * - /api/catalog/items - Gestão de itens/serviços
 * - /api/catalog/requests - Service requests
 * - /api/catalog/portal - Portal do cliente
 * - /api/catalog/statistics - Estatísticas
 */

import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permission.js';
import { auditLog } from '../../middleware/audit.js';
import * as catalogController from './catalogControllerV2.js';

const router = express.Router();

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
  auditLog('create', 'service_request'),
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
 * @route   POST /api/catalog/requests/:id/approve
 * @desc    Aprovar ou rejeitar service request
 * @body    approved (boolean), comments, approvedCost
 * @access  Private (Aprovador, Admin)
 */
router.post(
  '/requests/:id/approve',
  authenticate,
  requirePermission('catalog', 'approve'),
  auditLog('update', 'service_request'),
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
  requirePermission('catalog', 'view'),
  catalogController.getCatalogStatistics
);

export default router;
