import express from 'express';
import * as clientB2BController from '../modules/clients/clientManagementController.js';
import * as clientUserController from '../modules/clients/clientUserManagementController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Apenas Tenant (admin-org, tenant-admin, tenant-manager) podem gerenciar clientes B2B
router.use(authorize('admin-org', 'tenant-admin', 'tenant-manager', 'agent'));

// Listar clientes B2B do tenant
router.get('/', clientB2BController.getClients);

// Obter cliente específico
router.get('/:id', clientB2BController.getClientById);

// Criar novo cliente
router.post('/', authorize('admin-org', 'tenant-admin'), clientB2BController.createClient);

// Atualizar cliente
router.put('/:id', authorize('admin-org', 'tenant-admin'), clientB2BController.updateClient);

// Desativar cliente
router.delete('/:id', authorize('admin-org', 'tenant-admin'), clientB2BController.deleteClient);

// Reativar cliente
router.put('/:id/activate', authorize('admin-org', 'tenant-admin'), clientB2BController.activateClient);

// Estatísticas do cliente
router.get('/:id/stats', clientB2BController.getClientStats);

// ==================== USUÁRIOS DO CLIENTE ====================
// Listar usuários de um cliente
router.get('/:clientId/users', clientUserController.getClientUsers);

// Criar usuário do cliente
router.post('/:clientId/users', authorize('admin-org', 'tenant-admin'), clientUserController.createClientUser);

export default router;
