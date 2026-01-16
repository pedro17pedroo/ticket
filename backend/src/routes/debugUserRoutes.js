import express from 'express';
import { ClientUser } from '../modules/models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Debug endpoint para verificar usuário cliente
 */
router.get('/debug/client-user/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await ClientUser.findOne({
      where: { email },
      raw: true
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      directionId: user.directionId,
      departmentId: user.departmentId,
      sectionId: user.sectionId,
      isActive: user.isActive,
      isAdmin: user.role === 'client-admin'
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
