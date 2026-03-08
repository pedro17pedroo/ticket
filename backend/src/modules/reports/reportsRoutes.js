import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { checkPermission } from '../../middleware/rbac.js';
import {
  getHoursByTicket,
  getHoursByUser,
  getMonthlyReportByUser,
  getHoursByClient,
  getDailyReport,
  getClientSummary,
  getTicketDetailedReport
} from './reportsController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @route   GET /api/reports/hours-by-ticket
 * @desc    Relatório de horas por ticket
 * @access  Private (requer permissão reports.view)
 * @query   startDate, endDate, ticketId, status
 */
router.get(
  '/hours-by-ticket',
  checkPermission('reports.view'),
  getHoursByTicket
);

/**
 * @route   GET /api/reports/hours-by-user
 * @desc    Relatório de horas por usuário
 * @access  Private (requer permissão reports.view)
 * @query   startDate, endDate, userId
 */
router.get(
  '/hours-by-user',
  checkPermission('reports.view'),
  getHoursByUser
);

/**
 * @route   GET /api/reports/monthly-by-user
 * @desc    Relatório mensal por usuário
 * @access  Private (requer permissão reports.view)
 * @query   year, userId
 */
router.get(
  '/monthly-by-user',
  checkPermission('reports.view'),
  getMonthlyReportByUser
);

/**
 * @route   GET /api/reports/hours-by-client
 * @desc    Relatório de horas por cliente
 * @access  Private (requer permissão reports.view)
 * @query   startDate, endDate, clientId
 */
router.get(
  '/hours-by-client',
  checkPermission('reports.view'),
  getHoursByClient
);

/**
 * @route   GET /api/reports/daily
 * @desc    Relatório diário de horas
 * @access  Private (requer permissão reports.view)
 * @query   startDate, endDate, userId, clientId
 */
router.get(
  '/daily',
  checkPermission('reports.view'),
  getDailyReport
);

/**
 * @route   GET /api/reports/client-summary
 * @desc    Resumo básico por cliente
 * @access  Private (requer permissão reports.view)
 * @query   clientId (opcional)
 */
router.get(
  '/client-summary',
  checkPermission('reports.view'),
  getClientSummary
);

/**
 * @route   GET /api/reports/ticket/:ticketId/detailed
 * @desc    Relatório detalhado de um ticket específico
 * @access  Private (requer permissão reports.view)
 */
router.get(
  '/ticket/:ticketId/detailed',
  checkPermission('reports.view'),
  getTicketDetailedReport
);

export default router;
