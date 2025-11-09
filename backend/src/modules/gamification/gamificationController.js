import gamificationService from '../../services/gamificationService.js';
import Badge from '../../models/Badge.js';
import logger from '../../config/logger.js';

class GamificationController {
  // ===== USER STATS =====

  async getMyStats(req, res) {
    try {
      const { id: userId, organizationId } = req.user;

      const stats = await gamificationService.getUserStats(userId, organizationId);

      res.json(stats);
    } catch (error) {
      logger.error('Erro ao buscar stats:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }

  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      const { organizationId } = req.user;

      const stats = await gamificationService.getUserStats(parseInt(userId), organizationId);

      res.json(stats);
    } catch (error) {
      logger.error('Erro ao buscar stats do usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }

  // ===== LEADERBOARD =====

  async getLeaderboard(req, res) {
    try {
      const { organizationId } = req.user;
      const { period = 'all_time', limit = 10 } = req.query;

      const leaderboard = await gamificationService.getLeaderboard(
        organizationId,
        period,
        parseInt(limit)
      );

      res.json(leaderboard);
    } catch (error) {
      logger.error('Erro ao buscar leaderboard:', error);
      res.status(500).json({ error: 'Erro ao buscar leaderboard' });
    }
  }

  // ===== BADGES =====

  async getAllBadges(req, res) {
    try {
      const { organizationId } = req.user;

      const badges = await Badge.findAll({
        where: { organizationId, isActive: true },
        order: [
          ['rarity', 'DESC'],
          ['points', 'DESC']
        ]
      });

      res.json(badges);
    } catch (error) {
      logger.error('Erro ao buscar badges:', error);
      res.status(500).json({ error: 'Erro ao buscar badges' });
    }
  }

  async createBadge(req, res) {
    try {
      const { organizationId } = req.user;

      const badge = await Badge.create({
        ...req.body,
        organizationId
      });

      res.status(201).json(badge);
    } catch (error) {
      logger.error('Erro ao criar badge:', error);
      res.status(500).json({ error: 'Erro ao criar badge' });
    }
  }

  async updateBadge(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const badge = await Badge.findOne({
        where: { id, organizationId }
      });

      if (!badge) {
        return res.status(404).json({ error: 'Badge não encontrado' });
      }

      await badge.update(req.body);

      res.json(badge);
    } catch (error) {
      logger.error('Erro ao atualizar badge:', error);
      res.status(500).json({ error: 'Erro ao atualizar badge' });
    }
  }

  async deleteBadge(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const badge = await Badge.findOne({
        where: { id, organizationId }
      });

      if (!badge) {
        return res.status(404).json({ error: 'Badge não encontrado' });
      }

      await badge.update({ isActive: false });

      res.json({ message: 'Badge desativado com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar badge:', error);
      res.status(500).json({ error: 'Erro ao deletar badge' });
    }
  }

  // ===== MANUAL AWARDS =====

  async awardPoints(req, res) {
    try {
      const { userId, points, reason } = req.body;
      const { organizationId } = req.user;

      const result = await gamificationService.awardPoints(
        parseInt(userId),
        organizationId,
        'manual_award',
        { reason }
      );

      res.json({
        message: 'Pontos dados com sucesso',
        result
      });
    } catch (error) {
      logger.error('Erro ao dar pontos:', error);
      res.status(500).json({ error: 'Erro ao dar pontos' });
    }
  }

  async awardBadge(req, res) {
    try {
      const { userId, badgeId, reason } = req.body;
      const { organizationId } = req.user;

      const userBadge = await gamificationService.awardBadge(
        parseInt(userId),
        parseInt(badgeId),
        organizationId,
        reason || 'Conquista manual'
      );

      res.json({
        message: 'Badge dado com sucesso',
        userBadge
      });
    } catch (error) {
      logger.error('Erro ao dar badge:', error);
      res.status(500).json({ error: 'Erro ao dar badge' });
    }
  }

  // ===== SETUP =====

  async setupDefaultBadges(req, res) {
    try {
      const { organizationId } = req.user;

      const badges = await gamificationService.setupDefaultBadges(organizationId);

      res.json({
        message: 'Badges padrão criados com sucesso',
        count: badges.length,
        badges
      });
    } catch (error) {
      logger.error('Erro ao criar badges padrão:', error);
      res.status(500).json({ error: 'Erro ao criar badges padrão' });
    }
  }

  // ===== ANALYTICS =====

  async getAnalytics(req, res) {
    try {
      const { organizationId } = req.user;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await gamificationService.getGamificationAnalytics(
        organizationId,
        start,
        end
      );

      res.json(analytics);
    } catch (error) {
      logger.error('Erro ao buscar analytics:', error);
      res.status(500).json({ error: 'Erro ao buscar analytics' });
    }
  }

  // ===== LEVELS =====

  async getLevels(req, res) {
    try {
      res.json(gamificationService.levels);
    } catch (error) {
      logger.error('Erro ao buscar níveis:', error);
      res.status(500).json({ error: 'Erro ao buscar níveis' });
    }
  }
}

export default new GamificationController();
