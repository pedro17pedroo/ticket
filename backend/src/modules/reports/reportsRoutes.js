import express from 'express';
import {
  getHoursByTicket,
  getHoursByUser,
  getHoursByClient,
  getDailyReport,
  getClientSummary,
  getTicketDetailedReport
} from './reportsController.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permission.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @route   GET /api/reports/hours-by-ticket
 * @desc    Relatório de horas por ticket
 * @access  Private (org-admin, org-manager, org-agent)
 * @query   startDate, endDate, ticketId, status
 */
router.get(
  '/hours-by-ticket',
  requirePermission('reports', 'read'),
  getHoursByTicket
);

/**
 * @route   GET /api/reports/hours-by-user
 * @desc    Relatório de horas por usuário (mensal)
 * @access  Private (org-admin, org-manager)
 * @query   startDate, endDate, userId, month, year
 */
router.get(
  '/hours-by-user',
  requirePermission('reports', 'read'),
  getHoursByUser
);

/**
 * @route   GET /api/reports/hours-by-client
 * @desc    Relatório de horas por cliente/empresa
 * @access  Private (org-admin, org-manager)
 * @query   startDate, endDate, clientId
 */
router.get(
  '/hours-by-client',
  requirePermission('reports', 'read'),
  getHoursByClient
);

/**
 * @route   GET /api/reports/hours-by-day
 * @desc    Relatório de horas por dia
 * @access  Private (org-admin, org-manager, org-agent)
 * @query   startDate, endDate, userId, clientId, groupBy
 */
router.get(
  '/hours-by-day',
  requirePermission('reports', 'read'),
  getDailyReport
);

/**
 * @route   GET /api/reports/client-summary
 * @desc    Resumo básico por cliente
 * @access  Private (org-admin, org-manager)
 * @query   clientId
 */
router.get(
  '/client-summary',
  requirePermission('reports', 'read'),
  getClientSummary
);

/**
 * @route   GET /api/reports/user/:userId/detailed
 * @desc    Relatório detalhado de um usuário específico
 * @access  Private (org-admin, org-manager)
 * @params  userId
 * @query   startDate, endDate
 */
router.get(
  '/user/:userId/detailed',
  requirePermission('reports', 'read'),
  getTicketDetailedReport
);

export default router;
