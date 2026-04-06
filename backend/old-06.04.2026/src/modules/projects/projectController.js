import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import {
  Project,
  ProjectPhase,
  ProjectTask,
  ProjectTaskDependency,
  ProjectStakeholder,
  ProjectTicket,
  ProjectTaskComment,
  ProjectTaskAttachment
} from './index.js';
import { OrganizationUser, Ticket } from '../models/index.js';
import logger from '../../config/logger.js';
import path from 'path';
import fs from 'fs';

// Error codes for project management
const ERROR_CODES = {
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PHASE_NOT_FOUND: 'PHASE_NOT_FOUND',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  PHASE_HAS_TASKS: 'PHASE_HAS_TASKS',
  INVALID_METHODOLOGY: 'INVALID_METHODOLOGY',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_PHASE_STATUS: 'INVALID_PHASE_STATUS',
  INVALID_TASK_STATUS: 'INVALID_TASK_STATUS',
  INVALID_PRIORITY: 'INVALID_PRIORITY',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  SELF_DEPENDENCY: 'SELF_DEPENDENCY',
  DEPENDENCY_NOT_FOUND: 'DEPENDENCY_NOT_FOUND',
  DEPENDENCY_EXISTS: 'DEPENDENCY_EXISTS',
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  ATTACHMENT_NOT_FOUND: 'ATTACHMENT_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  TICKET_ALREADY_LINKED: 'TICKET_ALREADY_LINKED',
  TICKET_NOT_LINKED: 'TICKET_NOT_LINKED'
};

// Valid phase statuses
const VALID_PHASE_STATUSES = ['pending', 'in_progress', 'completed'];

// Valid task statuses and priorities
const VALID_TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const VALID_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];

// Valid methodologies and statuses
const VALID_METHODOLOGIES = ['waterfall', 'agile', 'scrum', 'kanban', 'hybrid'];
const VALID_STATUSES = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];

/**
 * GET /api/projects - List all projects with filters and pagination
 * Requirements: 1.6, 10.1-10.7
 */
export const getProjects = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      methodology,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const organizationId = req.user.organizationId;
    const where = { organizationId };

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by methodology
    if (methodology) {
      where.methodology = methodology;
    }

    // Filter by date range
    if (startDate) {
      where.startDate = { ...where.startDate, [Op.gte]: startDate };
    }
    if (endDate) {
      where.endDate = { ...where.endDate, [Op.lte]: endDate };
    }

    // Search by name or code
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Exclude archived projects by default
    where.archivedAt = null;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate sort field
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'code', 'status', 'methodology', 'startDate', 'endDate', 'progress'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows: projects, count } = await Project.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[finalSortBy, finalSortOrder]],
      include: [
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      projects,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error listing projects:', error);
    next(error);
  }
};

/**
 * GET /api/projects/:id - Get project details
 * Requirements: 1.7
 */
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const project = await Project.findOne({
      where: { id, organizationId },
      include: [
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: ProjectPhase,
          as: 'phases',
          order: [['orderIndex', 'ASC']],
          include: [
            {
              model: ProjectTask,
              as: 'tasks',
              attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'assignedTo', 'progress']
            }
          ]
        },
        {
          model: ProjectStakeholder,
          as: 'stakeholders',
          attributes: ['id', 'name', 'email', 'role', 'type']
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    logger.error('Error getting project by ID:', error);
    next(error);
  }
};

/**
 * POST /api/projects - Create a new project
 * Requirements: 1.1, 1.2, 1.3
 */
export const createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      methodology = 'waterfall',
      status = 'planning',
      startDate,
      endDate
    } = req.body;

    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;

    // Validate methodology
    if (!VALID_METHODOLOGIES.includes(methodology)) {
      return res.status(400).json({
        success: false,
        error: `Metodologia inválida. Deve ser uma de: ${VALID_METHODOLOGIES.join(', ')}`,
        code: ERROR_CODES.INVALID_METHODOLOGY
      });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Deve ser um de: ${VALID_STATUSES.join(', ')}`,
        code: ERROR_CODES.INVALID_STATUS
      });
    }

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          error: 'A data de fim não pode ser anterior à data de início',
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
    }

    // Create project (code is auto-generated by hook)
    const project = await Project.create({
      organizationId,
      name,
      description,
      methodology,
      status,
      startDate,
      endDate,
      createdBy
    });

    // Reload with associations
    const fullProject = await Project.findByPk(project.id, {
      include: [
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    logger.info(`Project created: ${project.code} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso',
      project: fullProject
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Já existe um projeto com este código',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    
    next(error);
  }
};

/**
 * PUT /api/projects/:id - Update a project
 * Requirements: 1.4
 */
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      methodology,
      status,
      startDate,
      endDate,
      progress
    } = req.body;

    const organizationId = req.user.organizationId;

    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Validate methodology if provided
    if (methodology && !VALID_METHODOLOGIES.includes(methodology)) {
      return res.status(400).json({
        success: false,
        error: `Metodologia inválida. Deve ser uma de: ${VALID_METHODOLOGIES.join(', ')}`,
        code: ERROR_CODES.INVALID_METHODOLOGY
      });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Deve ser um de: ${VALID_STATUSES.join(', ')}`,
        code: ERROR_CODES.INVALID_STATUS
      });
    }

    // Validate dates
    const finalStartDate = startDate !== undefined ? startDate : project.startDate;
    const finalEndDate = endDate !== undefined ? endDate : project.endDate;
    
    if (finalStartDate && finalEndDate) {
      const start = new Date(finalStartDate);
      const end = new Date(finalEndDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          error: 'A data de fim não pode ser anterior à data de início',
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (methodology !== undefined) updateData.methodology = methodology;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (progress !== undefined) updateData.progress = progress;

    await project.update(updateData);

    // Reload with associations
    await project.reload({
      include: [
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    logger.info(`Project updated: ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Projeto atualizado com sucesso',
      project
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    
    next(error);
  }
};

/**
 * DELETE /api/projects/:id - Archive a project (soft delete)
 * Requirements: 1.5
 */
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Archive the project (soft delete)
    await project.archive();

    logger.info(`Project archived: ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Projeto arquivado com sucesso'
    });
  } catch (error) {
    logger.error('Error archiving project:', error);
    next(error);
  }
};

/**
 * GET /api/projects/:id/dashboard - Get project dashboard data
 * Requirements: 8.1-8.6
 */
export const getProjectDashboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const project = await Project.findOne({
      where: { id, organizationId },
      include: [
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Get phases with task counts
    const phases = await ProjectPhase.findAll({
      where: { projectId: id },
      order: [['orderIndex', 'ASC']],
      attributes: ['id', 'name', 'status', 'progress', 'startDate', 'endDate', 'orderIndex']
    });

    // Get task statistics
    const tasks = await ProjectTask.findAll({
      where: { projectId: id },
      attributes: ['id', 'status', 'priority', 'dueDate', 'assignedTo', 'updatedAt']
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      inReview: tasks.filter(t => t.status === 'in_review').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        const due = new Date(t.dueDate);
        return due < today;
      }).length
    };

    // Get stakeholders summary
    const stakeholders = await ProjectStakeholder.findAll({
      where: { projectId: id },
      attributes: ['id', 'name', 'role', 'type']
    });

    // Get linked tickets count
    const ticketsCount = await ProjectTicket.count({
      where: { projectId: id }
    });

    // Get upcoming deadlines (tasks due in next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingDeadlines = await ProjectTask.findAll({
      where: {
        projectId: id,
        status: { [Op.ne]: 'done' },
        dueDate: {
          [Op.gte]: today,
          [Op.lte]: nextWeek
        }
      },
      order: [['dueDate', 'ASC']],
      limit: 5,
      attributes: ['id', 'title', 'dueDate', 'priority', 'status']
    });

    // Get recent activity (last 10 task updates)
    const recentActivity = await ProjectTask.findAll({
      where: { projectId: id },
      order: [['updatedAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'title', 'status', 'updatedAt'],
      include: [
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      dashboard: {
        project: {
          id: project.id,
          code: project.code,
          name: project.name,
          status: project.status,
          methodology: project.methodology,
          progress: project.progress,
          startDate: project.startDate,
          endDate: project.endDate,
          creator: project.creator
        },
        phases,
        taskStats,
        stakeholders: {
          total: stakeholders.length,
          byRole: {
            sponsor: stakeholders.filter(s => s.role === 'sponsor').length,
            manager: stakeholders.filter(s => s.role === 'manager').length,
            teamMember: stakeholders.filter(s => s.role === 'team_member').length,
            observer: stakeholders.filter(s => s.role === 'observer').length,
            client: stakeholders.filter(s => s.role === 'client').length
          }
        },
        ticketsCount,
        upcomingDeadlines,
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Error getting project dashboard:', error);
    next(error);
  }
};

// ==================== PHASE MANAGEMENT ====================

/**
 * GET /api/projects/:id/phases - List all phases for a project
 * Requirements: 2.1
 */
export const getPhases = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    const phases = await ProjectPhase.findAll({
      where: { projectId: id },
      order: [['orderIndex', 'ASC']],
      include: [
        {
          model: ProjectTask,
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'assignedTo', 'progress']
        }
      ]
    });

    res.json({
      success: true,
      phases
    });
  } catch (error) {
    logger.error('Error listing phases:', error);
    next(error);
  }
};

/**
 * POST /api/projects/:id/phases - Create a new phase
 * Requirements: 2.1
 */
export const createPhase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      startDate,
      endDate,
      status = 'pending'
    } = req.body;

    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Validate status
    if (!VALID_PHASE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Deve ser um de: ${VALID_PHASE_STATUSES.join(', ')}`,
        code: ERROR_CODES.INVALID_PHASE_STATUS
      });
    }

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          error: 'A data de fim não pode ser anterior à data de início',
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
    }

    // Create phase (orderIndex is auto-assigned by hook)
    const phase = await ProjectPhase.create({
      projectId: id,
      name,
      description,
      startDate,
      endDate,
      status
    });

    logger.info(`Phase created: ${phase.name} for project ${project.code} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Fase criada com sucesso',
      phase
    });
  } catch (error) {
    logger.error('Error creating phase:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    
    next(error);
  }
};

/**
 * PUT /api/projects/:id/phases/:phaseId - Update a phase
 * Requirements: 2.3
 */
export const updatePhase = async (req, res, next) => {
  try {
    const { id, phaseId } = req.params;
    const {
      name,
      description,
      startDate,
      endDate,
      status,
      progress
    } = req.body;

    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Find the phase
    const phase = await ProjectPhase.findOne({
      where: { id: phaseId, projectId: id }
    });

    if (!phase) {
      return res.status(404).json({
        success: false,
        error: 'Fase não encontrada',
        code: ERROR_CODES.PHASE_NOT_FOUND
      });
    }

    // Validate status if provided
    if (status && !VALID_PHASE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Deve ser um de: ${VALID_PHASE_STATUSES.join(', ')}`,
        code: ERROR_CODES.INVALID_PHASE_STATUS
      });
    }

    // Validate dates
    const finalStartDate = startDate !== undefined ? startDate : phase.startDate;
    const finalEndDate = endDate !== undefined ? endDate : phase.endDate;
    
    if (finalStartDate && finalEndDate) {
      const start = new Date(finalStartDate);
      const end = new Date(finalEndDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          error: 'A data de fim não pode ser anterior à data de início',
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;

    await phase.update(updateData);

    // Reload with tasks
    await phase.reload({
      include: [
        {
          model: ProjectTask,
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'assignedTo', 'progress']
        }
      ]
    });

    logger.info(`Phase updated: ${phase.name} for project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Fase atualizada com sucesso',
      phase
    });
  } catch (error) {
    logger.error('Error updating phase:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    
    next(error);
  }
};

/**
 * DELETE /api/projects/:id/phases/:phaseId - Delete a phase (with protection)
 * Requirements: 2.4, 2.5
 */
export const deletePhase = async (req, res, next) => {
  try {
    const { id, phaseId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Find the phase
    const phase = await ProjectPhase.findOne({
      where: { id: phaseId, projectId: id }
    });

    if (!phase) {
      return res.status(404).json({
        success: false,
        error: 'Fase não encontrada',
        code: ERROR_CODES.PHASE_NOT_FOUND
      });
    }

    // Check if phase has tasks (protection)
    const hasTasks = await phase.hasTasks();
    if (hasTasks) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível eliminar uma fase que contém tarefas. Remova ou mova as tarefas primeiro.',
        code: ERROR_CODES.PHASE_HAS_TASKS
      });
    }

    const phaseName = phase.name;
    await phase.destroy();

    logger.info(`Phase deleted: ${phaseName} from project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Fase eliminada com sucesso'
    });
  } catch (error) {
    logger.error('Error deleting phase:', error);
    next(error);
  }
};

/**
 * PUT /api/projects/:id/phases/reorder - Reorder phases
 * Requirements: 2.2
 */
export const reorderPhases = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phaseIds } = req.body;

    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Validate phaseIds array
    if (!Array.isArray(phaseIds) || phaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de IDs de fases inválida',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // Verify all phases belong to this project
    const phases = await ProjectPhase.findAll({
      where: { projectId: id }
    });

    const existingPhaseIds = phases.map(p => p.id);
    const allPhasesExist = phaseIds.every(phaseId => existingPhaseIds.includes(phaseId));

    if (!allPhasesExist) {
      return res.status(400).json({
        success: false,
        error: 'Uma ou mais fases não pertencem a este projeto',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // Reorder phases
    await ProjectPhase.reorder(id, phaseIds);

    // Get updated phases
    const updatedPhases = await ProjectPhase.findAll({
      where: { projectId: id },
      order: [['orderIndex', 'ASC']],
      include: [
        {
          model: ProjectTask,
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'assignedTo', 'progress']
        }
      ]
    });

    logger.info(`Phases reordered for project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Fases reordenadas com sucesso',
      phases: updatedPhases
    });
  } catch (error) {
    logger.error('Error reordering phases:', error);
    next(error);
  }
};

/**
 * Recalculate phase progress based on tasks
 * Requirements: 2.6, 2.7
 * This is a helper function called when task status changes
 */
export const recalculatePhaseProgress = async (phaseId) => {
  const phase = await ProjectPhase.findByPk(phaseId);
  if (phase) {
    await phase.recalculateProgress();
    
    // Also recalculate project progress
    await recalculateProjectProgress(phase.projectId);
  }
};

/**
 * Recalculate project progress based on phases
 * Requirements: 3.7
 */
export const recalculateProjectProgress = async (projectId) => {
  const phases = await ProjectPhase.findAll({
    where: { projectId },
    attributes: ['progress']
  });
  
  if (phases.length === 0) {
    return;
  }
  
  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
  const averageProgress = Math.round(totalProgress / phases.length);
  
  await Project.update(
    { progress: averageProgress },
    { where: { id: projectId } }
  );
};

// ==================== TASK MANAGEMENT ====================

/**
 * GET /api/projects/:id/tasks - List all tasks for a project
 * Requirements: 3.1
 */
export const getTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phaseId, status, priority, assignedTo, search } = req.query;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Build where clause
    const where = { projectId: id };

    if (phaseId) {
      where.phaseId = phaseId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const tasks = await ProjectTask.findAll({
      where,
      order: [['orderIndex', 'ASC']],
      include: [
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: ProjectPhase,
          as: 'phase',
          attributes: ['id', 'name', 'status']
        }
      ]
    });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    logger.error('Error listing tasks:', error);
    next(error);
  }
};

/**
 * GET /api/projects/:id/phases/:phaseId/tasks - List tasks for a specific phase
 * Requirements: 3.1
 */
export const getPhaseTasks = async (req, res, next) => {
  try {
    const { id, phaseId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify phase exists
    const phase = await ProjectPhase.findOne({
      where: { id: phaseId, projectId: id }
    });

    if (!phase) {
      return res.status(404).json({
        success: false,
        error: 'Fase não encontrada',
        code: ERROR_CODES.PHASE_NOT_FOUND
      });
    }

    const tasks = await ProjectTask.findAll({
      where: { projectId: id, phaseId },
      order: [['orderIndex', 'ASC']],
      include: [
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    logger.error('Error listing phase tasks:', error);
    next(error);
  }
};

/**
 * GET /api/projects/:id/tasks/:taskId - Get task details
 * Requirements: 3.1
 */
export const getTaskById = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id },
      include: [
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: ProjectPhase,
          as: 'phase',
          attributes: ['id', 'name', 'status']
        },
        {
          model: ProjectTaskComment,
          as: 'comments',
          include: [
            {
              model: OrganizationUser,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ],
          order: [['createdAt', 'DESC']]
        },
        {
          model: ProjectTaskAttachment,
          as: 'attachments',
          include: [
            {
              model: OrganizationUser,
              as: 'uploader',
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Get dependencies
    const dependencies = await ProjectTaskDependency.findAll({
      where: { taskId },
      include: [
        {
          model: ProjectTask,
          as: 'dependsOnTask',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    // Get dependent tasks (tasks that depend on this one)
    const dependentTasks = await ProjectTaskDependency.findAll({
      where: { dependsOnTaskId: taskId },
      include: [
        {
          model: ProjectTask,
          as: 'task',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    res.json({
      success: true,
      task: {
        ...task.toJSON(),
        dependencies: dependencies.map(d => ({
          id: d.id,
          dependsOnTask: d.dependsOnTask,
          dependencyType: d.dependencyType
        })),
        dependentTasks: dependentTasks.map(d => ({
          id: d.id,
          task: d.task,
          dependencyType: d.dependencyType
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting task by ID:', error);
    next(error);
  }
};

/**
 * POST /api/projects/:id/phases/:phaseId/tasks - Create a new task
 * Requirements: 3.1, 3.2
 */
export const createTask = async (req, res, next) => {
  try {
    const { id, phaseId } = req.params;
    const {
      title,
      description,
      status = 'todo',
      priority = 'medium',
      estimatedHours,
      startDate,
      dueDate,
      assignedTo
    } = req.body;

    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify phase exists
    const phase = await ProjectPhase.findOne({
      where: { id: phaseId, projectId: id }
    });

    if (!phase) {
      return res.status(404).json({
        success: false,
        error: 'Fase não encontrada',
        code: ERROR_CODES.PHASE_NOT_FOUND
      });
    }

    // Validate status
    if (!VALID_TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Deve ser um de: ${VALID_TASK_STATUSES.join(', ')}`,
        code: ERROR_CODES.INVALID_TASK_STATUS
      });
    }

    // Validate priority
    if (!VALID_TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: `Prioridade inválida. Deve ser uma de: ${VALID_TASK_PRIORITIES.join(', ')}`,
        code: ERROR_CODES.INVALID_PRIORITY
      });
    }

    // Validate dates
    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (due < start) {
        return res.status(400).json({
          success: false,
          error: 'A data de vencimento não pode ser anterior à data de início',
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
    }

    // Create task
    const task = await ProjectTask.create({
      projectId: id,
      phaseId,
      title,
      description,
      status,
      priority,
      estimatedHours,
      startDate,
      dueDate,
      assignedTo,
      createdBy
    });

    // Auto-extend phase end date if task due date exceeds it
    if (dueDate && phase.endDate) {
      const taskDueDate = new Date(dueDate);
      const phaseEndDate = new Date(phase.endDate);
      if (taskDueDate > phaseEndDate) {
        await phase.update({ endDate: dueDate });
        logger.info(`Phase ${phase.name} end date auto-extended to ${dueDate} due to task ${title}`);
      }
    } else if (dueDate && !phase.endDate) {
      // If phase has no end date, set it to task due date
      await phase.update({ endDate: dueDate });
      logger.info(`Phase ${phase.name} end date set to ${dueDate} from task ${title}`);
    }

    // Reload with associations
    const fullTask = await ProjectTask.findByPk(task.id, {
      include: [
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: ProjectPhase,
          as: 'phase',
          attributes: ['id', 'name', 'status']
        }
      ]
    });

    logger.info(`Task created: ${task.title} in project ${project.code} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Tarefa criada com sucesso',
      task: fullTask
    });
  } catch (error) {
    logger.error('Error creating task:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    next(error);
  }
};

/**
 * PUT /api/projects/:id/tasks/:taskId - Update a task
 * Requirements: 3.4, 3.5
 */
export const updateTask = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      estimatedHours,
      actualHours,
      startDate,
      dueDate,
      assignedTo,
      progress
    } = req.body;

    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Find the task
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Validate status if provided
    if (status && !VALID_TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Deve ser um de: ${VALID_TASK_STATUSES.join(', ')}`,
        code: ERROR_CODES.INVALID_TASK_STATUS
      });
    }

    // Validate priority if provided
    if (priority && !VALID_TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: `Prioridade inválida. Deve ser uma de: ${VALID_TASK_PRIORITIES.join(', ')}`,
        code: ERROR_CODES.INVALID_PRIORITY
      });
    }

    // Validate dates
    const finalStartDate = startDate !== undefined ? startDate : task.startDate;
    const finalDueDate = dueDate !== undefined ? dueDate : task.dueDate;

    if (finalStartDate && finalDueDate) {
      const start = new Date(finalStartDate);
      const due = new Date(finalDueDate);
      if (due < start) {
        return res.status(400).json({
          success: false,
          error: 'A data de vencimento não pode ser anterior à data de início',
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
    }

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (progress !== undefined) updateData.progress = progress;

    await task.update(updateData);

    // Auto-extend phase end date if task due date exceeds it
    if (dueDate !== undefined && dueDate) {
      const phase = await ProjectPhase.findByPk(task.phaseId);
      if (phase) {
        const taskDueDate = new Date(dueDate);
        if (phase.endDate) {
          const phaseEndDate = new Date(phase.endDate);
          if (taskDueDate > phaseEndDate) {
            await phase.update({ endDate: dueDate });
            logger.info(`Phase ${phase.name} end date auto-extended to ${dueDate} due to task ${task.title} update`);
          }
        } else {
          // If phase has no end date, set it to task due date
          await phase.update({ endDate: dueDate });
          logger.info(`Phase ${phase.name} end date set to ${dueDate} from task ${task.title} update`);
        }
      }
    }

    // Reload with associations
    await task.reload({
      include: [
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: OrganizationUser,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: ProjectPhase,
          as: 'phase',
          attributes: ['id', 'name', 'status']
        }
      ]
    });

    logger.info(`Task updated: ${task.title} in project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tarefa atualizada com sucesso',
      task
    });
  } catch (error) {
    logger.error('Error updating task:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    next(error);
  }
};

/**
 * DELETE /api/projects/:id/tasks/:taskId - Delete a task
 * Requirements: 3.6
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Find the task
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    const taskTitle = task.title;
    const phaseId = task.phaseId;

    // Delete the task (this will cascade delete comments, attachments, and dependencies)
    await task.destroy();

    logger.info(`Task deleted: ${taskTitle} from project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tarefa eliminada com sucesso'
    });
  } catch (error) {
    logger.error('Error deleting task:', error);
    next(error);
  }
};

/**
 * PUT /api/projects/:id/tasks/:taskId/move - Move task (Kanban)
 * Requirements: 3.4, 6.2, 6.3
 */
export const moveTask = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const { status, phaseId, orderIndex } = req.body;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Find the task
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Validate status if provided
    if (status && !VALID_TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status inválido. Deve ser um de: ${VALID_TASK_STATUSES.join(', ')}`,
        code: ERROR_CODES.INVALID_TASK_STATUS
      });
    }

    // If moving to a different phase, verify the phase exists
    if (phaseId && phaseId !== task.phaseId) {
      const newPhase = await ProjectPhase.findOne({
        where: { id: phaseId, projectId: id }
      });

      if (!newPhase) {
        return res.status(404).json({
          success: false,
          error: 'Fase de destino não encontrada',
          code: ERROR_CODES.PHASE_NOT_FOUND
        });
      }
    }

    // Build update object
    const updateData = {};
    if (status) updateData.status = status;
    if (phaseId) updateData.phaseId = phaseId;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    await task.update(updateData);

    // Reload with associations
    await task.reload({
      include: [
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: ProjectPhase,
          as: 'phase',
          attributes: ['id', 'name', 'status']
        }
      ]
    });

    logger.info(`Task moved: ${task.title} in project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tarefa movida com sucesso',
      task
    });
  } catch (error) {
    logger.error('Error moving task:', error);
    next(error);
  }
};


// ==================== TASK DEPENDENCIES ====================

/**
 * GET /api/projects/:id/tasks/:taskId/dependencies - Get task dependencies
 * Requirements: 3.3
 */
export const getTaskDependencies = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Get dependencies (tasks this task depends on)
    const dependencies = await ProjectTaskDependency.findAll({
      where: { taskId },
      include: [
        {
          model: ProjectTask,
          as: 'dependsOnTask',
          attributes: ['id', 'title', 'status', 'priority', 'dueDate']
        }
      ]
    });

    // Get dependent tasks (tasks that depend on this task)
    const dependentTasks = await ProjectTaskDependency.findAll({
      where: { dependsOnTaskId: taskId },
      include: [
        {
          model: ProjectTask,
          as: 'task',
          attributes: ['id', 'title', 'status', 'priority', 'dueDate']
        }
      ]
    });

    res.json({
      success: true,
      dependencies: dependencies.map(d => ({
        id: d.id,
        dependsOnTask: d.dependsOnTask,
        dependencyType: d.dependencyType
      })),
      dependentTasks: dependentTasks.map(d => ({
        id: d.id,
        task: d.task,
        dependencyType: d.dependencyType
      }))
    });
  } catch (error) {
    logger.error('Error getting task dependencies:', error);
    next(error);
  }
};

/**
 * POST /api/projects/:id/tasks/:taskId/dependencies - Add task dependency
 * Requirements: 3.3
 */
export const addTaskDependency = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const { dependsOnTaskId, dependencyType = 'finish_to_start' } = req.body;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Verify depends on task exists and belongs to same project
    const dependsOnTask = await ProjectTask.findOne({
      where: { id: dependsOnTaskId, projectId: id }
    });

    if (!dependsOnTask) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa de dependência não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Check for self-dependency
    if (taskId === dependsOnTaskId) {
      return res.status(400).json({
        success: false,
        error: 'Uma tarefa não pode depender de si mesma',
        code: ERROR_CODES.SELF_DEPENDENCY
      });
    }

    // Check if dependency already exists
    const existingDep = await ProjectTaskDependency.findOne({
      where: { taskId, dependsOnTaskId }
    });

    if (existingDep) {
      return res.status(400).json({
        success: false,
        error: 'Esta dependência já existe',
        code: ERROR_CODES.DEPENDENCY_EXISTS
      });
    }

    // Check for circular dependency
    const hasCircular = await ProjectTaskDependency.checkCircularDependency(taskId, dependsOnTaskId);
    if (hasCircular) {
      return res.status(400).json({
        success: false,
        error: 'Dependência circular detectada',
        code: ERROR_CODES.CIRCULAR_DEPENDENCY
      });
    }

    // Create dependency
    const dependency = await ProjectTaskDependency.create({
      taskId,
      dependsOnTaskId,
      dependencyType
    });

    // Reload with association
    const fullDependency = await ProjectTaskDependency.findByPk(dependency.id, {
      include: [
        {
          model: ProjectTask,
          as: 'dependsOnTask',
          attributes: ['id', 'title', 'status', 'priority', 'dueDate']
        }
      ]
    });

    logger.info(`Dependency added: ${task.title} depends on ${dependsOnTask.title} in project ${project.code}`);

    res.status(201).json({
      success: true,
      message: 'Dependência adicionada com sucesso',
      dependency: {
        id: fullDependency.id,
        dependsOnTask: fullDependency.dependsOnTask,
        dependencyType: fullDependency.dependencyType
      }
    });
  } catch (error) {
    logger.error('Error adding task dependency:', error);

    if (error.message === 'Circular dependency detected') {
      return res.status(400).json({
        success: false,
        error: 'Dependência circular detectada',
        code: ERROR_CODES.CIRCULAR_DEPENDENCY
      });
    }

    if (error.message === 'A task cannot depend on itself') {
      return res.status(400).json({
        success: false,
        error: 'Uma tarefa não pode depender de si mesma',
        code: ERROR_CODES.SELF_DEPENDENCY
      });
    }

    next(error);
  }
};

/**
 * DELETE /api/projects/:id/tasks/:taskId/dependencies/:dependencyId - Remove task dependency
 * Requirements: 3.3
 */
export const removeTaskDependency = async (req, res, next) => {
  try {
    const { id, taskId, dependencyId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Find and delete the dependency
    const dependency = await ProjectTaskDependency.findOne({
      where: { id: dependencyId, taskId }
    });

    if (!dependency) {
      return res.status(404).json({
        success: false,
        error: 'Dependência não encontrada',
        code: ERROR_CODES.DEPENDENCY_NOT_FOUND
      });
    }

    await dependency.destroy();

    logger.info(`Dependency removed from task ${task.title} in project ${project.code}`);

    res.json({
      success: true,
      message: 'Dependência removida com sucesso'
    });
  } catch (error) {
    logger.error('Error removing task dependency:', error);
    next(error);
  }
};

// ==================== TASK COMMENTS ====================

/**
 * GET /api/projects/:id/tasks/:taskId/comments - Get task comments
 * Requirements: 3.8
 */
export const getTaskComments = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    const comments = await ProjectTaskComment.findAll({
      where: { taskId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    logger.error('Error getting task comments:', error);
    next(error);
  }
};

/**
 * POST /api/projects/:id/tasks/:taskId/comments - Add comment to task
 * Requirements: 3.8
 */
export const addTaskComment = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const { content } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'O conteúdo do comentário não pode estar vazio',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // Create comment
    const comment = await ProjectTaskComment.create({
      taskId,
      userId,
      content: content.trim()
    });

    // Reload with user association
    const fullComment = await ProjectTaskComment.findByPk(comment.id, {
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    logger.info(`Comment added to task ${task.title} in project ${project.code} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      comment: fullComment
    });
  } catch (error) {
    logger.error('Error adding task comment:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    next(error);
  }
};

/**
 * DELETE /api/projects/:id/tasks/:taskId/comments/:commentId - Delete comment
 * Requirements: 3.8
 */
export const deleteTaskComment = async (req, res, next) => {
  try {
    const { id, taskId, commentId } = req.params;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Find the comment
    const comment = await ProjectTaskComment.findOne({
      where: { id: commentId, taskId }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comentário não encontrado',
        code: ERROR_CODES.COMMENT_NOT_FOUND
      });
    }

    // Check if user can delete (only comment author or admin)
    const isAdmin = ['org-admin', 'org-manager'].includes(req.user.role);
    if (comment.userId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Não tem permissão para eliminar este comentário',
        code: ERROR_CODES.PERMISSION_DENIED
      });
    }

    await comment.destroy();

    logger.info(`Comment deleted from task ${task.title} in project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Comentário eliminado com sucesso'
    });
  } catch (error) {
    logger.error('Error deleting task comment:', error);
    next(error);
  }
};

// ==================== TASK ATTACHMENTS ====================

/**
 * GET /api/projects/:id/tasks/:taskId/attachments - Get task attachments
 * Requirements: 3.9
 */
export const getTaskAttachments = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    const attachments = await ProjectTaskAttachment.findAll({
      where: { taskId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: OrganizationUser,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      attachments
    });
  } catch (error) {
    logger.error('Error getting task attachments:', error);
    next(error);
  }
};

/**
 * POST /api/projects/:id/tasks/:taskId/attachments - Upload attachment to task
 * Requirements: 3.9
 */
export const addTaskAttachment = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const organizationId = req.user.organizationId;
    const uploadedBy = req.user.id;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum ficheiro foi enviado',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // Create attachment record
    const attachment = await ProjectTaskAttachment.create({
      taskId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy
    });

    // Reload with uploader association
    const fullAttachment = await ProjectTaskAttachment.findByPk(attachment.id, {
      include: [
        {
          model: OrganizationUser,
          as: 'uploader',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    logger.info(`Attachment added to task ${task.title} in project ${project.code} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Anexo adicionado com sucesso',
      attachment: fullAttachment
    });
  } catch (error) {
    logger.error('Error adding task attachment:', error);
    next(error);
  }
};

/**
 * DELETE /api/projects/:id/tasks/:taskId/attachments/:attachmentId - Delete attachment
 * Requirements: 3.9
 */
export const deleteTaskAttachment = async (req, res, next) => {
  try {
    const { id, taskId, attachmentId } = req.params;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Find the attachment
    const attachment = await ProjectTaskAttachment.findOne({
      where: { id: attachmentId, taskId }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Anexo não encontrado',
        code: ERROR_CODES.ATTACHMENT_NOT_FOUND
      });
    }

    // Check if user can delete (only uploader or admin)
    const isAdmin = ['org-admin', 'org-manager'].includes(req.user.role);
    if (attachment.uploadedBy !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Não tem permissão para eliminar este anexo',
        code: ERROR_CODES.PERMISSION_DENIED
      });
    }

    // Delete the file from disk
    try {
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
      }
    } catch (fileError) {
      logger.warn(`Could not delete file from disk: ${attachment.path}`, fileError);
    }

    await attachment.destroy();

    logger.info(`Attachment deleted from task ${task.title} in project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Anexo eliminado com sucesso'
    });
  } catch (error) {
    logger.error('Error deleting task attachment:', error);
    next(error);
  }
};

/**
 * GET /api/projects/:id/tasks/:taskId/attachments/:attachmentId/download - Download attachment
 * Requirements: 3.9
 */
export const downloadTaskAttachment = async (req, res, next) => {
  try {
    const { id, taskId, attachmentId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Find the attachment
    const attachment = await ProjectTaskAttachment.findOne({
      where: { id: attachmentId, taskId }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Anexo não encontrado',
        code: ERROR_CODES.ATTACHMENT_NOT_FOUND
      });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({
        success: false,
        error: 'Ficheiro não encontrado no servidor',
        code: ERROR_CODES.ATTACHMENT_NOT_FOUND
      });
    }

    // Send file
    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    logger.error('Error downloading task attachment:', error);
    next(error);
  }
};

// ==================== STAKEHOLDER MANAGEMENT ====================

// Valid stakeholder roles and types
const VALID_STAKEHOLDER_ROLES = ['sponsor', 'manager', 'team_member', 'observer', 'client'];
const VALID_STAKEHOLDER_TYPES = ['internal', 'external'];

/**
 * GET /api/projects/:id/stakeholders - List all stakeholders for a project
 * Requirements: 4.1, 4.7
 */
export const getStakeholders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    const stakeholders = await ProjectStakeholder.findAll({
      where: { projectId: id },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      stakeholders
    });
  } catch (error) {
    logger.error('Error listing stakeholders:', error);
    next(error);
  }
};

/**
 * POST /api/projects/:id/stakeholders - Add a stakeholder to a project
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export const addStakeholder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      userId,
      name,
      email,
      phone,
      role = 'team_member',
      type = 'internal',
      notes
    } = req.body;

    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Validate role
    if (!VALID_STAKEHOLDER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role inválido. Deve ser um de: ${VALID_STAKEHOLDER_ROLES.join(', ')}`,
        code: 'INVALID_STAKEHOLDER_ROLE'
      });
    }

    // Validate type
    if (!VALID_STAKEHOLDER_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Tipo inválido. Deve ser um de: ${VALID_STAKEHOLDER_TYPES.join(', ')}`,
        code: 'INVALID_STAKEHOLDER_TYPE'
      });
    }

    // Validate name is provided
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // If internal type with userId, verify user exists in organization
    if (type === 'internal' && userId) {
      const user = await OrganizationUser.findOne({
        where: { id: userId, organizationId }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Utilizador não encontrado na organização',
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // Check if stakeholder already exists (by userId or email)
    const existingStakeholder = await ProjectStakeholder.findOne({
      where: {
        projectId: id,
        [Op.or]: [
          ...(userId ? [{ userId }] : []),
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existingStakeholder) {
      return res.status(400).json({
        success: false,
        error: 'Este stakeholder já está associado ao projeto',
        code: 'STAKEHOLDER_EXISTS'
      });
    }

    // Create stakeholder
    const stakeholder = await ProjectStakeholder.create({
      projectId: id,
      userId: type === 'internal' ? userId : null,
      name,
      email,
      phone,
      role,
      type,
      notes
    });

    // Reload with user association
    await stakeholder.reload({
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        }
      ]
    });

    logger.info(`Stakeholder added: ${stakeholder.name} to project ${project.code} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Stakeholder adicionado com sucesso',
      stakeholder
    });
  } catch (error) {
    logger.error('Error adding stakeholder:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    
    next(error);
  }
};

/**
 * PUT /api/projects/:id/stakeholders/:shId - Update a stakeholder
 * Requirements: 4.5
 */
export const updateStakeholder = async (req, res, next) => {
  try {
    const { id, shId } = req.params;
    const {
      name,
      email,
      phone,
      role,
      type,
      notes
    } = req.body;

    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Find the stakeholder
    const stakeholder = await ProjectStakeholder.findOne({
      where: { id: shId, projectId: id }
    });

    if (!stakeholder) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder não encontrado',
        code: 'STAKEHOLDER_NOT_FOUND'
      });
    }

    // Validate role if provided
    if (role && !VALID_STAKEHOLDER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role inválido. Deve ser um de: ${VALID_STAKEHOLDER_ROLES.join(', ')}`,
        code: 'INVALID_STAKEHOLDER_ROLE'
      });
    }

    // Validate type if provided
    if (type && !VALID_STAKEHOLDER_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Tipo inválido. Deve ser um de: ${VALID_STAKEHOLDER_TYPES.join(', ')}`,
        code: 'INVALID_STAKEHOLDER_TYPE'
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido',
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (type !== undefined) updateData.type = type;
    if (notes !== undefined) updateData.notes = notes;

    await stakeholder.update(updateData);

    // Reload with user association
    await stakeholder.reload({
      include: [
        {
          model: OrganizationUser,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        }
      ]
    });

    logger.info(`Stakeholder updated: ${stakeholder.name} in project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Stakeholder atualizado com sucesso',
      stakeholder
    });
  } catch (error) {
    logger.error('Error updating stakeholder:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', '),
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    
    next(error);
  }
};

/**
 * DELETE /api/projects/:id/stakeholders/:shId - Remove a stakeholder from a project
 * Requirements: 4.6
 */
export const removeStakeholder = async (req, res, next) => {
  try {
    const { id, shId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Find the stakeholder
    const stakeholder = await ProjectStakeholder.findOne({
      where: { id: shId, projectId: id }
    });

    if (!stakeholder) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder não encontrado',
        code: 'STAKEHOLDER_NOT_FOUND'
      });
    }

    const stakeholderName = stakeholder.name;
    await stakeholder.destroy();

    logger.info(`Stakeholder removed: ${stakeholderName} from project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Stakeholder removido com sucesso'
    });
  } catch (error) {
    logger.error('Error removing stakeholder:', error);
    next(error);
  }
};

// ==================== TICKET ASSOCIATION ====================

/**
 * GET /api/projects/:id/tickets - List all tickets linked to a project
 * Requirements: 5.1, 5.3
 */
export const getLinkedTickets = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Get all linked tickets
    const projectTickets = await ProjectTicket.findAll({
      where: { projectId: id },
      order: [['linkedAt', 'DESC']],
      include: [
        {
          model: ProjectTask,
          as: 'task',
          attributes: ['id', 'title', 'status'],
          required: false
        }
      ]
    });

    // Get ticket details for each linked ticket
    const ticketIds = projectTickets.map(pt => pt.ticketId);
    const tickets = await Ticket.findAll({
      where: { 
        id: ticketIds,
        organizationId 
      },
      attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority', 'createdAt', 'updatedAt']
    });

    // Create a map for quick lookup
    const ticketMap = new Map(tickets.map(t => [t.id, t]));

    // Combine project ticket info with ticket details
    const linkedTickets = projectTickets.map(pt => ({
      id: pt.id,
      ticketId: pt.ticketId,
      ticket: ticketMap.get(pt.ticketId) || null,
      task: pt.task,
      linkedAt: pt.linkedAt,
      linkedBy: pt.linkedBy
    })).filter(lt => lt.ticket !== null);

    res.json({
      success: true,
      tickets: linkedTickets
    });
  } catch (error) {
    logger.error('Error getting linked tickets:', error);
    next(error);
  }
};

/**
 * POST /api/projects/:id/tickets - Link a ticket to a project
 * Requirements: 5.1
 */
export const linkTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ticketId, taskId } = req.body;
    const organizationId = req.user.organizationId;
    const linkedBy = req.user.id;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify ticket exists and belongs to organization
    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado',
        code: ERROR_CODES.TICKET_NOT_FOUND
      });
    }

    // If taskId is provided, verify task exists and belongs to project
    if (taskId) {
      const task = await ProjectTask.findOne({
        where: { id: taskId, projectId: id }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Tarefa não encontrada',
          code: ERROR_CODES.TASK_NOT_FOUND
        });
      }
    }

    // Check if ticket is already linked to this project
    const existingLink = await ProjectTicket.findOne({
      where: { projectId: id, ticketId }
    });

    if (existingLink) {
      // Update task association if provided
      if (taskId !== undefined) {
        await existingLink.update({ taskId });
        
        const updatedLink = await ProjectTicket.findByPk(existingLink.id, {
          include: [
            {
              model: ProjectTask,
              as: 'task',
              attributes: ['id', 'title', 'status'],
              required: false
            }
          ]
        });

        return res.json({
          success: true,
          message: 'Associação de ticket atualizada',
          projectTicket: {
            id: updatedLink.id,
            ticketId: updatedLink.ticketId,
            ticket: {
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              status: ticket.status
            },
            task: updatedLink.task,
            linkedAt: updatedLink.linkedAt
          }
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Este ticket já está associado ao projeto',
        code: ERROR_CODES.TICKET_ALREADY_LINKED
      });
    }

    // Create the link
    const projectTicket = await ProjectTicket.create({
      projectId: id,
      ticketId,
      taskId: taskId || null,
      linkedBy,
      linkedAt: new Date()
    });

    // Reload with associations
    const fullProjectTicket = await ProjectTicket.findByPk(projectTicket.id, {
      include: [
        {
          model: ProjectTask,
          as: 'task',
          attributes: ['id', 'title', 'status'],
          required: false
        }
      ]
    });

    logger.info(`Ticket ${ticket.ticketNumber} linked to project ${project.code} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Ticket associado ao projeto com sucesso',
      projectTicket: {
        id: fullProjectTicket.id,
        ticketId: fullProjectTicket.ticketId,
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status
        },
        task: fullProjectTicket.task,
        linkedAt: fullProjectTicket.linkedAt
      }
    });
  } catch (error) {
    logger.error('Error linking ticket to project:', error);
    next(error);
  }
};

/**
 * POST /api/projects/:id/tasks/:taskId/tickets - Link a ticket to a specific task
 * Requirements: 5.2
 */
export const linkTicketToTask = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const { ticketId } = req.body;
    const organizationId = req.user.organizationId;
    const linkedBy = req.user.id;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists and belongs to project
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Verify ticket exists and belongs to organization
    const ticket = await Ticket.findOne({
      where: { id: ticketId, organizationId }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado',
        code: ERROR_CODES.TICKET_NOT_FOUND
      });
    }

    // Check if ticket is already linked to this project
    const existingLink = await ProjectTicket.findOne({
      where: { projectId: id, ticketId }
    });

    if (existingLink) {
      // Update task association
      await existingLink.update({ taskId });
      
      const updatedLink = await ProjectTicket.findByPk(existingLink.id, {
        include: [
          {
            model: ProjectTask,
            as: 'task',
            attributes: ['id', 'title', 'status'],
            required: false
          }
        ]
      });

      logger.info(`Ticket ${ticket.ticketNumber} linked to task ${task.title} in project ${project.code}`);

      return res.json({
        success: true,
        message: 'Ticket associado à tarefa com sucesso',
        projectTicket: {
          id: updatedLink.id,
          ticketId: updatedLink.ticketId,
          ticket: {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            status: ticket.status
          },
          task: updatedLink.task,
          linkedAt: updatedLink.linkedAt
        }
      });
    }

    // Create the link with task association
    const projectTicket = await ProjectTicket.create({
      projectId: id,
      ticketId,
      taskId,
      linkedBy,
      linkedAt: new Date()
    });

    // Reload with associations
    const fullProjectTicket = await ProjectTicket.findByPk(projectTicket.id, {
      include: [
        {
          model: ProjectTask,
          as: 'task',
          attributes: ['id', 'title', 'status'],
          required: false
        }
      ]
    });

    logger.info(`Ticket ${ticket.ticketNumber} linked to task ${task.title} in project ${project.code} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Ticket associado à tarefa com sucesso',
      projectTicket: {
        id: fullProjectTicket.id,
        ticketId: fullProjectTicket.ticketId,
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status
        },
        task: fullProjectTicket.task,
        linkedAt: fullProjectTicket.linkedAt
      }
    });
  } catch (error) {
    logger.error('Error linking ticket to task:', error);
    next(error);
  }
};

/**
 * DELETE /api/projects/:id/tickets/:ticketId - Unlink a ticket from a project
 * Requirements: 5.5
 */
export const unlinkTicket = async (req, res, next) => {
  try {
    const { id, ticketId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Find the link
    const projectTicket = await ProjectTicket.findOne({
      where: { projectId: id, ticketId }
    });

    if (!projectTicket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não está associado a este projeto',
        code: ERROR_CODES.TICKET_NOT_LINKED
      });
    }

    await projectTicket.destroy();

    logger.info(`Ticket ${ticketId} unlinked from project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Ticket desassociado do projeto com sucesso'
    });
  } catch (error) {
    logger.error('Error unlinking ticket from project:', error);
    next(error);
  }
};

/**
 * GET /api/projects/:id/tasks/:taskId/tickets - Get tickets linked to a specific task
 * Requirements: 5.4
 */
export const getTaskTickets = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Verify task exists and belongs to project
    const task = await ProjectTask.findOne({
      where: { id: taskId, projectId: id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada',
        code: ERROR_CODES.TASK_NOT_FOUND
      });
    }

    // Get all tickets linked to this task
    const projectTickets = await ProjectTicket.findAll({
      where: { projectId: id, taskId },
      order: [['linkedAt', 'DESC']]
    });

    // Get ticket details
    const ticketIds = projectTickets.map(pt => pt.ticketId);
    const tickets = await Ticket.findAll({
      where: { 
        id: ticketIds,
        organizationId 
      },
      attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority', 'createdAt', 'updatedAt']
    });

    // Create a map for quick lookup
    const ticketMap = new Map(tickets.map(t => [t.id, t]));

    // Combine project ticket info with ticket details
    const linkedTickets = projectTickets.map(pt => ({
      id: pt.id,
      ticketId: pt.ticketId,
      ticket: ticketMap.get(pt.ticketId) || null,
      linkedAt: pt.linkedAt,
      linkedBy: pt.linkedBy
    })).filter(lt => lt.ticket !== null);

    res.json({
      success: true,
      tickets: linkedTickets
    });
  } catch (error) {
    logger.error('Error getting task tickets:', error);
    next(error);
  }
};

// ==================== GANTT DATA ====================

/**
 * GET /api/projects/:id/gantt - Get Gantt chart data
 * Requirements: 7.1, 7.2, 7.4, 7.5
 * Returns phases, tasks, and dependencies formatted for Gantt visualization
 */
export const getGanttData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verify project exists and belongs to organization
    const project = await Project.findOne({
      where: { id, organizationId },
      attributes: ['id', 'code', 'name', 'status', 'startDate', 'endDate', 'progress']
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado',
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }

    // Get all phases ordered by orderIndex
    const phases = await ProjectPhase.findAll({
      where: { projectId: id },
      order: [['orderIndex', 'ASC']],
      attributes: ['id', 'name', 'status', 'progress', 'startDate', 'endDate', 'orderIndex']
    });

    // Get all tasks with assignee info
    const tasks = await ProjectTask.findAll({
      where: { projectId: id },
      order: [['phaseId', 'ASC'], ['orderIndex', 'ASC']],
      attributes: ['id', 'phaseId', 'title', 'status', 'priority', 'progress', 'startDate', 'dueDate', 'assignedTo'],
      include: [
        {
          model: OrganizationUser,
          as: 'assignee',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });

    // Get all dependencies
    const taskIds = tasks.map(t => t.id);
    const dependencies = await ProjectTaskDependency.findAll({
      where: {
        taskId: taskIds
      },
      attributes: ['id', 'taskId', 'dependsOnTaskId', 'dependencyType']
    });

    // Calculate today for overdue detection (Requirement 7.4)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Format phases for Gantt (Requirement 7.1)
    const ganttPhases = phases.map(phase => ({
      id: phase.id,
      name: phase.name,
      type: 'phase',
      status: phase.status,
      progress: phase.progress,
      startDate: phase.startDate,
      endDate: phase.endDate,
      orderIndex: phase.orderIndex
    }));

    // Format tasks for Gantt (Requirements 7.1, 7.4, 7.5)
    const ganttTasks = tasks.map(task => {
      // Check if task is overdue (Requirement 7.4)
      const isOverdue = task.dueDate && 
                        task.status !== 'done' && 
                        new Date(task.dueDate) < today;

      return {
        id: task.id,
        phaseId: task.phaseId,
        name: task.title,
        type: 'task',
        status: task.status,
        priority: task.priority,
        progress: task.progress, // Requirement 7.5
        startDate: task.startDate,
        endDate: task.dueDate,
        isOverdue, // Requirement 7.4
        assignee: task.assignee ? {
          id: task.assignee.id,
          name: task.assignee.name,
          avatar: task.assignee.avatar
        } : null
      };
    });

    // Format dependencies for Gantt (Requirement 7.2)
    const ganttDependencies = dependencies.map(dep => ({
      id: dep.id,
      sourceTaskId: dep.dependsOnTaskId, // The task that must be completed first
      targetTaskId: dep.taskId, // The task that depends on the source
      type: dep.dependencyType // finish_to_start, start_to_start, etc.
    }));

    // Calculate project date range for timeline
    let projectStartDate = project.startDate;
    let projectEndDate = project.endDate;

    // If project dates not set, calculate from phases/tasks
    if (!projectStartDate || !projectEndDate) {
      const allDates = [
        ...phases.filter(p => p.startDate).map(p => new Date(p.startDate)),
        ...phases.filter(p => p.endDate).map(p => new Date(p.endDate)),
        ...tasks.filter(t => t.startDate).map(t => new Date(t.startDate)),
        ...tasks.filter(t => t.dueDate).map(t => new Date(t.dueDate))
      ];

      if (allDates.length > 0) {
        if (!projectStartDate) {
          projectStartDate = new Date(Math.min(...allDates)).toISOString().split('T')[0];
        }
        if (!projectEndDate) {
          projectEndDate = new Date(Math.max(...allDates)).toISOString().split('T')[0];
        }
      }
    }

    // Summary statistics
    const stats = {
      totalPhases: phases.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      overdueTasks: ganttTasks.filter(t => t.isOverdue).length,
      totalDependencies: dependencies.length
    };

    logger.info(`Gantt data retrieved for project ${project.code} by user ${req.user.email}`);

    res.json({
      success: true,
      gantt: {
        project: {
          id: project.id,
          code: project.code,
          name: project.name,
          status: project.status,
          progress: project.progress,
          startDate: projectStartDate,
          endDate: projectEndDate
        },
        phases: ganttPhases,
        tasks: ganttTasks,
        dependencies: ganttDependencies,
        stats,
        today: today.toISOString().split('T')[0] // Current date for timeline marker (Requirement 7.7)
      }
    });
  } catch (error) {
    logger.error('Error getting Gantt data:', error);
    next(error);
  }
};

// Export all functions
export default {
  // Projects
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectDashboard,
  // Phase management
  getPhases,
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhases,
  recalculatePhaseProgress,
  recalculateProjectProgress,
  // Task management
  getTasks,
  getPhaseTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  // Task dependencies
  getTaskDependencies,
  addTaskDependency,
  removeTaskDependency,
  // Task comments
  getTaskComments,
  addTaskComment,
  deleteTaskComment,
  // Task attachments
  getTaskAttachments,
  addTaskAttachment,
  deleteTaskAttachment,
  downloadTaskAttachment,
  // Stakeholder management
  getStakeholders,
  addStakeholder,
  updateStakeholder,
  removeStakeholder,
  // Ticket association
  getLinkedTickets,
  linkTicket,
  linkTicketToTask,
  unlinkTicket,
  getTaskTickets,
  // Gantt
  getGanttData
};
