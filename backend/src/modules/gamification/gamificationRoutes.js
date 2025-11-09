import { Router } from 'express';
import gamificationController from './gamificationController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';

const router = Router();

// ===== USER STATS =====

// Minhas estatísticas
router.get('/me',
  authMiddleware,
  gamificationController.getMyStats.bind(gamificationController)
);

// Estatísticas de outro usuário
router.get('/users/:userId',
  authMiddleware,
  gamificationController.getUserStats.bind(gamificationController)
);

// ===== LEADERBOARD =====

// Leaderboard
router.get('/leaderboard',
  authMiddleware,
  gamificationController.getLeaderboard.bind(gamificationController)
);

// ===== BADGES =====

// Listar todos os badges
router.get('/badges',
  authMiddleware,
  gamificationController.getAllBadges.bind(gamificationController)
);

// Criar badge
router.post('/badges',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  gamificationController.createBadge.bind(gamificationController)
);

// Atualizar badge
router.put('/badges/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  gamificationController.updateBadge.bind(gamificationController)
);

// Deletar badge
router.delete('/badges/:id',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  gamificationController.deleteBadge.bind(gamificationController)
);

// ===== MANUAL AWARDS =====

// Dar pontos manualmente
router.post('/award-points',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  gamificationController.awardPoints.bind(gamificationController)
);

// Dar badge manualmente
router.post('/award-badge',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  gamificationController.awardBadge.bind(gamificationController)
);

// ===== SETUP =====

// Criar badges padrão
router.post('/setup',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  gamificationController.setupDefaultBadges.bind(gamificationController)
);

// ===== ANALYTICS =====

// Analytics de gamificação
router.get('/analytics',
  authMiddleware,
  requireRole(['admin', 'admin-org']),
  gamificationController.getAnalytics.bind(gamificationController)
);

// ===== LEVELS =====

// Listar níveis
router.get('/levels',
  authMiddleware,
  gamificationController.getLevels.bind(gamificationController)
);

export default router;
