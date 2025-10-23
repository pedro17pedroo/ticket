import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import { auditLog } from '../middleware/audit.js';
import { upload } from '../middleware/upload.js';
import uploadConfig from '../config/multer.js';

import * as authController from '../modules/auth/authController.js';
import * as userController from '../modules/users/userController.js';
import * as ticketController from '../modules/tickets/ticketController.js';
import * as departmentController from '../modules/departments/departmentController.js';
import * as categoryController from '../modules/categories/categoryController.js';
import * as knowledgeController from '../modules/knowledge/knowledgeController.js';
import * as slaController from '../modules/slas/slaController.js';
import * as priorityController from '../modules/priorities/priorityController.js';
import * as typeController from '../modules/types/typeController.js';
import * as directionController from '../modules/directions/directionController.js';
import * as sectionController from '../modules/sections/sectionController.js';
import * as clientController from '../modules/clients/clientController.js';
import * as clientUsersController from '../modules/clients/clientUsersController.js';
import * as clientUserController from '../modules/users/clientUserController.js';
import * as clientStructureController from '../modules/clients/clientStructureController.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'TatuTicket Backend'
  });
});

// ==================== AUTH ====================
router.post('/auth/register', validate(schemas.register), authController.register);
router.post('/auth/login', validate(schemas.login), authController.login);
router.get('/auth/profile', authenticate, authController.getProfile);
router.put('/auth/profile', authenticate, validate(schemas.updateProfile), authController.updateProfile);
router.put('/auth/change-password', authenticate, validate(schemas.changePassword), authController.changePassword);
router.get('/auth/users', authenticate, authController.getUsers);

// ==================== CLIENT PORTAL USERS ====================
router.get('/client/users', authenticate, clientUserController.getClientUsers);
router.post('/client/users', authenticate, validate(schemas.createClientUser), auditLog('create', 'client_user'), clientUserController.createClientUser);
router.put('/client/users/:id', authenticate, validate(schemas.updateClientUser), auditLog('update', 'client_user'), clientUserController.updateClientUser);
router.put('/client/users/:id/activate', authenticate, auditLog('update', 'client_user'), clientUserController.activateClientUser);
router.put('/client/users/:id/reset-password', authenticate, validate(schemas.resetPassword), auditLog('update', 'client_user'), clientUserController.resetClientUserPassword);
router.delete('/client/users/:id', authenticate, auditLog('delete', 'client_user'), clientUserController.deleteClientUser);

// ==================== USERS ====================
router.get('/users', authenticate, authorize('admin-org'), userController.getUsers);
router.get('/users/:id', authenticate, authorize('admin-org'), userController.getUserById);
router.post('/users', authenticate, authorize('admin-org'), validate(schemas.createUser), auditLog('create', 'user'), userController.createUser);
router.put('/users/:id', authenticate, authorize('admin-org'), validate(schemas.updateUser), auditLog('update', 'user'), userController.updateUser);
router.put('/users/:id/activate', authenticate, authorize('admin-org'), auditLog('update', 'user'), userController.activateUser);
router.put('/users/:id/reset-password', authenticate, authorize('admin-org'), validate(schemas.resetPassword), auditLog('update', 'user'), userController.resetPassword);
router.delete('/users/:id', authenticate, authorize('admin-org'), auditLog('delete', 'user'), userController.deleteUser);

// ==================== TICKETS ====================
router.get('/tickets', authenticate, ticketController.getTickets);
router.get('/tickets/statistics', authenticate, ticketController.getStatistics);
router.get('/tickets/:id', authenticate, ticketController.getTicketById);
router.post('/tickets', authenticate, validate(schemas.createTicket), auditLog('create', 'ticket'), ticketController.createTicket);
router.put('/tickets/:id', authenticate, validate(schemas.updateTicket), auditLog('update', 'ticket'), ticketController.updateTicket);
router.post('/tickets/:id/comments', authenticate, validate(schemas.createComment), auditLog('create', 'comment'), ticketController.addComment);

// Ticket Attachments
router.post('/tickets/:ticketId/upload', authenticate, uploadConfig.array('files', 5), auditLog('create', 'attachment'), ticketController.uploadAttachments);
router.get('/tickets/:ticketId/attachments', authenticate, ticketController.getAttachments);
router.get('/tickets/:ticketId/attachments/:attachmentId/download', authenticate, ticketController.downloadAttachment);
router.delete('/tickets/:ticketId/attachments/:attachmentId', authenticate, auditLog('delete', 'attachment'), ticketController.deleteAttachment);

// ==================== DIRECTIONS ====================
router.get('/directions', authenticate, directionController.getDirections);
router.get('/directions/:id', authenticate, directionController.getDirectionById);
router.post('/directions', authenticate, authorize('admin-org'), validate(schemas.createDirection), auditLog('create', 'direction'), directionController.createDirection);
router.put('/directions/:id', authenticate, authorize('admin-org'), validate(schemas.updateDirection), auditLog('update', 'direction'), directionController.updateDirection);
router.delete('/directions/:id', authenticate, authorize('admin-org'), auditLog('delete', 'direction'), directionController.deleteDirection);

// ==================== DEPARTMENTS ====================
router.get('/departments', authenticate, departmentController.getDepartments);
router.get('/departments/:id', authenticate, departmentController.getDepartmentById);
router.post('/departments', authenticate, authorize('admin-org'), validate(schemas.createDepartment), auditLog('create', 'department'), departmentController.createDepartment);
router.put('/departments/:id', authenticate, authorize('admin-org'), validate(schemas.updateDepartment), auditLog('update', 'department'), departmentController.updateDepartment);
router.delete('/departments/:id', authenticate, authorize('admin-org'), auditLog('delete', 'department'), departmentController.deleteDepartment);

// ==================== SECTIONS ====================
router.get('/sections', authenticate, sectionController.getSections);
router.get('/sections/:id', authenticate, sectionController.getSectionById);
router.post('/sections', authenticate, authorize('admin-org'), validate(schemas.createSection), auditLog('create', 'section'), sectionController.createSection);
router.put('/sections/:id', authenticate, authorize('admin-org'), validate(schemas.updateSection), auditLog('update', 'section'), sectionController.updateSection);
router.delete('/sections/:id', authenticate, authorize('admin-org'), auditLog('delete', 'section'), sectionController.deleteSection);

// ==================== CATEGORIES ====================
router.get('/categories', authenticate, categoryController.getCategories);
router.get('/categories/:id', authenticate, categoryController.getCategoryById);
router.post('/categories', authenticate, authorize('admin-org', 'agente'), auditLog('create', 'category'), categoryController.createCategory);
router.put('/categories/:id', authenticate, authorize('admin-org', 'agente'), auditLog('update', 'category'), categoryController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin-org'), auditLog('delete', 'category'), categoryController.deleteCategory);

// ==================== KNOWLEDGE BASE ====================
router.get('/knowledge', authenticate, knowledgeController.getArticles);
router.get('/knowledge/:id', authenticate, knowledgeController.getArticleById);
router.post('/knowledge', authenticate, authorize('admin-org', 'agente'), auditLog('create', 'knowledge'), knowledgeController.createArticle);
router.put('/knowledge/:id', authenticate, authorize('admin-org', 'agente'), auditLog('update', 'knowledge'), knowledgeController.updateArticle);
router.delete('/knowledge/:id', authenticate, authorize('admin-org', 'agente'), auditLog('delete', 'knowledge'), knowledgeController.deleteArticle);

// ==================== SLAs ====================
router.get('/slas', authenticate, slaController.getSLAs);
router.get('/slas/priority/:priority', authenticate, slaController.getSLAByPriority);
router.get('/slas/:id', authenticate, slaController.getSLAById);
router.post('/slas', authenticate, authorize('admin-org'), auditLog('create', 'sla'), slaController.createSLA);
router.put('/slas/:id', authenticate, authorize('admin-org'), auditLog('update', 'sla'), slaController.updateSLA);
router.delete('/slas/:id', authenticate, authorize('admin-org'), auditLog('delete', 'sla'), slaController.deleteSLA);

// ==================== PRIORITIES ====================
router.get('/priorities', authenticate, priorityController.getPriorities);
router.get('/priorities/:id', authenticate, priorityController.getPriorityById);
router.post('/priorities', authenticate, authorize('admin-org'), validate(schemas.createPriority), auditLog('create', 'priority'), priorityController.createPriority);
router.put('/priorities/:id', authenticate, authorize('admin-org'), validate(schemas.updatePriority), auditLog('update', 'priority'), priorityController.updatePriority);
router.delete('/priorities/:id', authenticate, authorize('admin-org'), auditLog('delete', 'priority'), priorityController.deletePriority);

// ==================== TYPES ====================
router.get('/types', authenticate, typeController.getTypes);
router.get('/types/:id', authenticate, typeController.getTypeById);
router.post('/types', authenticate, authorize('admin-org'), validate(schemas.createType), auditLog('create', 'type'), typeController.createType);
router.put('/types/:id', authenticate, authorize('admin-org'), validate(schemas.updateType), auditLog('update', 'type'), typeController.updateType);
router.delete('/types/:id', authenticate, authorize('admin-org'), auditLog('delete', 'type'), typeController.deleteType);

// ==================== CLIENTS ====================
router.get('/clients', authenticate, authorize('admin-org', 'agente'), clientController.getClients);
router.get('/clients/:id', authenticate, authorize('admin-org', 'agente'), clientController.getClientById);
router.post('/clients', authenticate, authorize('admin-org'), validate(schemas.createClient), auditLog('create', 'client'), clientController.createClient);
router.put('/clients/:id', authenticate, authorize('admin-org'), validate(schemas.updateClient), auditLog('update', 'client'), clientController.updateClient);
router.put('/clients/:id/activate', authenticate, authorize('admin-org'), auditLog('update', 'client'), clientController.activateClient);
router.delete('/clients/:id', authenticate, authorize('admin-org'), auditLog('delete', 'client'), clientController.deleteClient);

// ==================== CLIENT USERS (Organização gerindo users de clientes) ====================
router.get('/clients/:clientId/users', authenticate, authorize('admin-org', 'agente'), clientUsersController.getClientUsers);
router.post('/clients/:clientId/users', authenticate, authorize('admin-org'), validate(schemas.createClientUserByOrg), auditLog('create', 'client_user'), clientUsersController.createClientUser);
router.put('/clients/:clientId/users/:userId', authenticate, authorize('admin-org'), validate(schemas.updateClientUserByOrg), auditLog('update', 'client_user'), clientUsersController.updateClientUser);
router.put('/clients/:clientId/users/:userId/activate', authenticate, authorize('admin-org'), auditLog('update', 'client_user'), clientUsersController.activateClientUser);
router.put('/clients/:clientId/users/:userId/reset-password', authenticate, authorize('admin-org'), validate(schemas.resetPassword), auditLog('update', 'client_user'), clientUsersController.resetClientUserPassword);
router.delete('/clients/:clientId/users/:userId', authenticate, authorize('admin-org'), auditLog('delete', 'client_user'), clientUsersController.deleteClientUser);

// ==================== CLIENT STRUCTURE (Estrutura organizacional das empresas clientes) ====================
// Directions
router.get('/client/directions', authenticate, authorize('cliente-org'), clientStructureController.getDirections);
router.post('/client/directions', authenticate, authorize('cliente-org'), auditLog('create', 'client_direction'), clientStructureController.createDirection);
router.put('/client/directions/:id', authenticate, authorize('cliente-org'), auditLog('update', 'client_direction'), clientStructureController.updateDirection);
router.delete('/client/directions/:id', authenticate, authorize('cliente-org'), auditLog('delete', 'client_direction'), clientStructureController.deleteDirection);

// Departments
router.get('/client/departments', authenticate, authorize('cliente-org'), clientStructureController.getDepartments);
router.post('/client/departments', authenticate, authorize('cliente-org'), auditLog('create', 'client_department'), clientStructureController.createDepartment);
router.put('/client/departments/:id', authenticate, authorize('cliente-org'), auditLog('update', 'client_department'), clientStructureController.updateDepartment);
router.delete('/client/departments/:id', authenticate, authorize('cliente-org'), auditLog('delete', 'client_department'), clientStructureController.deleteDepartment);

// Sections
router.get('/client/sections', authenticate, authorize('cliente-org'), clientStructureController.getSections);
router.post('/client/sections', authenticate, authorize('cliente-org'), auditLog('create', 'client_section'), clientStructureController.createSection);
router.put('/client/sections/:id', authenticate, authorize('cliente-org'), auditLog('update', 'client_section'), clientStructureController.updateSection);
router.delete('/client/sections/:id', authenticate, authorize('cliente-org'), auditLog('delete', 'client_section'), clientStructureController.deleteSection);

export default router;
