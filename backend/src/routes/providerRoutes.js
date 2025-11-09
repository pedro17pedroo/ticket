import express from 'express';
import * as providerController from '../modules/organizations/providerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Apenas Provider (super-admin e provider-admin) podem acessar
router.use(authorize(['super-admin', 'provider-admin']));

// Listar tenants
router.get('/tenants', providerController.getTenants);

// Obter tenant específico
router.get('/tenants/:id', providerController.getTenantById);

// Criar novo tenant
router.post('/tenants', providerController.createTenant);

// Atualizar tenant
router.put('/tenants/:id', providerController.updateTenant);

// Suspender tenant
router.put('/tenants/:id/suspend', providerController.suspendTenant);

// Reativar tenant
router.put('/tenants/:id/activate', providerController.activateTenant);

// Estatísticas globais
router.get('/stats', providerController.getGlobalStats);

export default router;
