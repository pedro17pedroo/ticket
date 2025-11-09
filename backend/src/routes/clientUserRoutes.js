import express from 'express';
import * as clientUserController from '../modules/clients/clientUserManagementController.js';
import { authenticate } from '../middleware/auth.js';

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

export default router;
