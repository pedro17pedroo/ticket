import express from 'express';
import { createTenantOrganization, checkSlugAvailability, verifyEmail, sendVerificationEmail } from '../modules/saas/saasController.js';
import planRoutes from '../modules/saas/planRoutes.js';

const router = express.Router();

// ==================== ONBOARDING ====================
// POST /api/saas/onboarding - Criar nova organização tenant
router.post('/onboarding', createTenantOrganization);

// GET /api/saas/check-slug/:slug - Verificar disponibilidade do slug
router.get('/check-slug/:slug', checkSlugAvailability);

// POST /api/saas/verify-email - Verificar token de email
router.post('/verify-email', verifyEmail);

// POST /api/saas/resend-verification - Reenviar email de verificação
router.post('/resend-verification', sendVerificationEmail);
router.post('/send-verification', sendVerificationEmail);

// ==================== PLAN MANAGEMENT ====================
// Usar todas as rotas de planos e subscriptions
router.use('/', planRoutes);

export default router;
