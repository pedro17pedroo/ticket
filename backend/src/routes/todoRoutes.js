import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as todoController from '../modules/todos/todoController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar tarefas do usuário
router.get('/', todoController.getTodos);

// Criar tarefa
router.post('/', todoController.createTodo);

// Atualizar tarefa
router.put('/:id', todoController.updateTodo);

// Mover tarefa (drag & drop)
router.put('/:id/move', todoController.moveTodo);

// Deletar tarefa
router.delete('/:id', todoController.deleteTodo);

// Adicionar colaborador
router.post('/:id/collaborators', todoController.addCollaborator);

// Remover colaborador
router.delete('/:id/collaborators/:collaboratorId', todoController.removeCollaborator);

// Listar usuários disponíveis para convidar
router.get('/users', todoController.getAvailableUsers);

// Reordenar tarefas em lote
router.put('/reorder', todoController.reorderTodos);

export default router;
