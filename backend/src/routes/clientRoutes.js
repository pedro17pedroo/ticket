import express from 'express';
import * as clientB2BController from '../modules/clients/clientManagementController.js';
import * as clientUserController from '../modules/clients/clientUserManagementController.js';
import * as catalogAccessController from '../modules/catalogAccess/catalogAccessController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireSmartPermission } from '../middleware/smartPermission.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Listar clientes B2B do tenant
router.get('/', requireSmartPermission('clients', 'read'), clientB2BController.getClients);

// Obter cliente específico
router.get('/:id', requireSmartPermission('clients', 'read'), clientB2BController.getClientById);

// Criar novo cliente
router.post('/', requireSmartPermission('clients', 'create'), clientB2BController.createClient);

// Atualizar cliente
router.put('/:id', requireSmartPermission('clients', 'update'), clientB2BController.updateClient);

// Desativar cliente
router.delete('/:id', requireSmartPermission('clients', 'delete'), clientB2BController.deleteClient);

// Reativar cliente
router.put('/:id/activate', requireSmartPermission('clients', 'activate'), clientB2BController.activateClient);

// Estatísticas do cliente
router.get('/:id/stats', clientB2BController.getClientStats);

// ==================== CATALOG ACCESS (Permissões de Catálogo) ====================
// GET /api/clients/:id/catalog-access - Obter permissões de catálogo do cliente
router.get('/:id/catalog-access', requireSmartPermission('clients', 'read'), catalogAccessController.getClientCatalogAccess);

// PUT /api/clients/:id/catalog-access - Atualizar permissões de catálogo do cliente
router.put('/:id/catalog-access', 
  authorize('org-admin', 'tenant-admin', 'super-admin', 'provider-admin'),
  auditLog('update', 'client_catalog_access'),
  catalogAccessController.updateClientCatalogAccess
);

// GET /api/clients/:id/catalog-access/audit - Histórico de alterações
router.get('/:id/catalog-access/audit', requireSmartPermission('clients', 'read'), catalogAccessController.getClientCatalogAccessAudit);

// ==================== USUÁRIOS DO CLIENTE ====================
// Listar usuários de um cliente
router.get('/:clientId/users', requireSmartPermission('client_users', 'read'), clientUserController.getClientUsers);

// Criar usuário do cliente
router.post('/:clientId/users', requireSmartPermission('client_users', 'create'), clientUserController.createClientUser);

export default router;
