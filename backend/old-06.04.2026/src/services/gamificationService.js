import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import GamePoints from '../models/GamePoints.js';
import { User, Ticket, Comment, KnowledgeArticle } from '../modules/models/index.js';
import logger from '../config/logger.js';

class GamificationService {
  constructor() {
    // Pontos por ação
    this.pointsConfig = {
      'ticket_created': 5,
      'ticket_resolved': 20,
      'ticket_closed': 10,
      'comment_added': 3,
      'article_created': 50,
      'article_updated': 10,
      'first_response': 15,
      'fast_response': 25, // < 1h
      'sla_met': 30,
      'sla_exceeded': -10,
      'badge_earned': 0, // Pontos vêm do badge
      'daily_login': 2,
      'weekly_streak': 50,
      'monthly_streak': 200
    };

    // Níveis e pontos necessários
    this.levels = [
      { level: 1, pointsRequired: 0, title: 'Novato' },
      { level: 2, pointsRequired: 100, title: 'Iniciante' },
      { level: 3, pointsRequired: 250, title: 'Aprendiz' },
      { level: 4, pointsRequired: 500, title: 'Competente' },
      { level: 5, pointsRequired: 1000, title: 'Profissional' },
      { level: 6, pointsRequired: 2000, title: 'Especialista' },
      { level: 7, pointsRequired: 4000, title: 'Veterano' },
      { level: 8, pointsRequired: 7000, title: 'Elite' },
      { level: 9, pointsRequired: 12000, title: 'Mestre' },
      { level: 10, pointsRequired: 20000, title: 'Lenda' }
    ];

    // Badges predefinidos
    this.defaultBadges = [
      {
        name: 'Primeiro Ticket',
        description: 'Resolveu seu primeiro ticket',
        icon: '🎉',
        category: 'milestone',
        criteria: { type: 'tickets_resolved', threshold: 1 },
        points: 10,
        rarity: 'common'
      },
      {
        name: 'Resolvedor',
        description: 'Resolveu 100 tickets',
        icon: '💪',
        category: 'productivity',
        criteria: { type: 'tickets_resolved', threshold: 100 },
        points: 100,
        rarity: 'rare'
      },
      {
        name: 'Velocista',
        description: 'Respondeu 50 tickets em menos de 1 hora',
        icon: '⚡',
        category: 'speed',
        criteria: { type: 'fast_responses', threshold: 50 },
        points: 150,
        rarity: 'epic'
      },
      {
        name: 'SLA Master',
        description: 'Cumpriu SLA em 100 tickets consecutivos',
        icon: '🎯',
        category: 'quality',
        criteria: { type: 'sla_streak', threshold: 100 },
        points: 200,
        rarity: 'legendary'
      },
      {
        name: 'Colaborador',
        description: 'Fez 500 comentários úteis',
        icon: '💬',
        category: 'collaboration',
        criteria: { type: 'comments_posted', threshold: 500 },
        points: 80,
        rarity: 'uncommon'
      },
      {
        name: 'Mentor',
        description: 'Criou 20 artigos na base de conhecimento',
        icon: '📚',
        category: 'leadership',
        criteria: { type: 'articles_created', threshold: 20 },
        points: 300,
        rarity: 'epic'
      },
      {
        name: 'Fogo',
        description: 'Manteve streak de 30 dias',
        icon: '🔥',
        category: 'special',
        criteria: { type: 'streak_days', threshold: 30 },
        points: 250,
        rarity: 'legendary'
      }
    ];
  }

  // ===== POINTS =====

  async awardPoints(userId, organizationId, action, metadata = {}) {
    try {
      const points = this.pointsConfig[action] || 0;
      
      if (points === 0) return null;

      // Buscar ou criar GamePoints do usuário
      let [gamePoints, created] = await GamePoints.findOrCreate({
        where: { userId, organizationId },
        defaults: {
          points: 0,
          level: 1,
          totalPointsEarned: 0,
          currentStreak: 0,
          longestStreak: 0,
          statistics: {
            ticketsResolved: 0,
            commentsPosted: 0,
            articlesCreated: 0,
            badgesEarned: 0,
            avgResponseTime: 0
          }
        }
      });

      // Atualizar pontos
      const newPoints = Math.max(0, gamePoints.points + points);
      const newTotalPoints = gamePoints.totalPointsEarned + Math.max(0, points);

      // Verificar mudança de nível
      const oldLevel = gamePoints.level;
      const newLevel = this.calculateLevel(newPoints);

      // Atualizar streak
      const today = new Date().toISOString().split('T')[0];
      let currentStreak = gamePoints.currentStreak;
      let longestStreak = gamePoints.longestStreak;

      if (gamePoints.lastActivityDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        if (gamePoints.lastActivityDate === yesterday) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        
        longestStreak = Math.max(longestStreak, currentStreak);
      }

      // Atualizar estatísticas
      const stats = { ...gamePoints.statistics };
      if (action === 'ticket_resolved') stats.ticketsResolved++;
      if (action === 'comment_added') stats.commentsPosted++;
      if (action === 'article_created') stats.articlesCreated++;

      await gamePoints.update({
        points: newPoints,
        totalPointsEarned: newTotalPoints,
        level: newLevel,
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        statistics: stats
      });

      // Verificar conquista de badges
      await this.checkAndAwardBadges(userId, organizationId);

      // Se subiu de nível, enviar notificação
      if (newLevel > oldLevel) {
        await this.notifyLevelUp(userId, newLevel);
      }

      return {
        pointsAwarded: points,
        newPoints,
        level: newLevel,
        levelUp: newLevel > oldLevel
      };
    } catch (error) {
      logger.error('Erro ao dar pontos:', error);
      throw error;
    }
  }

  calculateLevel(points) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (points >= this.levels[i].pointsRequired) {
        return this.levels[i].level;
      }
    }
    return 1;
  }

  getLevelInfo(level) {
    return this.levels.find(l => l.level === level) || this.levels[0];
  }

  getNextLevelInfo(currentLevel) {
    return this.levels.find(l => l.level === currentLevel + 1) || null;
  }

  // ===== BADGES =====

  async checkAndAwardBadges(userId, organizationId) {
    try {
      const gamePoints = await GamePoints.findOne({
        where: { userId, organizationId }
      });

      if (!gamePoints) return [];

      const badges = await Badge.findAll({
        where: {
          organizationId,
          isActive: true
        }
      });

      const newBadges = [];

      for (const badge of badges) {
        // Verificar se usuário já tem o badge
        const hasBadge = await UserBadge.findOne({
          where: { userId, badgeId: badge.id }
        });

        if (hasBadge) continue;

        // Verificar se usuário atende critérios
        const meetsСriteria = this.checkBadgeCriteria(badge.criteria, gamePoints);

        if (meetsСriteria) {
          await this.awardBadge(userId, badge.id, organizationId, 
            `Conquistou: ${badge.name}`);
          newBadges.push(badge);
        }
      }

      return newBadges;
    } catch (error) {
      logger.error('Erro ao verificar badges:', error);
      return [];
    }
  }

  checkBadgeCriteria(criteria, gamePoints) {
    const { type, threshold } = criteria;
    const stats = gamePoints.statistics;

    switch (type) {
      case 'tickets_resolved':
        return stats.ticketsResolved >= threshold;
      case 'comments_posted':
        return stats.commentsPosted >= threshold;
      case 'articles_created':
        return stats.articlesCreated >= threshold;
      case 'streak_days':
        return gamePoints.currentStreak >= threshold;
      case 'points_earned':
        return gamePoints.totalPointsEarned >= threshold;
      case 'level_reached':
        return gamePoints.level >= threshold;
      default:
        return false;
    }
  }

  async awardBadge(userId, badgeId, organizationId, reason) {
    try {
      const badge = await Badge.findByPk(badgeId);
      
      if (!badge) return null;

      const userBadge = await UserBadge.create({
        userId,
        badgeId,
        organizationId,
        reason,
        awardedAt: new Date()
      });

      // Incrementar contador do badge
      await badge.increment('timesAwarded');

      // Dar pontos do badge
      if (badge.points > 0) {
        await this.awardPoints(userId, organizationId, 'badge_earned', { badge: badge.name });
        
        // Atualizar estatísticas
        await GamePoints.increment('statistics.badgesEarned', {
          where: { userId, organizationId }
        });
      }

      // Notificar usuário
      await this.notifyBadgeEarned(userId, badge);

      return userBadge;
    } catch (error) {
      logger.error('Erro ao dar badge:', error);
      throw error;
    }
  }

  // ===== LEADERBOARD =====

  async getLeaderboard(organizationId, period = 'all_time', limit = 10) {
    try {
      const where = { organizationId };

      // Filtro por período
      if (period !== 'all_time') {
        const periodDates = this.getPeriodDates(period);
        where.updatedAt = {
          [Op.gte]: periodDates.start
        };
      }

      const leaderboard = await GamePoints.findAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatarUrl']
        }],
        order: [
          ['points', 'DESC'],
          ['level', 'DESC']
        ],
        limit
      });

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: entry.user,
        points: entry.points,
        level: entry.level,
        levelInfo: this.getLevelInfo(entry.level),
        streak: entry.currentStreak,
        badges: entry.statistics.badgesEarned,
        statistics: entry.statistics
      }));
    } catch (error) {
      logger.error('Erro ao buscar leaderboard:', error);
      throw error;
    }
  }

  getPeriodDates(period) {
    const now = new Date();
    const dates = {
      start: new Date(),
      end: now
    };

    switch (period) {
      case 'daily':
        dates.start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        dates.start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        dates.start.setMonth(now.getMonth() - 1);
        break;
      default:
        dates.start = new Date(0);
    }

    return dates;
  }

  // ===== USER STATS =====

  async getUserStats(userId, organizationId) {
    try {
      const gamePoints = await GamePoints.findOne({
        where: { userId, organizationId }
      });

      if (!gamePoints) {
        return this.createDefaultStats(userId, organizationId);
      }

      const userBadges = await UserBadge.findAll({
        where: { userId, organizationId },
        include: [{
          model: Badge,
          as: 'badge'
        }],
        order: [['awarded_at', 'DESC']]
      });

      const currentLevelInfo = this.getLevelInfo(gamePoints.level);
      const nextLevelInfo = this.getNextLevelInfo(gamePoints.level);

      const progressToNextLevel = nextLevelInfo 
        ? ((gamePoints.points - currentLevelInfo.pointsRequired) / 
           (nextLevelInfo.pointsRequired - currentLevelInfo.pointsRequired)) * 100
        : 100;

      // Buscar posição no leaderboard
      const rank = await this.getUserRank(userId, organizationId);

      return {
        userId,
        points: gamePoints.points,
        totalPointsEarned: gamePoints.totalPointsEarned,
        level: gamePoints.level,
        levelInfo: currentLevelInfo,
        nextLevelInfo,
        progressToNextLevel: Math.round(progressToNextLevel),
        currentStreak: gamePoints.currentStreak,
        longestStreak: gamePoints.longestStreak,
        rank,
        badges: userBadges.map(ub => ({
          ...ub.badge.toJSON(),
          awardedAt: ub.awardedAt,
          reason: ub.reason
        })),
        statistics: gamePoints.statistics
      };
    } catch (error) {
      logger.error('Erro ao buscar stats do usuário:', error);
      throw error;
    }
  }

  async getUserRank(userId, organizationId) {
    const userPoints = await GamePoints.findOne({
      where: { userId, organizationId },
      attributes: ['points']
    });

    if (!userPoints) return null;

    const rank = await GamePoints.count({
      where: {
        organizationId,
        points: { [Op.gt]: userPoints.points }
      }
    });

    return rank + 1;
  }

  async createDefaultStats(userId, organizationId) {
    const gamePoints = await GamePoints.create({
      userId,
      organizationId,
      points: 0,
      level: 1,
      totalPointsEarned: 0,
      currentStreak: 0,
      longestStreak: 0,
      statistics: {
        ticketsResolved: 0,
        commentsPosted: 0,
        articlesCreated: 0,
        badgesEarned: 0
      }
    });

    return this.getUserStats(userId, organizationId);
  }

  // ===== ACHIEVEMENTS & NOTIFICATIONS =====

  async notifyLevelUp(userId, newLevel) {
    // Implementar notificação (WebSocket, email, etc)
    logger.info(`Usuário ${userId} subiu para nível ${newLevel}!`);
  }

  async notifyBadgeEarned(userId, badge) {
    // Implementar notificação
    logger.info(`Usuário ${userId} ganhou badge: ${badge.name}!`);
  }

  // ===== SETUP =====

  async setupDefaultBadges(organizationId) {
    try {
      const badges = [];

      for (const badgeData of this.defaultBadges) {
        const [badge] = await Badge.findOrCreate({
          where: {
            name: badgeData.name,
            organizationId
          },
          defaults: {
            ...badgeData,
            organizationId
          }
        });

        badges.push(badge);
      }

      return badges;
    } catch (error) {
      logger.error('Erro ao criar badges padrão:', error);
      throw error;
    }
  }

  // ===== ANALYTICS =====

  async getGamificationAnalytics(organizationId, startDate, endDate) {
    try {
      const totalUsers = await GamePoints.count({
        where: { organizationId }
      });

      const avgPoints = await GamePoints.findOne({
        where: { organizationId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('points')), 'avgPoints'],
          [sequelize.fn('MAX', sequelize.col('points')), 'maxPoints']
        ]
      });

      const badgesAwarded = await UserBadge.count({
        where: {
          organizationId,
          awardedAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const levelDistribution = await GamePoints.findAll({
        where: { organizationId },
        attributes: [
          'level',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['level'],
        order: [['level', 'ASC']]
      });

      return {
        totalUsers,
        averagePoints: Math.round(avgPoints.avgPoints || 0),
        maxPoints: avgPoints.maxPoints || 0,
        badgesAwarded,
        levelDistribution: levelDistribution.map(ld => ({
          level: ld.level,
          count: parseInt(ld.get('count'))
        }))
      };
    } catch (error) {
      logger.error('Erro em analytics de gamificação:', error);
      throw error;
    }
  }
}

export default new GamificationService();
