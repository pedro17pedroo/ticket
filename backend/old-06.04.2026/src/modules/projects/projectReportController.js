/**
 * Project Report Controller
 * 
 * Handles report data aggregation and generation for project reports.
 * 
 * Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 3.2, 4.2, 5.3, 6.2, 7.3, 8.2, 9.3
 */

import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Project,
  ProjectPhase,
  ProjectTask,
  ProjectTaskDependency,
  ProjectStakeholder,
  ProjectReport
} from './index.js';
import { OrganizationUser, Organization } from '../models/index.js';
import logger from '../../config/logger.js';
import { generateReport, isFormatSupported, REPORT_TYPES } from '../../services/reportGenerator/index.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reports upload directory
const REPORTS_DIR = path.join(__dirname, '../../../uploads/reports');

// Valid report types
const VALID_REPORT_TYPES = [
  'project_charter',
  'project_closure',
  'status_report',
  'schedule_report',
  'task_report',
  'stakeholder_report',
  'executive_summary'
];

// Error codes
const ERROR_CODES = {
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  INVALID_REPORT_TYPE: 'INVALID_REPORT_TYPE',
  REPORT_NOT_FOUND: 'REPORT_NOT_FOUND'
};

/**
 * GET /api/projects/:id/reports/data/:type
 * Get aggregated data for a specific report type
 * 
 * Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1
 */
export const getReportData = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    const organizationId = req.user.organizationId;
    const { period, filters } = req.query;

    // Validate report type
    if (!VALID_REPORT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Tipo de relatório inválido. Deve ser um de: ${VALID_REPORT_TYPES.join(', ')}`,
        code: ERROR_CODES.INVALID_REPORT_TYPE
      });
    }

    // Get project with basic info
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

    // Get organization info for header
    const organization = await Organization.findByPk(organizationId, {
      attributes: ['id', 'name', 'tradeName', 'logo', 'email', 'phone', 'address']
    });

    // Aggregate data based on report type
    let reportData;
    switch (type) {
      case 'project_charter':
        reportData = await aggregateProjectCharterData(project, organizationId);
        break;
      case 'project_closure':
        reportData = await aggregateProjectClosureData(project, organizationId);
        break;
      case 'status_report':
        reportData = await aggregateStatusReportData(project, organizationId, period);
        break;
      case 'schedule_report':
        reportData = await aggregateScheduleReportData(project, organizationId, filters);
        break;
      case 'task_report':
        reportData = await aggregateTaskReportData(project, organizationId, filters);
        break;
      case 'stakeholder_report':
        reportData = await aggregateStakeholderReportData(project, organizationId, filters);
        break;
      case 'executive_summary':
        reportData = await aggregateExecutiveSummaryData(project, organizationId);
        break;
      default:
        reportData = {};
    }

    res.json({
      success: true,
      data: {
        reportType: type,
        project: {
          id: project.id,
          code: project.code,
          name: project.name,
          description: project.description,
          methodology: project.methodology,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          progress: project.progress,
          creator: project.creator,
          createdAt: project.createdAt
        },
        organization: {
          id: organization.id,
          name: organization.name,
          tradeName: organization.tradeName,
          logo: organization.logo,
          email: organization.email,
          phone: organization.phone,
          address: organization.address
        },
        ...reportData,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting report data:', error);
    next(error);
  }
};

/**
 * Aggregate data for Project Charter (Termo de Abertura)
 * Requirements: 3.1
 */
async function aggregateProjectCharterData(project, organizationId) {
  // Get stakeholders
  const stakeholders = await ProjectStakeholder.findAll({
    where: { projectId: project.id },
    order: [['role', 'ASC'], ['name', 'ASC']]
  });

  // Get phases
  const phases = await ProjectPhase.findAll({
    where: { projectId: project.id },
    order: [['orderIndex', 'ASC']],
    attributes: ['id', 'name', 'description', 'startDate', 'endDate', 'status', 'orderIndex']
  });

  return {
    stakeholders: stakeholders.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: s.role,
      type: s.type,
      notes: s.notes
    })),
    phases: phases.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      orderIndex: p.orderIndex
    })),
    stakeholderSummary: {
      total: stakeholders.length,
      byRole: {
        sponsor: stakeholders.filter(s => s.role === 'sponsor').length,
        manager: stakeholders.filter(s => s.role === 'manager').length,
        teamMember: stakeholders.filter(s => s.role === 'team_member').length,
        observer: stakeholders.filter(s => s.role === 'observer').length,
        client: stakeholders.filter(s => s.role === 'client').length
      },
      byType: {
        internal: stakeholders.filter(s => s.type === 'internal').length,
        external: stakeholders.filter(s => s.type === 'external').length
      }
    }
  };
}

/**
 * Aggregate data for Project Closure (Termo de Encerramento)
 * Requirements: 4.1
 */
async function aggregateProjectClosureData(project, organizationId) {
  // Get all tasks
  const tasks = await ProjectTask.findAll({
    where: { projectId: project.id },
    include: [
      {
        model: OrganizationUser,
        as: 'assignee',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  // Get phases
  const phases = await ProjectPhase.findAll({
    where: { projectId: project.id },
    order: [['orderIndex', 'ASC']]
  });

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    inReview: tasks.filter(t => t.status === 'in_review').length,
    todo: tasks.filter(t => t.status === 'todo').length
  };

  // Calculate hours
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (parseFloat(t.estimatedHours) || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (parseFloat(t.actualHours) || 0), 0);

  // Get completed tasks as deliverables
  const deliverables = tasks
    .filter(t => t.status === 'done')
    .map(t => ({
      id: t.id,
      title: t.title,
      completedAt: t.completedAt,
      assignee: t.assignee ? t.assignee.name : null
    }));

  // Check if project is completed
  const isCompleted = project.status === 'completed';

  return {
    isCompleted,
    warning: !isCompleted ? 'O projeto ainda não está concluído. Este relatório é preliminar.' : null,
    taskStats,
    completionRate: taskStats.total > 0 
      ? Math.round((taskStats.completed / taskStats.total) * 100) 
      : 0,
    hours: {
      estimated: totalEstimatedHours,
      actual: totalActualHours,
      variance: totalActualHours - totalEstimatedHours
    },
    phases: phases.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress
    })),
    deliverables,
    closureDate: project.status === 'completed' ? project.updatedAt : null
  };
}

/**
 * Aggregate data for Status Report (Ponto de Situação)
 * Requirements: 5.1
 */
async function aggregateStatusReportData(project, organizationId, period) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse period if provided
  let periodStart = null;
  let periodEnd = null;
  if (period) {
    try {
      const periodObj = JSON.parse(period);
      periodStart = periodObj.start ? new Date(periodObj.start) : null;
      periodEnd = periodObj.end ? new Date(periodObj.end) : null;
    } catch (e) {
      // Ignore invalid period
    }
  }

  // Get all tasks
  const taskWhere = { projectId: project.id };
  const tasks = await ProjectTask.findAll({
    where: taskWhere,
    include: [
      {
        model: OrganizationUser,
        as: 'assignee',
        attributes: ['id', 'name', 'email']
      },
      {
        model: ProjectPhase,
        as: 'phase',
        attributes: ['id', 'name']
      }
    ],
    order: [['dueDate', 'ASC']]
  });

  // Get phases
  const phases = await ProjectPhase.findAll({
    where: { projectId: project.id },
    order: [['orderIndex', 'ASC']]
  });

  // Calculate task statistics
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'in_progress'),
    inReview: tasks.filter(t => t.status === 'in_review'),
    done: tasks.filter(t => t.status === 'done')
  };

  // Find overdue tasks
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const due = new Date(t.dueDate);
    return due < today;
  });

  // Find upcoming tasks (next 7 days)
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const due = new Date(t.dueDate);
    return due >= today && due <= nextWeek;
  });

  return {
    period: {
      start: periodStart,
      end: periodEnd,
      reportDate: today
    },
    currentStatus: project.status,
    progress: project.progress,
    taskStats: {
      total: tasks.length,
      todo: tasksByStatus.todo.length,
      inProgress: tasksByStatus.inProgress.length,
      inReview: tasksByStatus.inReview.length,
      done: tasksByStatus.done.length
    },
    overdueTasks: overdueTasks.map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      assignee: t.assignee ? t.assignee.name : null,
      phase: t.phase ? t.phase.name : null,
      daysOverdue: Math.ceil((today - new Date(t.dueDate)) / (1000 * 60 * 60 * 24))
    })),
    upcomingTasks: upcomingTasks.map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      assignee: t.assignee ? t.assignee.name : null,
      phase: t.phase ? t.phase.name : null
    })),
    phases: phases.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress
    })),
    hasOverdueTasks: overdueTasks.length > 0
  };
}

/**
 * Aggregate data for Schedule Report (Cronograma)
 * Requirements: 6.1
 */
async function aggregateScheduleReportData(project, organizationId, filters) {
  // Parse filters
  let filterPhaseId = null;
  if (filters) {
    try {
      const filterObj = JSON.parse(filters);
      filterPhaseId = filterObj.phaseId || null;
    } catch (e) {
      // Ignore invalid filters
    }
  }

  // Get phases
  const phaseWhere = { projectId: project.id };
  if (filterPhaseId) {
    phaseWhere.id = filterPhaseId;
  }

  const phases = await ProjectPhase.findAll({
    where: phaseWhere,
    order: [['orderIndex', 'ASC']],
    include: [
      {
        model: ProjectTask,
        as: 'tasks',
        include: [
          {
            model: OrganizationUser,
            as: 'assignee',
            attributes: ['id', 'name']
          }
        ],
        order: [['orderIndex', 'ASC']]
      }
    ]
  });

  // Get all task dependencies for this project
  const taskIds = phases.flatMap(p => p.tasks.map(t => t.id));
  const dependencies = await ProjectTaskDependency.findAll({
    where: {
      taskId: { [Op.in]: taskIds }
    }
  });

  // Build Gantt-compatible data
  const ganttData = [];
  
  for (const phase of phases) {
    // Add phase as a group
    ganttData.push({
      id: phase.id,
      type: 'phase',
      name: phase.name,
      startDate: phase.startDate,
      endDate: phase.endDate,
      progress: phase.progress,
      status: phase.status,
      orderIndex: phase.orderIndex
    });

    // Add tasks under the phase
    for (const task of phase.tasks) {
      const taskDeps = dependencies
        .filter(d => d.taskId === task.id)
        .map(d => d.dependsOnTaskId);

      ganttData.push({
        id: task.id,
        type: 'task',
        parentId: phase.id,
        name: task.title,
        startDate: task.startDate,
        endDate: task.dueDate,
        progress: task.progress,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee ? task.assignee.name : null,
        dependencies: taskDeps,
        orderIndex: task.orderIndex
      });
    }
  }

  return {
    phases: phases.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      progress: p.progress,
      taskCount: p.tasks.length
    })),
    ganttData,
    dependencies: dependencies.map(d => ({
      taskId: d.taskId,
      dependsOnTaskId: d.dependsOnTaskId,
      type: d.dependencyType
    })),
    summary: {
      totalPhases: phases.length,
      totalTasks: taskIds.length,
      totalDependencies: dependencies.length
    }
  };
}

/**
 * Aggregate data for Task Report (Lista de Tarefas)
 * Requirements: 7.1
 */
async function aggregateTaskReportData(project, organizationId, filters) {
  // Parse filters
  let filterStatus = null;
  let filterPriority = null;
  let filterPhaseId = null;
  let filterAssigneeId = null;
  let groupBy = null;

  if (filters) {
    try {
      const filterObj = JSON.parse(filters);
      filterStatus = filterObj.status || null;
      filterPriority = filterObj.priority || null;
      filterPhaseId = filterObj.phaseId || null;
      filterAssigneeId = filterObj.assigneeId || null;
      groupBy = filterObj.groupBy || null;
    } catch (e) {
      // Ignore invalid filters
    }
  }

  // Build task query
  const taskWhere = { projectId: project.id };
  if (filterStatus) {
    taskWhere.status = Array.isArray(filterStatus) ? { [Op.in]: filterStatus } : filterStatus;
  }
  if (filterPriority) {
    taskWhere.priority = Array.isArray(filterPriority) ? { [Op.in]: filterPriority } : filterPriority;
  }
  if (filterPhaseId) {
    taskWhere.phaseId = filterPhaseId;
  }
  if (filterAssigneeId) {
    taskWhere.assignedTo = filterAssigneeId;
  }

  const tasks = await ProjectTask.findAll({
    where: taskWhere,
    include: [
      {
        model: OrganizationUser,
        as: 'assignee',
        attributes: ['id', 'name', 'email']
      },
      {
        model: ProjectPhase,
        as: 'phase',
        attributes: ['id', 'name']
      }
    ],
    order: [['phase', 'orderIndex', 'ASC'], ['orderIndex', 'ASC']]
  });

  // Calculate statistics
  const stats = {
    total: tasks.length,
    byStatus: {
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      inReview: tasks.filter(t => t.status === 'in_review').length,
      done: tasks.filter(t => t.status === 'done').length
    },
    byPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      critical: tasks.filter(t => t.priority === 'critical').length
    },
    hours: {
      estimated: tasks.reduce((sum, t) => sum + (parseFloat(t.estimatedHours) || 0), 0),
      actual: tasks.reduce((sum, t) => sum + (parseFloat(t.actualHours) || 0), 0)
    }
  };

  // Format tasks
  const formattedTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    startDate: t.startDate,
    dueDate: t.dueDate,
    completedAt: t.completedAt,
    estimatedHours: t.estimatedHours,
    actualHours: t.actualHours,
    progress: t.progress,
    assignee: t.assignee ? {
      id: t.assignee.id,
      name: t.assignee.name,
      email: t.assignee.email
    } : null,
    phase: t.phase ? {
      id: t.phase.id,
      name: t.phase.name
    } : null
  }));

  // Group tasks if requested
  let groupedTasks = null;
  if (groupBy) {
    groupedTasks = {};
    for (const task of formattedTasks) {
      let groupKey;
      switch (groupBy) {
        case 'phase':
          groupKey = task.phase ? task.phase.name : 'Sem Fase';
          break;
        case 'status':
          groupKey = task.status;
          break;
        case 'priority':
          groupKey = task.priority;
          break;
        case 'assignee':
          groupKey = task.assignee ? task.assignee.name : 'Não Atribuído';
          break;
        default:
          groupKey = 'all';
      }
      if (!groupedTasks[groupKey]) {
        groupedTasks[groupKey] = [];
      }
      groupedTasks[groupKey].push(task);
    }
  }

  return {
    tasks: formattedTasks,
    groupedTasks,
    groupBy,
    stats,
    appliedFilters: {
      status: filterStatus,
      priority: filterPriority,
      phaseId: filterPhaseId,
      assigneeId: filterAssigneeId
    }
  };
}

/**
 * Aggregate data for Stakeholder Report (Lista de Stakeholders)
 * Requirements: 8.1
 */
async function aggregateStakeholderReportData(project, organizationId, filters) {
  // Parse filters
  let groupBy = 'role'; // Default grouping

  if (filters) {
    try {
      const filterObj = JSON.parse(filters);
      groupBy = filterObj.groupBy || 'role';
    } catch (e) {
      // Ignore invalid filters
    }
  }

  const stakeholders = await ProjectStakeholder.findAll({
    where: { projectId: project.id },
    order: [['role', 'ASC'], ['name', 'ASC']]
  });

  // Format stakeholders
  const formattedStakeholders = stakeholders.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    type: s.type,
    notes: s.notes
  }));

  // Group stakeholders
  const groupedStakeholders = {};
  for (const stakeholder of formattedStakeholders) {
    let groupKey;
    switch (groupBy) {
      case 'type':
        groupKey = stakeholder.type;
        break;
      case 'role':
      default:
        groupKey = stakeholder.role;
    }
    if (!groupedStakeholders[groupKey]) {
      groupedStakeholders[groupKey] = [];
    }
    groupedStakeholders[groupKey].push(stakeholder);
  }

  return {
    stakeholders: formattedStakeholders,
    groupedStakeholders,
    groupBy,
    summary: {
      total: stakeholders.length,
      byRole: {
        sponsor: stakeholders.filter(s => s.role === 'sponsor').length,
        manager: stakeholders.filter(s => s.role === 'manager').length,
        teamMember: stakeholders.filter(s => s.role === 'team_member').length,
        observer: stakeholders.filter(s => s.role === 'observer').length,
        client: stakeholders.filter(s => s.role === 'client').length
      },
      byType: {
        internal: stakeholders.filter(s => s.type === 'internal').length,
        external: stakeholders.filter(s => s.type === 'external').length
      }
    }
  };
}

/**
 * Aggregate data for Executive Summary (Resumo Executivo)
 * Requirements: 9.1
 */
async function aggregateExecutiveSummaryData(project, organizationId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all tasks
  const tasks = await ProjectTask.findAll({
    where: { projectId: project.id }
  });

  // Get phases
  const phases = await ProjectPhase.findAll({
    where: { projectId: project.id },
    order: [['orderIndex', 'ASC']]
  });

  // Get stakeholders count
  const stakeholderCount = await ProjectStakeholder.count({
    where: { projectId: project.id }
  });

  // Calculate KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate) < today;
  }).length;

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (parseFloat(t.estimatedHours) || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (parseFloat(t.actualHours) || 0), 0);

  // Calculate schedule status
  let scheduleStatus = 'on_track';
  if (overdueTasks > 0) {
    scheduleStatus = overdueTasks > totalTasks * 0.2 ? 'at_risk' : 'delayed';
  }

  // Find next milestones (phases with end dates in the future)
  const upcomingMilestones = phases
    .filter(p => p.endDate && new Date(p.endDate) >= today && p.status !== 'completed')
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      name: p.name,
      endDate: p.endDate,
      progress: p.progress
    }));

  // Progress chart data (tasks by status)
  const progressChartData = {
    labels: ['A Fazer', 'Em Progresso', 'Em Revisão', 'Concluído'],
    values: [
      tasks.filter(t => t.status === 'todo').length,
      tasks.filter(t => t.status === 'in_progress').length,
      tasks.filter(t => t.status === 'in_review').length,
      completedTasks
    ]
  };

  // Phase progress chart data
  const phaseChartData = {
    labels: phases.map(p => p.name),
    values: phases.map(p => p.progress)
  };

  return {
    kpis: {
      progress: project.progress,
      tasksCompleted: completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdueTasks,
      stakeholders: stakeholderCount,
      estimatedHours: totalEstimatedHours,
      actualHours: totalActualHours,
      hoursVariance: totalActualHours - totalEstimatedHours
    },
    scheduleStatus,
    upcomingMilestones,
    charts: {
      progress: progressChartData,
      phases: phaseChartData
    },
    summary: {
      status: project.status,
      methodology: project.methodology,
      startDate: project.startDate,
      endDate: project.endDate,
      daysRemaining: project.endDate 
        ? Math.max(0, Math.ceil((new Date(project.endDate) - today) / (1000 * 60 * 60 * 24)))
        : null
    }
  };
}

/**
 * POST /api/projects/:id/reports/generate
 * Generate a report file (PDF or Excel)
 * 
 * Requirements: 3.2, 4.2, 5.3, 6.2, 7.3, 8.2, 9.3
 */
export const generateProjectReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, format = 'pdf', options = {} } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Validate report type
    if (!VALID_REPORT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Tipo de relatório inválido. Deve ser um de: ${VALID_REPORT_TYPES.join(', ')}`,
        code: ERROR_CODES.INVALID_REPORT_TYPE
      });
    }

    // Validate format support
    if (!isFormatSupported(type, format)) {
      const reportConfig = REPORT_TYPES[type];
      return res.status(400).json({
        success: false,
        error: `Formato '${format}' não suportado para este tipo de relatório. Formatos disponíveis: ${reportConfig.formats.join(', ')}`,
        code: 'INVALID_FORMAT'
      });
    }

    // Get project
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

    // Get organization info
    const organization = await Organization.findByPk(organizationId, {
      attributes: ['id', 'name', 'tradeName', 'logo', 'email', 'phone', 'address']
    });

    // Get report data based on type
    let reportData;
    const filtersJson = options.filters ? JSON.stringify(options.filters) : null;
    const periodJson = options.period ? JSON.stringify(options.period) : null;

    switch (type) {
      case 'project_charter':
        reportData = await aggregateProjectCharterData(project, organizationId);
        break;
      case 'project_closure':
        reportData = await aggregateProjectClosureData(project, organizationId);
        break;
      case 'status_report':
        reportData = await aggregateStatusReportData(project, organizationId, periodJson);
        break;
      case 'schedule_report':
        reportData = await aggregateScheduleReportData(project, organizationId, filtersJson);
        break;
      case 'task_report':
        reportData = await aggregateTaskReportData(project, organizationId, filtersJson);
        break;
      case 'stakeholder_report':
        reportData = await aggregateStakeholderReportData(project, organizationId, filtersJson);
        break;
      case 'executive_summary':
        reportData = await aggregateExecutiveSummaryData(project, organizationId);
        break;
      default:
        reportData = {};
    }

    // Prepare full data for report generation
    const fullReportData = {
      project: {
        id: project.id,
        code: project.code,
        name: project.name,
        description: project.description,
        methodology: project.methodology,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: project.progress,
        creator: project.creator,
        createdAt: project.createdAt
      },
      organization: {
        id: organization.id,
        name: organization.name,
        tradeName: organization.tradeName,
        logo: organization.logo,
        email: organization.email,
        phone: organization.phone,
        address: organization.address
      },
      ...reportData
    };

    // Generate report file
    const fileBuffer = await generateReport(type, format, fullReportData, options);

    // Ensure reports directory exists
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    // Generate filename
    const timestamp = Date.now();
    const sanitizedProjectName = project.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const extension = format === 'excel' ? 'xlsx' : 'pdf';
    const filename = `${type}_${sanitizedProjectName}_${timestamp}.${extension}`;
    const filePath = path.join(REPORTS_DIR, filename);

    // Save file
    fs.writeFileSync(filePath, fileBuffer);
    const fileSize = fileBuffer.length;

    // Create report record
    const report = await ProjectReport.create({
      organizationId,
      projectId: project.id,
      type,
      format,
      filename,
      filePath: `/uploads/reports/${filename}`,
      fileSize,
      options,
      generatedBy: userId,
      generatedAt: new Date()
    });

    logger.info(`Report generated: ${filename} for project ${project.id}`);

    res.json({
      success: true,
      data: {
        reportId: report.id,
        filename,
        downloadUrl: `/api/projects/${project.id}/reports/${report.id}/download`,
        fileSize,
        format,
        type,
        generatedAt: report.generatedAt
      }
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    next(error);
  }
};

/**
 * GET /api/projects/:id/reports/:reportId/download
 * Download a generated report
 */
export const downloadReport = async (req, res, next) => {
  try {
    const { id, reportId } = req.params;
    const organizationId = req.user.organizationId;

    // Find report
    const report = await ProjectReport.findOne({
      where: {
        id: reportId,
        projectId: id,
        organizationId
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Relatório não encontrado',
        code: ERROR_CODES.REPORT_NOT_FOUND
      });
    }

    // Check if file exists
    const absolutePath = path.join(__dirname, '../../../', report.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        error: 'Ficheiro do relatório não encontrado',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Set content type
    const contentType = report.format === 'excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.setHeader('Content-Length', report.fileSize);

    // Stream file
    const fileStream = fs.createReadStream(absolutePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error downloading report:', error);
    next(error);
  }
};

/**
 * GET /api/projects/reports/history
 * Get report generation history
 * 
 * Requirements: 10.2
 */
export const getReportHistory = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { projectId, type, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build query
    const where = { organizationId };
    
    if (projectId) {
      where.projectId = projectId;
    }
    if (type) {
      where.type = type;
    }
    if (startDate || endDate) {
      where.generatedAt = {};
      if (startDate) {
        where.generatedAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.generatedAt[Op.lte] = new Date(endDate);
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: reports } = await ProjectReport.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['generatedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        reports: reports.map(r => ({
          id: r.id,
          type: r.type,
          format: r.format,
          filename: r.filename,
          fileSize: r.fileSize,
          project: r.project ? {
            id: r.project.id,
            name: r.project.name,
            code: r.project.code
          } : null,
          generatedAt: r.generatedAt,
          expiresAt: r.expiresAt,
          downloadUrl: `/api/projects/${r.projectId}/reports/${r.id}/download`
        })),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error getting report history:', error);
    next(error);
  }
};

export default {
  getReportData,
  generateProjectReport,
  downloadReport,
  getReportHistory
};
