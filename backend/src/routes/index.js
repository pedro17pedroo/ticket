import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { requirePermission, requireAnyPermission, requireLevel } from '../middleware/permission.js';
import { requireSmartPermission } from '../middleware/smartPermission.js';
import { validate, schemas } from '../middleware/validate.js';
import { auditLog } from '../middleware/audit.js';
import { upload } from '../middleware/upload.js';
import uploadConfig from '../config/multer.js';
import { validateAssignment, validateUserManagement } from '../middleware/validateHierarchy.js';

import * as authController from '../modules/auth/authController.js';
import * as userController from '../modules/users/userController.js';
import * as ticketController from '../modules/tickets/ticketController.js';
import * as departmentController from '../modules/departments/departmentController.js';
// categoryController removido - usar catalogController para categorias unificadas
import * as knowledgeController from '../modules/knowledge/knowledgeController.js';
import * as slaController from '../modules/slas/slaController.js';
import * as priorityController from '../modules/priorities/priorityController.js';
import * as typeController from '../modules/types/typeController.js';
import * as directionController from '../modules/directions/directionController.js';
import * as sectionController from '../modules/sections/sectionController.js';
// ❌ DEPRECATED - Usar nova arquitetura multi-tenant
// import * as clientController from '../modules/clients/clientController.js';
// import * as clientUsersController from '../modules/clients/clientUsersController.js';
// import * as clientUserController from '../modules/users/clientUserController.js';
import * as clientStructureController from '../modules/clients/clientStructureController.js';
import * as hoursController from '../modules/hours/hoursController.js';
import * as clientHoursController from '../modules/hours/clientHoursController.js';
import * as timeTrackingController from '../modules/timeTracking/timeTrackingController.js';
import * as tagController from '../modules/tags/tagController.js';
import * as templateController from '../modules/templates/templateController.js';
import * as ticketMergeController from '../modules/tickets/ticketMergeController.js';
import * as catalogController from '../modules/catalog/catalogController.js';
import * as notificationController from '../modules/notifications/notificationController.js';
import * as inventoryController from '../modules/inventory/inventoryController.js';
import remoteAccessRoutes from '../modules/remoteAccess/remoteAccessRoutes.js';
import emailTestRoutes from './emailTest.js';
import debugRoutes from './debugRoutes.js';
import * as setupController from '../modules/setup/setupController.js';
import commentRoutes from './commentRoutes.js';
import saasRoutes from './saasRoutes.js';
import * as landingPageController from '../modules/landingPage/landingPageController.js';
import * as downloadController from '../modules/downloads/downloadController.js';
import debugUserRoutes from './debugUserRoutes.js';
import fixTicketsRoutes from './fixTicketsRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'TatuTicket Backend'
  });
});

// ==================== SETUP ====================
router.post('/setup/defaults', authenticate, setupController.setupDefaults);
router.get('/setup/status', authenticate, setupController.checkSetupStatus);

// ==================== AUTH ====================
router.post('/auth/register', validate(schemas.register), authController.register);
router.post('/auth/login', validate(schemas.login), authController.login);
router.get('/auth/profile', authenticate, authController.getProfile);
router.put('/auth/profile', authenticate, validate(schemas.updateProfile), authController.updateProfile);
router.put('/auth/change-password', authenticate, validate(schemas.changePassword), authController.changePassword);
router.get('/auth/users', authenticate, authController.getUsers);
router.post('/auth/password-reset/request', validate(schemas.requestPasswordReset), authController.requestPasswordReset);
router.post('/auth/password-reset/validate', validate(schemas.validatePasswordResetToken), authController.validatePasswordResetToken);
router.post('/auth/password-reset/reset', validate(schemas.resetPasswordWithToken), authController.resetPasswordWithToken);

// ==================== CLIENT PORTAL USERS (Legacy - DESATIVADO) ====================
// ❌ DEPRECATED - Usar /client-users-b2b para nova arquitetura
// router.get('/client/users', authenticate, clientUserController.getClientUsers);
// router.post('/client/users', authenticate, validate(schemas.createClientUser), auditLog('create', 'client_user'), clientUserController.createClientUser);
// router.put('/client/users/:id', authenticate, validate(schemas.updateClientUser), auditLog('update', 'client_user'), clientUserController.updateClientUser);
// router.put('/client/users/:id/activate', authenticate, auditLog('update', 'client_user'), clientUserController.activateClientUser);
// router.put('/client/users/:id/reset-password', authenticate, validate(schemas.resetPassword), auditLog('update', 'client_user'), clientUserController.resetClientUserPassword);
// router.delete('/client/users/:id', authenticate, auditLog('delete', 'client_user'), clientUserController.deleteClientUser);

// ==================== USERS ====================
// Profile routes (devem vir ANTES de /users/:id para não serem capturadas como ID)
router.get('/users/profile', authenticate, authController.getProfile);
router.put('/users/profile', authenticate, auditLog('update', 'user'), authController.updateProfile);
router.put('/users/password', authenticate, auditLog('update', 'user'), authController.changePassword);
router.put('/users/preferences', authenticate, auditLog('update', 'user'), authController.updateProfile);

router.get('/users', authenticate, requirePermission('users', 'read'), userController.getUsers);
router.get('/users/:id', authenticate, requirePermission('users', 'read'), userController.getUserById);
router.post('/users', authenticate, requirePermission('users', 'create'), validate(schemas.createUser), validateUserManagement, auditLog('create', 'user'), userController.createUser);
router.put('/users/:id', authenticate, requirePermission('users', 'update'), validate(schemas.updateUser), validateUserManagement, auditLog('update', 'user'), userController.updateUser);
router.put('/users/:id/activate', authenticate, requirePermission('users', 'update'), auditLog('update', 'user'), userController.activateUser);
router.put('/users/:id/reset-password', authenticate, requirePermission('users', 'reset_password'), validate(schemas.resetPassword), auditLog('update', 'user'), userController.resetPassword);
router.delete('/users/:id', authenticate, requirePermission('users', 'delete'), auditLog('delete', 'user'), userController.deleteUser);

// ==================== TICKETS ====================
router.get('/tickets', authenticate, requireSmartPermission('tickets', 'read'), ticketController.getTickets);
router.get('/tickets/statistics', authenticate, requireSmartPermission('tickets', 'read'), ticketController.getStatistics);
router.get('/tickets/:id', authenticate, requireSmartPermission('tickets', 'read'), ticketController.getTicketById);
router.post('/tickets', authenticate, requirePermission('tickets', 'create'), validate(schemas.createTicket), auditLog('create', 'ticket'), ticketController.createTicket);
router.put('/tickets/:id', authenticate, requirePermission('tickets', 'update'), validate(schemas.updateTicket), validateAssignment, auditLog('update', 'ticket'), ticketController.updateTicket);
router.patch('/tickets/:id', authenticate, requirePermission('tickets', 'update'), validate(schemas.updateTicket), validateAssignment, auditLog('update', 'ticket'), ticketController.updateTicket);
router.patch('/tickets/:id/watchers', authenticate, requirePermission('tickets', 'update'), auditLog('update', 'ticket_watchers'), ticketController.updateTicketWatchers);
router.post('/tickets/:id/comments', authenticate, requirePermission('comments', 'create'), validate(schemas.createComment), auditLog('create', 'comment'), ticketController.addComment);

// Comment routes (endpoints separados)
router.use('/tickets', commentRoutes);

// Ticket Attachments
router.post('/tickets/:ticketId/upload', authenticate, uploadConfig.array('files', 5), auditLog('create', 'attachment'), ticketController.uploadAttachments);
router.get('/tickets/:ticketId/attachments', authenticate, ticketController.getAttachments);
router.get('/tickets/:ticketId/attachments/:attachmentId/download', authenticate, ticketController.downloadAttachment);
router.delete('/tickets/:ticketId/attachments/:attachmentId', authenticate, auditLog('delete', 'attachment'), ticketController.deleteAttachment);

// Client History
router.get('/users/:userId/tickets/history', authenticate, ticketController.getClientHistory);

// Ticket Relationships
router.post('/tickets/:ticketId/relationships', authenticate, ticketController.addRelationship);
router.get('/tickets/:ticketId/relationships', authenticate, ticketController.getRelatedTickets);
router.delete('/relationships/:relationshipId', authenticate, ticketController.removeRelationship);

// Ticket History & Management
router.get('/tickets/:ticketId/history', authenticate, ticketController.getHistory);
router.get('/tickets/:ticketId/permissions', authenticate, ticketController.getTicketPermissions);
router.get('/tickets/:ticketId/eligible-assignees', authenticate, ticketController.getEligibleAssignees);
router.post('/tickets/:ticketId/transfer', authenticate, auditLog('transfer', 'ticket'), ticketController.transferTicket);
router.patch('/tickets/:ticketId/internal-priority', authenticate, auditLog('update_internal_priority', 'ticket'), ticketController.updateInternalPriority);
router.patch('/tickets/:ticketId/resolution-status', authenticate, auditLog('update_resolution_status', 'ticket'), ticketController.updateResolutionStatus);

// ==================== DIRECTIONS ====================
router.get('/directions', authenticate, directionController.getDirections);
router.get('/directions/:id', authenticate, directionController.getDirectionById);
router.post('/directions', authenticate, authorize('org-admin'), validate(schemas.createDirection), auditLog('create', 'direction'), directionController.createDirection);
router.put('/directions/:id', authenticate, authorize('org-admin'), validate(schemas.updateDirection), auditLog('update', 'direction'), directionController.updateDirection);
router.delete('/directions/:id', authenticate, authorize('org-admin'), auditLog('delete', 'direction'), directionController.deleteDirection);

// ==================== DEPARTMENTS ====================
router.get('/departments', authenticate, departmentController.getDepartments);
router.get('/departments/:id', authenticate, departmentController.getDepartmentById);
router.post('/departments', authenticate, authorize('org-admin'), validate(schemas.createDepartment), auditLog('create', 'department'), departmentController.createDepartment);
router.put('/departments/:id', authenticate, authorize('org-admin'), validate(schemas.updateDepartment), auditLog('update', 'department'), departmentController.updateDepartment);
router.delete('/departments/:id', authenticate, authorize('org-admin'), auditLog('delete', 'department'), departmentController.deleteDepartment);

// ==================== SECTIONS ====================
router.get('/sections', authenticate, sectionController.getSections);
router.get('/sections/:id', authenticate, sectionController.getSectionById);
router.post('/sections', authenticate, authorize('org-admin'), validate(schemas.createSection), auditLog('create', 'section'), sectionController.createSection);
router.put('/sections/:id', authenticate, authorize('org-admin'), validate(schemas.updateSection), auditLog('update', 'section'), sectionController.updateSection);
router.delete('/sections/:id', authenticate, authorize('org-admin'), auditLog('delete', 'section'), sectionController.deleteSection);

// ==================== ORGANIZATIONAL STRUCTURE (Aliases) ====================
// Rotas alternativas para compatibilidade com frontend
router.get('/organizational-structure/directions', authenticate, directionController.getDirections);
router.get('/organizational-structure/directions/:id', authenticate, directionController.getDirectionById);
router.post('/organizational-structure/directions', authenticate, authorize('org-admin'), validate(schemas.createDirection), auditLog('create', 'direction'), directionController.createDirection);
router.put('/organizational-structure/directions/:id', authenticate, authorize('org-admin'), validate(schemas.updateDirection), auditLog('update', 'direction'), directionController.updateDirection);
router.delete('/organizational-structure/directions/:id', authenticate, authorize('org-admin'), auditLog('delete', 'direction'), directionController.deleteDirection);

router.get('/organizational-structure/departments', authenticate, departmentController.getDepartments);
router.get('/organizational-structure/departments/:id', authenticate, departmentController.getDepartmentById);
router.post('/organizational-structure/departments', authenticate, authorize('org-admin'), validate(schemas.createDepartment), auditLog('create', 'department'), departmentController.createDepartment);
router.put('/organizational-structure/departments/:id', authenticate, authorize('org-admin'), validate(schemas.updateDepartment), auditLog('update', 'department'), departmentController.updateDepartment);
router.delete('/organizational-structure/departments/:id', authenticate, authorize('org-admin'), auditLog('delete', 'department'), departmentController.deleteDepartment);

router.get('/organizational-structure/sections', authenticate, sectionController.getSections);
router.get('/organizational-structure/sections/:id', authenticate, sectionController.getSectionById);
router.post('/organizational-structure/sections', authenticate, authorize('org-admin'), validate(schemas.createSection), auditLog('create', 'section'), sectionController.createSection);
router.put('/organizational-structure/sections/:id', authenticate, authorize('org-admin'), validate(schemas.updateSection), auditLog('update', 'section'), sectionController.updateSection);
router.delete('/organizational-structure/sections/:id', authenticate, authorize('org-admin'), auditLog('delete', 'section'), sectionController.deleteSection);

// ==================== CATEGORIES (DEPRECATED - Redireciona para Catalog) ====================
// As rotas de /api/categories agora usam catalog_categories como fonte única
router.get('/categories', authenticate, catalogController.getCatalogCategories);
router.get('/categories/:id', authenticate, catalogController.getCategoryById);
router.post('/categories', authenticate, authorize('org-admin', 'agent'), auditLog('create', 'catalog_category'), catalogController.createCatalogCategory);
router.put('/categories/:id', authenticate, authorize('org-admin', 'agent'), auditLog('update', 'catalog_category'), catalogController.updateCatalogCategory);
router.delete('/categories/:id', authenticate, authorize('org-admin'), auditLog('delete', 'catalog_category'), catalogController.deleteCatalogCategory);

// ==================== KNOWLEDGE BASE ====================
router.get('/knowledge', authenticate, requirePermission('knowledge', 'read'), knowledgeController.getArticles);
router.get('/knowledge/:id', authenticate, requirePermission('knowledge', 'read'), knowledgeController.getArticleById);
router.post('/knowledge', authenticate, requirePermission('knowledge', 'create'), auditLog('create', 'knowledge'), knowledgeController.createArticle);
router.put('/knowledge/:id', authenticate, requirePermission('knowledge', 'update'), auditLog('update', 'knowledge'), knowledgeController.updateArticle);
router.delete('/knowledge/:id', authenticate, requirePermission('knowledge', 'delete'), auditLog('delete', 'knowledge'), knowledgeController.deleteArticle);

// ==================== SLAs ====================
router.get('/slas', authenticate, slaController.getSLAs);
router.get('/slas/priority/:priority', authenticate, slaController.getSLAByPriority);
router.get('/slas/:id', authenticate, slaController.getSLAById);
router.post('/slas', authenticate, requirePermission('settings', 'manage_sla'), auditLog('create', 'sla'), slaController.createSLA);
router.put('/slas/:id', authenticate, requirePermission('settings', 'manage_sla'), auditLog('update', 'sla'), slaController.updateSLA);
router.delete('/slas/:id', authenticate, requirePermission('settings', 'manage_sla'), auditLog('delete', 'sla'), slaController.deleteSLA);

// ==================== PRIORITIES ====================
router.get('/priorities', authenticate, priorityController.getPriorities);
router.get('/priorities/:id', authenticate, priorityController.getPriorityById);
router.post('/priorities', authenticate, authorize('org-admin'), validate(schemas.createPriority), auditLog('create', 'priority'), priorityController.createPriority);
router.put('/priorities/:id', authenticate, authorize('org-admin'), validate(schemas.updatePriority), auditLog('update', 'priority'), priorityController.updatePriority);
router.delete('/priorities/:id', authenticate, authorize('org-admin'), auditLog('delete', 'priority'), priorityController.deletePriority);

// ==================== TYPES ====================
router.get('/types', authenticate, typeController.getTypes);
router.get('/types/:id', authenticate, typeController.getTypeById);
router.post('/types', authenticate, authorize('org-admin'), validate(schemas.createType), auditLog('create', 'type'), typeController.createType);
router.put('/types/:id', authenticate, authorize('org-admin'), validate(schemas.updateType), auditLog('update', 'type'), typeController.updateType);
router.delete('/types/:id', authenticate, authorize('org-admin'), auditLog('delete', 'type'), typeController.deleteType);

// ==================== PROVIDER (Multi-Tenant Management) ====================
import providerRoutes from './providerRoutes.js';
router.use('/provider', providerRoutes);

// ==================== ORGANIZATIONS (Alias para Provider/Tenants - Compatibilidade Backoffice) ====================
import * as providerController from '../modules/organizations/providerController.js';

// Rotas de organizações (alias para tenants)
router.get('/organizations', authenticate, authorize('super-admin', 'provider-admin'), providerController.getTenants);
router.get('/organizations/:id', authenticate, authorize('super-admin', 'provider-admin'), providerController.getTenantById);
router.post('/organizations', authenticate, authorize('super-admin', 'provider-admin'), auditLog('create', 'organization'), providerController.createTenant);
router.put('/organizations/:id', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'organization'), providerController.updateTenant);
router.post('/organizations/:id/suspend', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'organization'), providerController.suspendTenant);
router.post('/organizations/:id/activate', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'organization'), providerController.activateTenant);
router.get('/organizations/:id/users', authenticate, authorize('super-admin', 'provider-admin'), providerController.getOrganizationUsers);
router.get('/organizations/:id/clients', authenticate, authorize('super-admin', 'provider-admin'), providerController.getOrganizationClients);

// ==================== SAAS (Onboarding & Plan Management) ====================
router.use('/saas', saasRoutes);

// ==================== PLANS (Gestão de Planos SaaS) ====================
import * as planController from '../modules/plans/planController.js';

// Rota pública - planos para landing page
router.get('/plans/public', planController.getPublicPlans);

// Rotas admin - requer autenticação
router.get('/plans', authenticate, authorize('super-admin', 'provider-admin'), planController.getPlans);
router.get('/plans/:id', authenticate, authorize('super-admin', 'provider-admin'), planController.getPlanById);
router.post('/plans', authenticate, authorize('super-admin', 'provider-admin'), auditLog('create', 'plan'), planController.createPlan);
router.put('/plans/:id', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'plan'), planController.updatePlan);
router.delete('/plans/:id', authenticate, authorize('super-admin', 'provider-admin'), auditLog('delete', 'plan'), planController.deletePlan);
router.put('/plans/:id/activate', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'plan'), planController.activatePlan);
router.put('/plans/:id/deactivate', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'plan'), planController.deactivatePlan);
router.get('/plans/:id/subscriptions', authenticate, authorize('super-admin', 'provider-admin'), planController.getPlanSubscriptions);

// ==================== SUBSCRIPTIONS (Gestão de Subscrições) ====================
import * as subscriptionController from '../modules/subscriptions/subscriptionController.js';

router.get('/subscriptions', authenticate, authorize('super-admin', 'provider-admin'), subscriptionController.getSubscriptions);
router.get('/subscriptions/pending', authenticate, authorize('super-admin', 'provider-admin'), subscriptionController.getPendingSubscriptions);
router.get('/subscriptions/stats', authenticate, authorize('super-admin', 'provider-admin'), subscriptionController.getSubscriptionStats);
router.get('/subscriptions/:id', authenticate, authorize('super-admin', 'provider-admin'), subscriptionController.getSubscriptionById);
router.put('/subscriptions/:id/plan', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'subscription'), subscriptionController.changePlan);
router.put('/subscriptions/:id/approve', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'subscription'), subscriptionController.approveSubscription);
router.put('/subscriptions/:id/reject', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'subscription'), subscriptionController.rejectSubscription);
router.put('/subscriptions/:id/cancel', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'subscription'), subscriptionController.cancelSubscription);
router.put('/subscriptions/:id/reactivate', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'subscription'), subscriptionController.reactivateSubscription);
router.put('/subscriptions/:id/extend-trial', authenticate, authorize('super-admin', 'provider-admin'), auditLog('update', 'subscription'), subscriptionController.extendTrial);

// ==================== LANDING PAGE (CMS) ====================
// Rota pública - não requer autenticação
router.get('/landing-page/config', landingPageController.getConfig);
// Rotas admin - requer autenticação e role super-admin/provider-admin
router.put('/landing-page/config', authenticate, authorize('super-admin', 'provider-admin'), landingPageController.updateConfig);
router.post('/landing-page/config/reset', authenticate, authorize('super-admin', 'provider-admin'), landingPageController.resetConfig);
router.get('/landing-page/config/history', authenticate, authorize('super-admin', 'provider-admin'), landingPageController.getConfigHistory);

// ==================== CLIENTS B2B (Nova Arquitetura) ====================
import clientRoutes from './clientRoutes.js';
import clientUserRoutes from './clientUserRoutes.js';
import * as clientUserManagementController from '../modules/clients/clientUserManagementController.js';
router.use('/clients-b2b', clientRoutes);
router.use('/client-users-b2b', clientUserRoutes);

// ==================== CLIENTS (Compatibilidade com Frontend) ====================
// Rotas de compatibilidade - redirecionam para o novo controller
router.use('/clients', clientRoutes); // Mesmas rotas que /clients-b2b
router.use('/client-users', clientUserRoutes); // Mesmas rotas que /client-users-b2b

// ==================== CLIENT USERS (Rotas de gestão de utilizadores de clientes) ====================
// Listar e criar utilizadores de um cliente
router.get('/clients/:clientId/users', authenticate, requireSmartPermission('client_users', 'read'), clientUserManagementController.getClientUsers);
router.post('/clients/:clientId/users', authenticate, requireSmartPermission('client_users', 'create'), auditLog('create', 'client_user'), clientUserManagementController.createClientUser);
// Operações em utilizador específico
router.get('/clients/:clientId/users/:userId', authenticate, requireSmartPermission('client_users', 'read'), clientUserManagementController.getClientUserById);
router.put('/clients/:clientId/users/:userId', authenticate, requireSmartPermission('client_users', 'update'), auditLog('update', 'client_user'), clientUserManagementController.updateClientUser);
router.put('/clients/:clientId/users/:userId/activate', authenticate, requireSmartPermission('client_users', 'update'), auditLog('update', 'client_user'), clientUserManagementController.activateClientUser);
router.put('/clients/:clientId/users/:userId/reset-password', authenticate, requireSmartPermission('client_users', 'update'), auditLog('update', 'client_user'), clientUserManagementController.resetPasswordByAdmin);
router.delete('/clients/:clientId/users/:userId', authenticate, requireSmartPermission('client_users', 'delete'), auditLog('delete', 'client_user'), clientUserManagementController.deleteClientUser);

// ==================== CLIENT STRUCTURE (Estrutura organizacional) ====================
// Directions
router.get('/client/directions', authenticate, requirePermission('directions', 'read'), clientStructureController.getDirections);
router.post('/client/directions', authenticate, requirePermission('directions', 'create'), auditLog('create', 'client_direction'), clientStructureController.createDirection);
router.put('/client/directions/:id', authenticate, requirePermission('directions', 'update'), auditLog('update', 'client_direction'), clientStructureController.updateDirection);
router.delete('/client/directions/:id', authenticate, requirePermission('directions', 'delete'), auditLog('delete', 'client_direction'), clientStructureController.deleteDirection);
router.put('/client/directions/:id/activate', authenticate, requirePermission('directions', 'update'), auditLog('activate', 'client_direction'), clientStructureController.reactivateDirection);
// Departments
router.get('/client/departments', authenticate, requirePermission('departments', 'read'), clientStructureController.getDepartments);
router.post('/client/departments', authenticate, requirePermission('departments', 'create'), auditLog('create', 'client_department'), clientStructureController.createDepartment);
router.put('/client/departments/:id', authenticate, requirePermission('departments', 'update'), auditLog('update', 'client_department'), clientStructureController.updateDepartment);
router.delete('/client/departments/:id', authenticate, requirePermission('departments', 'delete'), auditLog('delete', 'client_department'), clientStructureController.deleteDepartment);
router.put('/client/departments/:id/activate', authenticate, requirePermission('departments', 'update'), auditLog('activate', 'client_department'), clientStructureController.reactivateDepartment);
// Sections
router.get('/client/sections', authenticate, requirePermission('sections', 'read'), clientStructureController.getSections);
router.post('/client/sections', authenticate, requirePermission('sections', 'create'), auditLog('create', 'client_section'), clientStructureController.createSection);
router.put('/client/sections/:id', authenticate, requirePermission('sections', 'update'), auditLog('update', 'client_section'), clientStructureController.updateSection);
router.delete('/client/sections/:id', authenticate, requirePermission('sections', 'delete'), auditLog('delete', 'client_section'), clientStructureController.deleteSection);
router.put('/client/sections/:id/activate', authenticate, requirePermission('sections', 'update'), auditLog('activate', 'client_section'), clientStructureController.reactivateSection);
// Users
router.get('/client/users', authenticate, requirePermission('client_users', 'read'), clientStructureController.getClientUsers);
router.post('/client/users', authenticate, requirePermission('client_users', 'create'), auditLog('create', 'client_user'), clientStructureController.createClientUser);
router.put('/client/users/:id', authenticate, requirePermission('client_users', 'update'), auditLog('update', 'client_user'), clientStructureController.updateClientUser);
router.delete('/client/users/:id', authenticate, requirePermission('client_users', 'delete'), auditLog('delete', 'client_user'), clientStructureController.deleteClientUser);

// ==================== CLIENT HOURS BANK (Bolsa de Horas - Cliente) ====================
router.get('/client/hours-banks', authenticate, requirePermission('hours_bank', 'view'), clientHoursController.getClientHoursBanks);
router.get('/client/hours-banks/:id', authenticate, requirePermission('hours_bank', 'view'), clientHoursController.getClientHoursBankById);
router.get('/client/hours-banks/:id/transactions', authenticate, requirePermission('hours_bank', 'view'), clientHoursController.getClientHoursBankTransactions);
router.get('/client/hours-transactions', authenticate, requirePermission('hours_bank', 'view'), clientHoursController.getClientAllTransactions);

// ==================== CLIENT TODOS (Tarefas do Cliente) ====================
import * as todoController from '../modules/todos/todoController.js';
router.get('/client/todos', authenticate, todoController.getTodos);
router.post('/client/todos', authenticate, todoController.createTodo);
router.put('/client/todos/reorder', authenticate, todoController.reorderTodos);
router.get('/client/todos/users', authenticate, todoController.getAvailableUsers);
router.put('/client/todos/:id', authenticate, todoController.updateTodo);
router.put('/client/todos/:id/move', authenticate, todoController.moveTodo);
router.delete('/client/todos/:id', authenticate, todoController.deleteTodo);
router.post('/client/todos/:id/collaborators', authenticate, todoController.addCollaborator);
router.delete('/client/todos/:id/collaborators/:collaboratorId', authenticate, todoController.removeCollaborator);

// ==================== HOURS BANK (Bolsa de Horas) ====================
router.get('/hours-banks', authenticate, requirePermission('hours_bank', 'view'), hoursController.getHoursBanks);
router.get('/hours-banks/statistics', authenticate, requirePermission('hours_bank', 'view'), hoursController.getStatistics);
router.get('/hours-banks/:id', authenticate, requirePermission('hours_bank', 'view'), hoursController.getHoursBankById);
router.post('/hours-banks', authenticate, requirePermission('hours_bank', 'manage'), auditLog('create', 'hours_bank'), hoursController.createHoursBank);
router.put('/hours-banks/:id', authenticate, requirePermission('hours_bank', 'manage'), auditLog('update', 'hours_bank'), hoursController.updateHoursBank);
router.post('/hours-banks/:id/add', authenticate, requirePermission('hours_bank', 'manage'), auditLog('update', 'hours_bank'), hoursController.addHours);
router.post('/hours-banks/:id/consume', authenticate, requirePermission('hours_bank', 'consume'), auditLog('update', 'hours_bank'), hoursController.consumeHours);
router.post('/hours-banks/:id/adjust', authenticate, requirePermission('hours_bank', 'manage'), auditLog('update', 'hours_bank'), hoursController.adjustHours);

// Hours Transactions
router.get('/hours-transactions', authenticate, requirePermission('hours_bank', 'view'), hoursController.getTransactions);

// Tickets para consumo de horas
router.get('/hours-banks/tickets/completed', authenticate, requirePermission('hours_bank', 'view'), hoursController.getCompletedTickets);

// ==================== TIME TRACKING (Cronômetro) ====================
router.post('/tickets/:ticketId/timer/start', authenticate, timeTrackingController.startTimer);
router.put('/timers/:id/pause', authenticate, timeTrackingController.pauseTimer);
router.put('/timers/:id/resume', authenticate, timeTrackingController.resumeTimer);
router.put('/timers/:id/stop', authenticate, timeTrackingController.stopTimer);
router.get('/tickets/:ticketId/timer/active', authenticate, timeTrackingController.getActiveTimer);
router.get('/tickets/:ticketId/timers', authenticate, timeTrackingController.getTicketTimers);

// ==================== TAGS ====================
router.get('/tags', authenticate, tagController.getTags);
router.post('/tags', authenticate, authorize('org-admin'), auditLog('create', 'tag'), tagController.createTag);
router.put('/tags/:id', authenticate, authorize('org-admin'), auditLog('update', 'tag'), tagController.updateTag);
router.delete('/tags/:id', authenticate, authorize('org-admin'), auditLog('delete', 'tag'), tagController.deleteTag);
router.post('/tickets/:ticketId/tags', authenticate, tagController.addTagToTicket);
router.delete('/tickets/:ticketId/tags/:tagId', authenticate, tagController.removeTagFromTicket);
router.get('/tickets/:ticketId/tags', authenticate, tagController.getTicketTags);

// ==================== RESPONSE TEMPLATES ====================
router.get('/templates', authenticate, templateController.getTemplates);
router.post('/templates', authenticate, auditLog('create', 'template'), templateController.createTemplate);
router.get('/templates/:id', authenticate, templateController.getTemplateById);
router.put('/templates/:id', authenticate, auditLog('update', 'template'), templateController.updateTemplate);
router.delete('/templates/:id', authenticate, auditLog('delete', 'template'), templateController.deleteTemplate);

// ==================== TICKET MERGE ====================
router.post('/tickets/merge', authenticate, authorize('org-admin', 'agent'), auditLog('update', 'ticket'), ticketMergeController.mergeTickets);
router.get('/tickets/:ticketId/duplicates', authenticate, ticketMergeController.findDuplicates);

// ==================== SERVICE CATALOG (V1 - LEGACY) ====================
// ❌ DEPRECATED - Usar catalogRoutes.js V2 (com hierarquia e tipos)
// router.get('/catalog/categories', authenticate, requirePermission('catalog', 'read'), catalogController.getCatalogCategories);
// router.post('/catalog/categories', authenticate, requirePermission('catalog', 'manage'), auditLog('create', 'catalog_category'), catalogController.createCatalogCategory);
// router.put('/catalog/categories/:id', authenticate, requirePermission('catalog', 'manage'), auditLog('update', 'catalog_category'), catalogController.updateCatalogCategory);
// router.delete('/catalog/categories/:id', authenticate, requirePermission('catalog', 'manage'), auditLog('delete', 'catalog_category'), catalogController.deleteCatalogCategory);
// router.get('/catalog/items', authenticate, requirePermission('catalog', 'read'), catalogController.getCatalogItems);
// router.get('/catalog/items/:id', authenticate, requirePermission('catalog', 'read'), catalogController.getCatalogItemById);
// router.post('/catalog/items', authenticate, requirePermission('catalog', 'manage'), auditLog('create', 'catalog_item'), catalogController.createCatalogItem);
// router.put('/catalog/items/:id', authenticate, requirePermission('catalog', 'manage'), auditLog('update', 'catalog_item'), catalogController.updateCatalogItem);
// router.delete('/catalog/items/:id', authenticate, requirePermission('catalog', 'manage'), auditLog('delete', 'catalog_item'), catalogController.deleteCatalogItem);
// router.post('/catalog/requests', authenticate, requirePermission('catalog', 'request'), auditLog('create', 'service_request'), catalogController.createServiceRequest);
// router.get('/catalog/requests', authenticate, requirePermission('catalog', 'read'), catalogController.getServiceRequests);
// router.post('/catalog/requests/:id/approve', authenticate, requirePermission('catalog', 'manage'), auditLog('update', 'service_request'), catalogController.approveServiceRequest);
// router.get('/catalog/statistics', authenticate, catalogController.getCatalogStatistics);

// ==================== NOTIFICATIONS ====================
router.get('/notifications', authenticate, notificationController.getNotifications);
router.get('/notifications/unread-count', authenticate, notificationController.getUnreadCount);
router.patch('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.patch('/notifications/mark-all-read', authenticate, notificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, notificationController.deleteNotification);

// ==================== INVENTORY ====================
router.get('/inventory/assets', authenticate, requireSmartPermission('assets', 'read'), inventoryController.getAssets);
router.get('/inventory/assets/:id', authenticate, requireSmartPermission('assets', 'read'), inventoryController.getAssetById);
router.post('/inventory/assets', authenticate, requireSmartPermission('assets', 'create'), auditLog('create', 'asset'), inventoryController.createAsset);
router.put('/inventory/assets/:id', authenticate, requireSmartPermission('assets', 'update'), auditLog('update', 'asset'), inventoryController.updateAsset);
router.delete('/inventory/assets/:id', authenticate, requireSmartPermission('assets', 'delete'), auditLog('delete', 'asset'), inventoryController.deleteAsset);
router.get('/inventory/statistics', authenticate, requireSmartPermission('assets', 'read'), inventoryController.getStatistics);

// Software
router.get('/inventory/software', authenticate, requireSmartPermission('assets', 'read'), inventoryController.getSoftware);
router.post('/inventory/software', authenticate, requireSmartPermission('assets', 'create'), auditLog('create', 'software'), inventoryController.addSoftware);
router.delete('/inventory/software/:id', authenticate, requireSmartPermission('assets', 'delete'), auditLog('delete', 'software'), inventoryController.deleteSoftware);

// Licenses
router.get('/inventory/licenses', authenticate, requireSmartPermission('assets', 'read'), inventoryController.getLicenses);
router.get('/inventory/licenses/:id', authenticate, requireSmartPermission('assets', 'read'), inventoryController.getLicenseById);
router.post('/inventory/licenses', authenticate, requireSmartPermission('assets', 'create'), auditLog('create', 'license'), inventoryController.createLicense);
router.put('/inventory/licenses/:id', authenticate, requireSmartPermission('assets', 'update'), auditLog('update', 'license'), inventoryController.updateLicense);
router.delete('/inventory/licenses/:id', authenticate, requireSmartPermission('assets', 'delete'), auditLog('delete', 'license'), inventoryController.deleteLicense);
router.post('/inventory/licenses/:id/assign', authenticate, requireSmartPermission('assets', 'update'), auditLog('update', 'license'), inventoryController.assignLicense);
router.post('/inventory/licenses/:id/unassign', authenticate, requireSmartPermission('assets', 'update'), auditLog('update', 'license'), inventoryController.unassignLicense);

// Statistics
router.get('/inventory/statistics', authenticate, inventoryController.getStatistics);

// Browser Collection (comentado temporariamente - controller não existe)
// router.post('/inventory/browser-collect', authenticate, inventoryController.browserCollect);

// Desktop Agent Collection
router.post('/inventory/agent-collect', authenticate, inventoryController.agentCollect);

// Organization Inventory
router.get('/inventory/organization/users', authenticate, requirePermission('assets', 'read_all'), inventoryController.getOrganizationUsers);
router.get('/inventory/organization/statistics', authenticate, requirePermission('assets', 'read_all'), inventoryController.getOrganizationInventoryStats);

// Clients Inventory
router.get('/inventory/clients', authenticate, requirePermission('assets', 'read_all'), inventoryController.getClientsWithInventory);
router.get('/inventory/clients/statistics', authenticate, requirePermission('assets', 'read_all'), inventoryController.getClientsInventoryStats);
router.get('/inventory/clients/:clientId', authenticate, requirePermission('assets', 'read_all'), inventoryController.getClientInventory);

// User Inventory
router.get('/inventory/users/:userId', authenticate, requirePermission('assets', 'read_all'), inventoryController.getUserInventory);

// ==================== REMOTE ACCESS ====================
router.use('/remote-access', remoteAccessRoutes);

// ==================== STATUS PAGE ====================
import statusPageRoutes from '../modules/statusPage/statusPageRoutes.js';
router.use('/status', statusPageRoutes);

// ==================== ADVANCED TEMPLATES ====================
import advancedTemplateRoutes from '../modules/templates/advancedTemplateRoutes.js';
router.use('/advanced-templates', advancedTemplateRoutes);

// ==================== WORKFLOW ENGINE ====================
import workflowRoutes from '../modules/workflow/workflowRoutes.js';
router.use('/workflow', workflowRoutes);

// ==================== BUSINESS INTELLIGENCE ====================
import biRoutes from '../modules/bi/biRoutes.js';
router.use('/bi', biRoutes);

// ==================== GLOBAL SEARCH ====================
import searchRoutes from '../modules/search/searchRoutes.js';
router.use('/search', searchRoutes);

// ==================== COLLABORATION ====================
import collaborationRoutes from '../modules/collaboration/collaborationRoutes.js';
router.use('/collaboration', collaborationRoutes);

// ==================== GAMIFICATION ====================
import gamificationRoutes from '../modules/gamification/gamificationRoutes.js';
router.use('/gamification', gamificationRoutes);

// ==================== SECURITY ====================
import securityRoutes from '../modules/security/securityRoutes.js';
router.use('/security', securityRoutes);

// ==================== INTEGRATIONS ====================
import integrationRoutes from '../modules/integrations/integrationRoutes.js';
router.use('/integrations', integrationRoutes);

// ==================== SERVICE CATALOG V2 (Com Hierarquia e Tipos) ====================
import catalogRoutes from '../modules/catalog/catalogRoutes.js';
router.use('/catalog', catalogRoutes);

// ==================== RBAC (Role-Based Access Control) ====================
import rbacRoutes from './rbacRoutes.js';
router.use('/rbac', rbacRoutes);

// ==================== EMAIL TEST ====================
router.use('/', emailTestRoutes);

// ==================== DEBUG ROUTES ====================
router.use('/', debugRoutes);
router.use('/', debugUserRoutes);

// ==================== FIX ROUTES (Admin only) ====================
router.use('/', fixTicketsRoutes);

// ==================== DOWNLOADS (Desktop Agent) ====================
router.get('/downloads/agent/info', downloadController.getAgentInfo);
router.get('/downloads/agent/:platform', downloadController.downloadAgent);
router.post('/downloads/agent/upload', authenticate, downloadController.uploadAgent);
router.delete('/downloads/agent/:filename', authenticate, downloadController.deleteAgent);

// ==================== PROJECT MANAGEMENT ====================
import projectRoutes from '../modules/projects/projectRoutes.js';
router.use('/projects', projectRoutes);

export default router;
