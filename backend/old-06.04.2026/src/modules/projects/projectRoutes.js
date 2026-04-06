import express from 'express';
import * as projectController from './projectController.js';
import * as projectReportController from './projectReportController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { auditLog } from '../../middleware/audit.js';
import { 
  requireProjectPermission, 
  requireProjectOwnerOrPermission,
  requireAnyProjectPermission 
} from '../../middleware/projectPermission.js';
import uploadConfig from '../../config/multer.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==================== REPORTS (must be before /:id routes) ====================

/**
 * @route GET /api/projects/reports/history
 * @desc Get report generation history
 * @access Users with projects.view permission
 * Requirements: 1.3, 10.2
 */
router.get(
  '/reports/history',
  requireProjectPermission('projects', 'view'),
  projectReportController.getReportHistory
);

// ==================== PROJECTS ====================

/**
 * @route GET /api/projects
 * @desc List all projects with filters and pagination
 * @access Authenticated users
 */
router.get('/', projectController.getProjects);

/**
 * @route GET /api/projects/:id/dashboard
 * @desc Get project dashboard data
 * @access Authenticated users
 * Requirements: 8.1-8.6
 */
router.get('/:id/dashboard', projectController.getProjectDashboard);

/**
 * @route GET /api/projects/:id/gantt
 * @desc Get Gantt chart data (phases, tasks, dependencies)
 * @access Authenticated users
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */
router.get('/:id/gantt', projectController.getGanttData);

/**
 * @route GET /api/projects/:id
 * @desc Get project details by ID
 * @access Authenticated users
 */
router.get('/:id', projectController.getProjectById);

/**
 * @route POST /api/projects
 * @desc Create a new project
 * @access Users with projects.create permission
 * Requirements: 9.1
 */
router.post(
  '/',
  requireProjectPermission('projects', 'create'),
  auditLog('create', 'project'),
  projectController.createProject
);

/**
 * @route PUT /api/projects/:id
 * @desc Update a project
 * @access Users with projects.update permission OR project creator
 * Requirements: 9.4, 9.5
 */
router.put(
  '/:id',
  requireProjectOwnerOrPermission('projects', 'update'),
  auditLog('update', 'project'),
  projectController.updateProject
);

/**
 * @route DELETE /api/projects/:id
 * @desc Archive a project (soft delete)
 * @access Users with projects.delete permission OR project creator
 * Requirements: 9.4, 9.5
 */
router.delete(
  '/:id',
  requireProjectOwnerOrPermission('projects', 'delete'),
  auditLog('delete', 'project'),
  projectController.deleteProject
);

// ==================== PHASES ====================

/**
 * @route GET /api/projects/:id/phases
 * @desc List all phases for a project
 * @access Authenticated users
 * Requirements: 2.1
 */
router.get('/:id/phases', projectController.getPhases);

/**
 * @route POST /api/projects/:id/phases
 * @desc Create a new phase for a project
 * @access Users with project_tasks.create permission OR project creator
 * Requirements: 2.1, 9.4, 9.5
 */
router.post(
  '/:id/phases',
  requireProjectOwnerOrPermission('project_tasks', 'create'),
  auditLog('create', 'project_phase'),
  projectController.createPhase
);

/**
 * @route PUT /api/projects/:id/phases/reorder
 * @desc Reorder phases (must be before :phaseId route)
 * @access Users with project_tasks.update permission OR project creator
 * Requirements: 2.2, 9.4, 9.5
 */
router.put(
  '/:id/phases/reorder',
  requireProjectOwnerOrPermission('project_tasks', 'update'),
  auditLog('update', 'project_phase'),
  projectController.reorderPhases
);

/**
 * @route PUT /api/projects/:id/phases/:phaseId
 * @desc Update a phase
 * @access Users with project_tasks.update permission OR project creator
 * Requirements: 2.3, 9.4, 9.5
 */
router.put(
  '/:id/phases/:phaseId',
  requireProjectOwnerOrPermission('project_tasks', 'update'),
  auditLog('update', 'project_phase'),
  projectController.updatePhase
);

/**
 * @route DELETE /api/projects/:id/phases/:phaseId
 * @desc Delete a phase (with protection if has tasks)
 * @access Users with project_tasks.delete permission OR project creator
 * Requirements: 2.4, 2.5, 9.4, 9.5
 */
router.delete(
  '/:id/phases/:phaseId',
  requireProjectOwnerOrPermission('project_tasks', 'delete'),
  auditLog('delete', 'project_phase'),
  projectController.deletePhase
);

// ==================== TASKS ====================

/**
 * @route GET /api/projects/:id/tasks
 * @desc List all tasks for a project
 * @access Authenticated users
 * Requirements: 3.1
 */
router.get('/:id/tasks', projectController.getTasks);

/**
 * @route GET /api/projects/:id/phases/:phaseId/tasks
 * @desc List tasks for a specific phase
 * @access Authenticated users
 * Requirements: 3.1
 */
router.get('/:id/phases/:phaseId/tasks', projectController.getPhaseTasks);

/**
 * @route GET /api/projects/:id/tasks/:taskId
 * @desc Get task details
 * @access Authenticated users
 * Requirements: 3.1
 */
router.get('/:id/tasks/:taskId', projectController.getTaskById);

/**
 * @route POST /api/projects/:id/phases/:phaseId/tasks
 * @desc Create a new task in a phase
 * @access Users with project_tasks.create permission OR project creator
 * Requirements: 3.1, 3.2, 9.4, 9.5
 */
router.post(
  '/:id/phases/:phaseId/tasks',
  requireProjectOwnerOrPermission('project_tasks', 'create'),
  auditLog('create', 'project_task'),
  projectController.createTask
);

/**
 * @route PUT /api/projects/:id/tasks/:taskId
 * @desc Update a task
 * @access Users with project_tasks.update permission OR project creator
 * Requirements: 3.4, 3.5, 9.4, 9.5
 */
router.put(
  '/:id/tasks/:taskId',
  requireProjectOwnerOrPermission('project_tasks', 'update'),
  auditLog('update', 'project_task'),
  projectController.updateTask
);

/**
 * @route DELETE /api/projects/:id/tasks/:taskId
 * @desc Delete a task
 * @access Users with project_tasks.delete permission OR project creator
 * Requirements: 3.6, 9.4, 9.5
 */
router.delete(
  '/:id/tasks/:taskId',
  requireProjectOwnerOrPermission('project_tasks', 'delete'),
  auditLog('delete', 'project_task'),
  projectController.deleteTask
);

/**
 * @route PUT /api/projects/:id/tasks/:taskId/move
 * @desc Move task (Kanban drag & drop)
 * @access Users with project_tasks.update permission OR project creator
 * Requirements: 3.4, 6.2, 6.3, 9.4, 9.5
 */
router.put(
  '/:id/tasks/:taskId/move',
  requireProjectOwnerOrPermission('project_tasks', 'update'),
  auditLog('update', 'project_task'),
  projectController.moveTask
);

// ==================== TASK DEPENDENCIES ====================

/**
 * @route GET /api/projects/:id/tasks/:taskId/dependencies
 * @desc Get task dependencies
 * @access Authenticated users
 * Requirements: 3.3
 */
router.get('/:id/tasks/:taskId/dependencies', projectController.getTaskDependencies);

/**
 * @route POST /api/projects/:id/tasks/:taskId/dependencies
 * @desc Add task dependency
 * @access Users with project_tasks.update permission OR project creator
 * Requirements: 3.3, 9.4, 9.5
 */
router.post(
  '/:id/tasks/:taskId/dependencies',
  requireProjectOwnerOrPermission('project_tasks', 'update'),
  auditLog('create', 'project_task_dependency'),
  projectController.addTaskDependency
);

/**
 * @route DELETE /api/projects/:id/tasks/:taskId/dependencies/:dependencyId
 * @desc Remove task dependency
 * @access Users with project_tasks.update permission OR project creator
 * Requirements: 3.3, 9.4, 9.5
 */
router.delete(
  '/:id/tasks/:taskId/dependencies/:dependencyId',
  requireProjectOwnerOrPermission('project_tasks', 'update'),
  auditLog('delete', 'project_task_dependency'),
  projectController.removeTaskDependency
);

// ==================== TASK COMMENTS ====================

/**
 * @route GET /api/projects/:id/tasks/:taskId/comments
 * @desc Get task comments
 * @access Authenticated users
 * Requirements: 3.8
 */
router.get('/:id/tasks/:taskId/comments', projectController.getTaskComments);

/**
 * @route POST /api/projects/:id/tasks/:taskId/comments
 * @desc Add comment to task
 * @access Authenticated users
 * Requirements: 3.8
 */
router.post(
  '/:id/tasks/:taskId/comments',
  auditLog('create', 'project_task_comment'),
  projectController.addTaskComment
);

/**
 * @route DELETE /api/projects/:id/tasks/:taskId/comments/:commentId
 * @desc Delete comment from task
 * @access Comment author or admin
 * Requirements: 3.8
 */
router.delete(
  '/:id/tasks/:taskId/comments/:commentId',
  auditLog('delete', 'project_task_comment'),
  projectController.deleteTaskComment
);

// ==================== TASK ATTACHMENTS ====================

/**
 * @route GET /api/projects/:id/tasks/:taskId/attachments
 * @desc Get task attachments
 * @access Authenticated users
 * Requirements: 3.9
 */
router.get('/:id/tasks/:taskId/attachments', projectController.getTaskAttachments);

/**
 * @route POST /api/projects/:id/tasks/:taskId/attachments
 * @desc Upload attachment to task
 * @access Authenticated users
 * Requirements: 3.9
 */
router.post(
  '/:id/tasks/:taskId/attachments',
  uploadConfig.single('file'),
  auditLog('create', 'project_task_attachment'),
  projectController.addTaskAttachment
);

/**
 * @route GET /api/projects/:id/tasks/:taskId/attachments/:attachmentId/download
 * @desc Download task attachment
 * @access Authenticated users
 * Requirements: 3.9
 */
router.get(
  '/:id/tasks/:taskId/attachments/:attachmentId/download',
  projectController.downloadTaskAttachment
);

/**
 * @route DELETE /api/projects/:id/tasks/:taskId/attachments/:attachmentId
 * @desc Delete task attachment
 * @access Attachment uploader or admin
 * Requirements: 3.9
 */
router.delete(
  '/:id/tasks/:taskId/attachments/:attachmentId',
  auditLog('delete', 'project_task_attachment'),
  projectController.deleteTaskAttachment
);

// ==================== STAKEHOLDERS ====================

/**
 * @route GET /api/projects/:id/stakeholders
 * @desc List all stakeholders for a project
 * @access Authenticated users
 * Requirements: 4.1, 4.7
 */
router.get('/:id/stakeholders', projectController.getStakeholders);

/**
 * @route POST /api/projects/:id/stakeholders
 * @desc Add a stakeholder to a project
 * @access Users with project_stakeholders.manage permission OR project creator
 * Requirements: 4.1, 4.2, 4.3, 4.4, 9.4, 9.5
 */
router.post(
  '/:id/stakeholders',
  requireProjectOwnerOrPermission('project_stakeholders', 'manage'),
  auditLog('create', 'project_stakeholder'),
  projectController.addStakeholder
);

/**
 * @route PUT /api/projects/:id/stakeholders/:shId
 * @desc Update a stakeholder
 * @access Users with project_stakeholders.manage permission OR project creator
 * Requirements: 4.5, 9.4, 9.5
 */
router.put(
  '/:id/stakeholders/:shId',
  requireProjectOwnerOrPermission('project_stakeholders', 'manage'),
  auditLog('update', 'project_stakeholder'),
  projectController.updateStakeholder
);

/**
 * @route DELETE /api/projects/:id/stakeholders/:shId
 * @desc Remove a stakeholder from a project
 * @access Users with project_stakeholders.manage permission OR project creator
 * Requirements: 4.6, 9.4, 9.5
 */
router.delete(
  '/:id/stakeholders/:shId',
  requireProjectOwnerOrPermission('project_stakeholders', 'manage'),
  auditLog('delete', 'project_stakeholder'),
  projectController.removeStakeholder
);

// ==================== TICKET ASSOCIATION ====================

/**
 * @route GET /api/projects/:id/tickets
 * @desc List all tickets linked to a project
 * @access Authenticated users
 * Requirements: 5.1, 5.3
 */
router.get('/:id/tickets', projectController.getLinkedTickets);

/**
 * @route POST /api/projects/:id/tickets
 * @desc Link a ticket to a project
 * @access Users with projects.update permission OR project creator
 * Requirements: 5.1, 9.4, 9.5
 */
router.post(
  '/:id/tickets',
  requireProjectOwnerOrPermission('projects', 'update'),
  auditLog('create', 'project_ticket'),
  projectController.linkTicket
);

/**
 * @route DELETE /api/projects/:id/tickets/:ticketId
 * @desc Unlink a ticket from a project
 * @access Users with projects.update permission OR project creator
 * Requirements: 5.5, 9.4, 9.5
 */
router.delete(
  '/:id/tickets/:ticketId',
  requireProjectOwnerOrPermission('projects', 'update'),
  auditLog('delete', 'project_ticket'),
  projectController.unlinkTicket
);

/**
 * @route GET /api/projects/:id/tasks/:taskId/tickets
 * @desc Get tickets linked to a specific task
 * @access Authenticated users
 * Requirements: 5.4
 */
router.get('/:id/tasks/:taskId/tickets', projectController.getTaskTickets);

/**
 * @route POST /api/projects/:id/tasks/:taskId/tickets
 * @desc Link a ticket to a specific task
 * @access Users with project_tasks.update permission OR project creator
 * Requirements: 5.2, 9.4, 9.5
 */
router.post(
  '/:id/tasks/:taskId/tickets',
  requireProjectOwnerOrPermission('project_tasks', 'update'),
  auditLog('create', 'project_ticket'),
  projectController.linkTicketToTask
);

// ==================== REPORTS ====================

/**
 * @route GET /api/projects/:id/reports/data/:type
 * @desc Get aggregated data for a specific report type
 * @access Users with projects.view permission OR project creator
 * Requirements: 1.3, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1
 */
router.get(
  '/:id/reports/data/:type',
  requireProjectOwnerOrPermission('projects', 'view'),
  projectReportController.getReportData
);

/**
 * @route POST /api/projects/:id/reports/generate
 * @desc Generate a report file (PDF or Excel)
 * @access Users with projects.view permission OR project creator
 * Requirements: 1.3, 3.2, 4.2, 5.3, 6.2, 7.3, 8.2, 9.3
 */
router.post(
  '/:id/reports/generate',
  requireProjectOwnerOrPermission('projects', 'view'),
  auditLog('create', 'project_report'),
  projectReportController.generateProjectReport
);

/**
 * @route GET /api/projects/:id/reports/:reportId/download
 * @desc Download a generated report
 * @access Users with projects.view permission OR project creator
 * Requirements: 1.3
 */
router.get(
  '/:id/reports/:reportId/download',
  requireProjectOwnerOrPermission('projects', 'view'),
  projectReportController.downloadReport
);

export default router;
