import { Todo, TodoCollaborator } from './todoModel.js';
import { ClientUser } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';

// GET /api/client/todos - Listar tarefas do usuário
export const getTodos = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    const userId = req.user.id;
    const clientId = req.user.clientId;

    logger.info(`Buscando todos para userId: ${userId}, clientId: ${clientId}`);

    // Primeiro, buscar IDs de todos onde o usuário é colaborador
    const collaborations = await TodoCollaborator.findAll({
      where: { userId },
      attributes: ['todoId']
    });
    const collaboratedTodoIds = collaborations.map(c => c.todoId);

    // Buscar tarefas onde o usuário é dono OU colaborador
    const where = {
      clientId,
      [Op.or]: [
        { ownerId: userId },
        ...(collaboratedTodoIds.length > 0 ? [{ id: { [Op.in]: collaboratedTodoIds } }] : [])
      ]
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (search) {
      where[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } }
          ]
        }
      ];
    }

    const todos = await Todo.findAll({
      where,
      include: [
        {
          model: TodoCollaborator,
          as: 'collaborators',
          required: false,
          include: [{
            model: ClientUser,
            as: 'user',
            attributes: ['id', 'name', 'email', 'avatar']
          }]
        }
      ],
      order: [
        ['status', 'ASC'],
        ['order', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    // Buscar info do owner para cada todo
    const todosWithOwner = await Promise.all(todos.map(async (todo) => {
      const owner = await ClientUser.findByPk(todo.ownerId, {
        attributes: ['id', 'name', 'email', 'avatar']
      });
      return {
        ...todo.toJSON(),
        owner,
        isOwner: todo.ownerId === userId
      };
    }));

    res.json({
      success: true,
      todos: todosWithOwner
    });
  } catch (error) {
    logger.error('Erro ao listar todos:', error);
    next(error);
  }
};

// POST /api/client/todos - Criar tarefa
export const createTodo = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, color } = req.body;
    const userId = req.user.id;
    const clientId = req.user.clientId;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Título é obrigatório'
      });
    }

    // Obter a maior ordem para colocar no final
    const maxOrder = await Todo.max('order', {
      where: { clientId, ownerId: userId, status: 'todo' }
    }) || 0;

    const todo = await Todo.create({
      clientId,
      ownerId: userId,
      title,
      description,
      priority: priority || 'medium',
      dueDate,
      color,
      status: 'todo',
      order: maxOrder + 1
    });

    const owner = await ClientUser.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'avatar']
    });

    res.status(201).json({
      success: true,
      message: 'Tarefa criada com sucesso',
      todo: {
        ...todo.toJSON(),
        owner,
        isOwner: true,
        collaborators: []
      }
    });
  } catch (error) {
    logger.error('Erro ao criar todo:', error);
    next(error);
  }
};

// PUT /api/client/todos/:id - Atualizar tarefa
export const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, color, order } = req.body;
    const userId = req.user.id;

    const todo = await Todo.findByPk(id, {
      include: [{
        model: TodoCollaborator,
        as: 'collaborators',
        where: { userId },
        required: false
      }]
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar permissão (dono ou colaborador com permissão de edição)
    const isOwner = todo.ownerId === userId;
    const canEdit = todo.collaborators?.some(c => c.userId === userId && c.canEdit);

    if (!isOwner && !canEdit) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para editar esta tarefa'
      });
    }

    await todo.update({
      title: title !== undefined ? title : todo.title,
      description: description !== undefined ? description : todo.description,
      status: status !== undefined ? status : todo.status,
      priority: priority !== undefined ? priority : todo.priority,
      dueDate: dueDate !== undefined ? dueDate : todo.dueDate,
      color: color !== undefined ? color : todo.color,
      order: order !== undefined ? order : todo.order
    });

    res.json({
      success: true,
      message: 'Tarefa atualizada com sucesso',
      todo
    });
  } catch (error) {
    logger.error('Erro ao atualizar todo:', error);
    next(error);
  }
};

// PUT /api/client/todos/:id/move - Mover tarefa (drag & drop)
export const moveTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, order } = req.body;
    const userId = req.user.id;

    logger.info(`Movendo todo ${id} para status ${status}, userId: ${userId}`);

    const todo = await Todo.findByPk(id);

    if (!todo) {
      logger.warn(`Todo ${id} não encontrado`);
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    logger.info(`Todo encontrado: ownerId=${todo.ownerId}, clientId=${todo.clientId}`);

    // Verificar permissão
    const isOwner = todo.ownerId === userId;
    const collaborator = await TodoCollaborator.findOne({
      where: { todoId: id, userId }
    });
    const canEdit = collaborator?.canEdit;

    logger.info(`Permissões: isOwner=${isOwner}, canEdit=${canEdit}`);

    if (!isOwner && !canEdit) {
      logger.warn(`Sem permissão para mover todo ${id}`);
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para mover esta tarefa'
      });
    }

    await todo.update({ status, order: order || 0 });

    logger.info(`Todo ${id} movido com sucesso para ${status}`);

    res.json({
      success: true,
      message: 'Tarefa movida com sucesso',
      todo
    });
  } catch (error) {
    logger.error('Erro ao mover todo:', error);
    next(error);
  }
};

// DELETE /api/client/todos/:id - Deletar tarefa
export const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const todo = await Todo.findByPk(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Apenas o dono pode deletar
    if (todo.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o dono pode deletar a tarefa'
      });
    }

    // Deletar colaboradores primeiro
    await TodoCollaborator.destroy({ where: { todoId: id } });
    await todo.destroy();

    res.json({
      success: true,
      message: 'Tarefa deletada com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao deletar todo:', error);
    next(error);
  }
};

// POST /api/client/todos/:id/collaborators - Adicionar colaborador
export const addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId: collaboratorId, canEdit = false } = req.body;
    const userId = req.user.id;
    const clientId = req.user.clientId;

    const todo = await Todo.findByPk(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Apenas o dono pode adicionar colaboradores
    if (todo.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o dono pode adicionar colaboradores'
      });
    }

    // Verificar se o colaborador pertence à mesma empresa
    const collaboratorUser = await ClientUser.findOne({
      where: { id: collaboratorId, clientId }
    });

    if (!collaboratorUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado ou não pertence à mesma empresa'
      });
    }

    // Verificar se já é colaborador
    const existing = await TodoCollaborator.findOne({
      where: { todoId: id, userId: collaboratorId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já é colaborador desta tarefa'
      });
    }

    const collaborator = await TodoCollaborator.create({
      todoId: id,
      userId: collaboratorId,
      canEdit
    });

    res.status(201).json({
      success: true,
      message: 'Colaborador adicionado com sucesso',
      collaborator: {
        ...collaborator.toJSON(),
        user: {
          id: collaboratorUser.id,
          name: collaboratorUser.name,
          email: collaboratorUser.email,
          avatar: collaboratorUser.avatar
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao adicionar colaborador:', error);
    next(error);
  }
};

// DELETE /api/client/todos/:id/collaborators/:collaboratorId - Remover colaborador
export const removeCollaborator = async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.id;

    const todo = await Todo.findByPk(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Apenas o dono pode remover colaboradores
    if (todo.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o dono pode remover colaboradores'
      });
    }

    await TodoCollaborator.destroy({
      where: { todoId: id, userId: collaboratorId }
    });

    res.json({
      success: true,
      message: 'Colaborador removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover colaborador:', error);
    next(error);
  }
};

// GET /api/client/todos/users - Listar usuários da empresa para convidar
export const getAvailableUsers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;

    const users = await ClientUser.findAll({
      where: {
        clientId,
        id: { [Op.ne]: userId },
        isActive: true
      },
      attributes: ['id', 'name', 'email', 'avatar']
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    logger.error('Erro ao listar usuários:', error);
    next(error);
  }
};

// PUT /api/client/todos/reorder - Reordenar tarefas em lote
export const reorderTodos = async (req, res, next) => {
  try {
    const { todos } = req.body; // Array de { id, status, order }
    const userId = req.user.id;

    if (!Array.isArray(todos)) {
      return res.status(400).json({
        success: false,
        error: 'Lista de tarefas inválida'
      });
    }

    // Atualizar cada tarefa
    for (const item of todos) {
      const todo = await Todo.findByPk(item.id);
      if (todo && (todo.ownerId === userId || await TodoCollaborator.findOne({
        where: { todoId: item.id, userId, canEdit: true }
      }))) {
        await todo.update({
          status: item.status,
          order: item.order
        });
      }
    }

    res.json({
      success: true,
      message: 'Tarefas reordenadas com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao reordenar todos:', error);
    next(error);
  }
};
