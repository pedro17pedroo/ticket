import express from 'express';
import * as clientController from '../modules/clients/clientManagementController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Listar clientes
router.get('/', clientController.getClients);

// Obter cliente específico
router.get('/:id', clientController.getClientById);

// Criar cliente (apenas admins)
router.post('/', 
  authorize(['super-admin', 'provider-admin', 'tenant-admin']), 
  clientController.createClient
);

// Atualizar cliente (apenas admins)
router.put('/:id', 
  authorize(['super-admin', 'provider-admin', 'tenant-admin']), 
  clientController.updateClient
);

// Desativar cliente (apenas admins)
router.delete('/:id', 
  authorize(['super-admin', 'provider-admin', 'tenant-admin']), 
  clientController.deleteClient
);

// Reativar cliente (apenas admins)
router.put('/:id/activate', 
  authorize(['super-admin', 'provider-admin', 'tenant-admin']), 
  clientController.activateClient
);

// Estatísticas do cliente
router.get('/:id/stats', clientController.getClientStats);

export default router;
