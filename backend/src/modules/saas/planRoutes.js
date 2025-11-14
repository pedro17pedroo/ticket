import express from 'express';
import {
  getAvailablePlans,
  getMySubscription,
  getOrganizationSubscription,
  requestPlanUpgrade,
  updateUsageStats,
  checkCurrentLimits
} from './planController.js';
import { authenticate } from '../../middleware/auth.js';
import { checkSubscriptionStatus, injectPlanInfo } from '../../middleware/planLimitsMiddleware.js';

const router = express.Router();

// Rotas públicas
router.get('/plans', getAvailablePlans);

// Rotas autenticadas
router.use(authenticate);

// Subscription routes
router.get('/subscription', checkSubscriptionStatus, getMySubscription);
router.get('/subscription/:organizationId', checkSubscriptionStatus, getOrganizationSubscription);
router.post('/subscription/upgrade', checkSubscriptionStatus, requestPlanUpgrade);
router.post('/subscription/usage/update', checkSubscriptionStatus, updateUsageStats);
router.get('/subscription/limits-check', checkSubscriptionStatus, checkCurrentLimits);

export default router;
