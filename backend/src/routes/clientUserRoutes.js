import express from 'express';
import * as clientUserController from '../modules/clients/clientUserManagementController.js';
import * as catalogAccessController from '../modules/catalogAccess/catalogAccessController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireSmartPermission } from '../middleware/smartPermission.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Listar usuários de um cliente
router.get('/clients/:clientId/users', clientUserController.getClientUsers);

// Obter usuário específico
router.get('/:id', clientUserController.getClientUserById);

// Criar usuário (admins do tenant ou client-admin)
router.post('/clients/:clientId/users', clientUserController.createClientUser);

// Atualizar usuário
router.put('/:id', clientUserController.updateClientUser);

// Desativar usuário
router.delete('/:id', clientUserController.deleteClientUser);

// Reativar usuário
router.put('/:id/activate', clientUserController.activateClientUser);

// Alterar senha
router.put('/:id/change-password', clientUserController.changePassword);

// ==================== CATALOG ACCESS (Permissões de Catálogo) ====================
// GET /api/client-users/:id/catalog-access - Obter permissões de catálogo do utilizador
router.get('/:id/catalog-access', requireSmartPermission('client_users', 'read'), catalogAccessController.getClientUserCatalogAccess);

// PUT /api/client-users/:id/catalog-access - Atualizar permissões de catálogo do utilizador
router.put('/:id/catalog-access',
  authorize('org-admin', 'tenant-admin', 'super-admin', 'provider-admin'),
  auditLog('update', 'client_user_catalog_access'),
  catalogAccessController.updateClientUserCatalogAccess
);

// GET /api/client-users/:id/catalog-access/audit - Histórico de alterações
router.get('/:id/catalog-access/audit', requireSmartPermission('client_users', 'read'), catalogAccessController.getClientUserCatalogAccessAudit);

export default router;
