import express from 'express';
import { 
  createTenantOrganization, 
  checkSlugAvailability, 
  sendVerificationEmail,
  verifyEmail,
  getPlans 
} from './saasController.js';

const router = express.Router();

// Rotas públicas (sem autenticação)
router.post('/onboarding', createTenantOrganization);
router.get('/check-slug/:slug', checkSlugAvailability);
router.post('/send-verification', sendVerificationEmail);
router.post('/verify-email', verifyEmail);
router.get('/plans', getPlans);

export default router;
