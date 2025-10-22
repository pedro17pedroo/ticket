import express from 'express';
import { login, register, getProfile, updateProfile, changePassword } from './authController.js';
import { authenticate } from '../../middleware/auth.js';
import { validate, schemas } from '../../middleware/validate.js';
import { auditLog } from '../../middleware/audit.js';

const router = express.Router();

// Rotas públicas
router.post('/login', validate(schemas.login), auditLog('login', 'user'), login);
router.post('/register', validate(schemas.register), auditLog('create', 'user'), register);

// Rotas protegidas
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, auditLog('update', 'user'), updateProfile);
router.put('/change-password', authenticate, auditLog('update', 'user'), changePassword);

export default router;
