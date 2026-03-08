import { TodoV2, TodoCollaboratorV2 } from './todoModelV2.js';
import { OrganizationUser, ClientUser, Client } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';
import * as notificationService from '../notifications/notificationService.js';

// ==================== ORGANIZATION TODOS ====================

/**
 * GET /api/organization/todos - Listar tarefas da organização
 * Retorna tarefas onde o usuário é dono OU colaborador
 */
export const getOrganizationTodos = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    logger.info(`[ORG TODOS] Buscando todos para userId: ${userId}, orgId: ${organizationId}`);

    // Buscar IDs de todos onde o usuário é colaborador
    const collaborations = await TodoCollaboratorV2.findAll({
      where: { 
        userId,
        userType: 'organization'
      },
      attributes: ['todoId']
    });
    const collaboratedTodoIds = collaborations.map(c => c.todoId);

    // Buscar tarefas onde o usuário é dono OU colaborador
    const where = {
      organizationId,
      [Op.or]: [
        { ownerId: userId, ownerType: 'organization' },
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

    const todos = await TodoV2.findAll({
      where,
      include: [
        {
          model: TodoCollaboratorV2,
          as: 'collaborators',
          required: false
        }
      ],
      order: [
        ['status', 'ASC'],
        ['order', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    // Enriquecer com dados dos colaboradores
    const todosWithDetails = await Promise.all(todos.map(async (todo) => {
      // Buscar owner
      let owner;
      if (todo.ownerType === 'organization') {
        owner = await OrganizationUser.findByPk(todo.ownerId, {
          attributes: ['id', 'name', 'email', 'avatar']
        });
      } else {
        owner = await ClientUser.findByPk(todo.ownerId, {
          attributes: ['id', 'name', 'email', 'avatar']
        });
      }

      // Buscar dados dos colaboradores
      const collaboratorsWithDetails = await Promise.all(
        (todo.collaborators || []).map(async (collab) => {
          let user;
          if (collab.userType === 'organization') {
            user = await OrganizationUser.findByPk(collab.userId, {
              attributes: ['id', 'name', 'email', 'avatar']
            });
          } else {
            user = await ClientUser.findByPk(collab.userId, {
              attributes: ['id', 'name', 'email', 'avatar'],
              include: [{
                model: Client,
                as: 'client',
                attributes: ['id', 'name']
              }]
            });
          }

          return {
            ...collab.toJSON(),
            user: user ? {
              ...user.toJSON(),
              userType: collab.userType,
              clientName: user.client?.name
            } : null
          };
        })
      );

      return {
        ...todo.toJSON(),
        owner: owner ? { ...owner.toJSON(), userType: todo.ownerType } : null,
        isOwner: todo.ownerId === userId && todo.ownerType === 'organization',
        collaborators: collaboratorsWithDetails
      };
    }));

    res.json({
      success: true,
      todos: todosWithDetails
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao listar:', error);
    next(error);
  }
};

/**
 * POST /api/organization/todos - Criar tarefa
 */
export const createOrganizationTodo = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, color } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Título é obrigatório'
      });
    }

    // Obter a maior ordem para colocar no final
    const maxOrder = await TodoV2.max('order', {
      where: { organizationId, ownerId: userId, ownerType: 'organization', status: 'todo' }
    }) || 0;

    const todo = await TodoV2.create({
      organizationId,
      ownerId: userId,
      ownerType: 'organization',
      title,
      description,
      priority: priority || 'medium',
      dueDate,
      color,
      status: 'todo',
      order: maxOrder + 1
    });

    const owner = await OrganizationUser.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'avatar']
    });

    logger.info(`[ORG TODOS] Tarefa criada: ${todo.id} por ${owner?.name}`);

    res.status(201).json({
      success: true,
      message: 'Tarefa criada com sucesso',
      todo: {
        ...todo.toJSON(),
        owner: owner ? { ...owner.toJSON(), userType: 'organization' } : null,
        isOwner: true,
        collaborators: []
      }
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao criar:', error);
    next(error);
  }
};

/**
 * PUT /api/organization/todos/:id - Atualizar tarefa
 */
export const updateOrganizationTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, color, order } = req.body;
    const userId = req.user.id;

    const todo = await TodoV2.findByPk(id, {
      include: [{
        model: TodoCollaboratorV2,
        as: 'collaborators',
        where: { userId, userType: 'organization' },
        required: false
      }]
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar permissão
    const isOwner = todo.ownerId === userId && todo.ownerType === 'organization';
    const canEdit = todo.collaborators?.some(c => c.userId === userId && c.userType === 'organization' && c.canEdit);

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

    logger.info(`[ORG TODOS] Tarefa atualizada: ${id}`);

    res.json({
      success: true,
      message: 'Tarefa atualizada com sucesso',
      todo
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao atualizar:', error);
    next(error);
  }
};

/**
 * PUT /api/organization/todos/:id/move - Mover tarefa (drag & drop)
 */
export const moveOrganizationTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, order } = req.body;
    const userId = req.user.id;

    const todo = await TodoV2.findByPk(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar permissão
    const isOwner = todo.ownerId === userId && todo.ownerType === 'organization';
    const collaborator = await TodoCollaboratorV2.findOne({
      where: { todoId: id, userId, userType: 'organization' }
    });
    const canEdit = collaborator?.canEdit;

    if (!isOwner && !canEdit) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para mover esta tarefa'
      });
    }

    await todo.update({ status, order: order || 0 });

    logger.info(`[ORG TODOS] Tarefa movida: ${id} para ${status}`);

    res.json({
      success: true,
      message: 'Tarefa movida com sucesso',
      todo
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao mover:', error);
    next(error);
  }
};

/**
 * DELETE /api/organization/todos/:id - Deletar tarefa
 */
export const deleteOrganizationTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const todo = await TodoV2.findByPk(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Apenas o dono pode deletar
    if (todo.ownerId !== userId || todo.ownerType !== 'organization') {
      return res.status(403).json({
        success: false,
        error: 'Apenas o dono pode deletar a tarefa'
      });
    }

    await TodoCollaboratorV2.destroy({ where: { todoId: id } });
    await todo.destroy();

    logger.info(`[ORG TODOS] Tarefa deletada: ${id}`);

    res.json({
      success: true,
      message: 'Tarefa deletada com sucesso'
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao deletar:', error);
    next(error);
  }
};

/**
 * POST /api/organization/todos/:id/collaborators - Adicionar colaborador
 * Pode adicionar usuários da organização OU de clientes
 */
export const addOrganizationCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId: collaboratorId, userType, clientId, canEdit = false } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    if (!collaboratorId || !userType) {
      return res.status(400).json({
        success: false,
        error: 'userId e userType são obrigatórios'
      });
    }

    if (!['organization', 'client'].includes(userType)) {
      return res.status(400).json({
        success: false,
        error: 'userType deve ser "organization" ou "client"'
      });
    }

    const todo = await TodoV2.findByPk(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Apenas o dono pode adicionar colaboradores
    if (todo.ownerId !== userId || todo.ownerType !== 'organization') {
      return res.status(403).json({
        success: false,
        error: 'Apenas o dono pode adicionar colaboradores'
      });
    }

    // Verificar se o colaborador existe e pertence à organização
    let collaboratorUser;
    let collaboratorClientId = null;

    if (userType === 'organization') {
      collaboratorUser = await OrganizationUser.findOne({
        where: { id: collaboratorId, organizationId }
      });
      if (!collaboratorUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuário da organização não encontrado'
        });
      }
    } else {
      // userType === 'client'
      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: 'clientId é obrigatório para colaboradores de clientes'
        });
      }

      // Verificar se o cliente pertence à organização
      const client = await Client.findOne({
        where: { id: clientId, organizationId }
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Cliente não encontrado ou não pertence à organização'
        });
      }

      collaboratorUser = await ClientUser.findOne({
        where: { id: collaboratorId, clientId }
      });

      if (!collaboratorUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuário do cliente não encontrado'
        });
      }

      collaboratorClientId = clientId;
    }

    // Verificar se já é colaborador
    const existing = await TodoCollaboratorV2.findOne({
      where: { todoId: id, userId: collaboratorId, userType }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já é colaborador desta tarefa'
      });
    }

    const collaborator = await TodoCollaboratorV2.create({
      todoId: id,
      userId: collaboratorId,
      userType,
      clientId: collaboratorClientId,
      canEdit
    });

    // 🔔 NOTIFICAR colaborador
    await notificationService.createNotification({
      recipientId: collaboratorId,
      recipientType: userType,
      organizationId,
      type: 'todo_collaboration_added',
      title: 'Adicionado a uma Tarefa',
      message: `Você foi adicionado como colaborador na tarefa: ${todo.title}`,
      link: `/todos`,
      priority: 'normal',
      data: {
        todoId: todo.id,
        todoTitle: todo.title,
        canEdit,
        ownerName: req.user.name
      },
      actorId: userId,
      actorType: 'organization',
      actorName: req.user.name
    });

    logger.info(`[ORG TODOS] Colaborador adicionado: ${collaboratorId} (${userType}) à tarefa ${id}`);

    res.status(201).json({
      success: true,
      message: 'Colaborador adicionado com sucesso',
      collaborator: {
        ...collaborator.toJSON(),
        user: {
          id: collaboratorUser.id,
          name: collaboratorUser.name,
          email: collaboratorUser.email,
          avatar: collaboratorUser.avatar,
          userType,
          clientName: userType === 'client' ? (await Client.findByPk(collaboratorClientId))?.name : null
        }
      }
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao adicionar colaborador:', error);
    next(error);
  }
};

/**
 * DELETE /api/organization/todos/:id/collaborators/:collaboratorId - Remover colaborador
 */
export const removeOrganizationCollaborator = async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    const { userType } = req.query; // organization ou client
    const userId = req.user.id;

    if (!userType) {
      return res.status(400).json({
        success: false,
        error: 'userType é obrigatório (query param)'
      });
    }

    const todo = await TodoV2.findByPk(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Apenas o dono pode remover colaboradores
    if (todo.ownerId !== userId || todo.ownerType !== 'organization') {
      return res.status(403).json({
        success: false,
        error: 'Apenas o dono pode remover colaboradores'
      });
    }

    await TodoCollaboratorV2.destroy({
      where: { todoId: id, userId: collaboratorId, userType }
    });

    logger.info(`[ORG TODOS] Colaborador removido: ${collaboratorId} (${userType}) da tarefa ${id}`);

    res.json({
      success: true,
      message: 'Colaborador removido com sucesso'
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao remover colaborador:', error);
    next(error);
  }
};

/**
 * GET /api/organization/todos/available-users - Listar usuários disponíveis para colaboração
 * Retorna usuários da organização E usuários de clientes
 */
export const getAvailableUsersForOrganization = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Usuários da organização (exceto o próprio)
    const orgUsers = await OrganizationUser.findAll({
      where: {
        organizationId,
        id: { [Op.ne]: userId },
        isActive: true
      },
      attributes: ['id', 'name', 'email', 'avatar', 'role']
    });

    // Clientes da organização
    const clients = await Client.findAll({
      where: { organizationId, isActive: true },
      attributes: ['id', 'name'],
      include: [{
        model: ClientUser,
        as: 'users',
        where: { isActive: true },
        required: false,
        attributes: ['id', 'name', 'email', 'avatar', 'role']
      }]
    });

    res.json({
      success: true,
      organizationUsers: orgUsers.map(u => ({
        ...u.toJSON(),
        userType: 'organization'
      })),
      clients: clients.map(c => ({
        id: c.id,
        name: c.name,
        users: (c.users || []).map(u => ({
          ...u.toJSON(),
          userType: 'client',
          clientId: c.id,
          clientName: c.name
        }))
      }))
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao listar usuários disponíveis:', error);
    next(error);
  }
};

/**
 * PUT /api/organization/todos/reorder - Reordenar tarefas em lote
 */
export const reorderOrganizationTodos = async (req, res, next) => {
  try {
    const { todos } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(todos)) {
      return res.status(400).json({
        success: false,
        error: 'Lista de tarefas inválida'
      });
    }

    for (const item of todos) {
      const todo = await TodoV2.findByPk(item.id);
      if (todo && (
        (todo.ownerId === userId && todo.ownerType === 'organization') ||
        await TodoCollaboratorV2.findOne({
          where: { todoId: item.id, userId, userType: 'organization', canEdit: true }
        })
      )) {
        await todo.update({
          status: item.status,
          order: item.order
        });
      }
    }

    logger.info(`[ORG TODOS] Tarefas reordenadas: ${todos.length} itens`);

    res.json({
      success: true,
      message: 'Tarefas reordenadas com sucesso'
    });
  } catch (error) {
    logger.error('[ORG TODOS] Erro ao reordenar:', error);
    next(error);
  }
};

export default {
  getOrganizationTodos,
  createOrganizationTodo,
  updateOrganizationTodo,
  moveOrganizationTodo,
  deleteOrganizationTodo,
  addOrganizationCollaborator,
  removeOrganizationCollaborator,
  getAvailableUsersForOrganization,
  reorderOrganizationTodos
};
