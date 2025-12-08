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
  requireRole(['admin', 'org-admin']),
  gamificationController.createBadge.bind(gamificationController)
);

// Atualizar badge
router.put('/badges/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  gamificationController.updateBadge.bind(gamificationController)
);

// Deletar badge
router.delete('/badges/:id',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  gamificationController.deleteBadge.bind(gamificationController)
);

// ===== MANUAL AWARDS =====

// Dar pontos manualmente
router.post('/award-points',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  gamificationController.awardPoints.bind(gamificationController)
);

// Dar badge manualmente
router.post('/award-badge',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  gamificationController.awardBadge.bind(gamificationController)
);

// ===== SETUP =====

// Criar badges padrão
router.post('/setup',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  gamificationController.setupDefaultBadges.bind(gamificationController)
);

// ===== ANALYTICS =====

// Analytics de gamificação
router.get('/analytics',
  authMiddleware,
  requireRole(['admin', 'org-admin']),
  gamificationController.getAnalytics.bind(gamificationController)
);

// ===== LEVELS =====

// Listar níveis
router.get('/levels',
  authMiddleware,
  gamificationController.getLevels.bind(gamificationController)
);

export default router;
