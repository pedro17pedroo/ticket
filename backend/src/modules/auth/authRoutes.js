import express from 'express';
import { login, selectContext, switchContext, listUserContexts, register, getProfile, updateProfile, changePassword } from './authController.js';
import { authenticate } from '../../middleware/auth.js';
import { validate, schemas } from '../../middleware/validate.js';
import { auditLog } from '../../middleware/audit.js';

const router = express.Router();

// Rotas públicas
router.post('/login', validate(schemas.login), auditLog('login', 'user'), login);
router.post('/select-context', auditLog('login', 'user'), selectContext);
router.post('/register', validate(schemas.register), auditLog('create', 'user'), register);

// Rotas protegidas
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, auditLog('update', 'user'), updateProfile);
router.put('/change-password', authenticate, auditLog('update', 'user'), changePassword);
router.get('/contexts', authenticate, listUserContexts);
router.post('/switch-context', authenticate, auditLog('context_switch', 'user'), switchContext);

export default router;
