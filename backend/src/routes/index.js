import express from 'express';
import authRoutes from '../modules/auth/authRoutes.js';
import ticketRoutes from '../modules/tickets/ticketRoutes.js';
import departmentRoutes from '../modules/departments/departmentRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'TatuTicket Backend'
  });
});

// Rotas de módulos
router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/departments', departmentRoutes);

// TODO: Adicionar rotas para:
// - /categories
// - /slas
// - /knowledge
// - /hours
// - /users
// - /organizations

export default router;
