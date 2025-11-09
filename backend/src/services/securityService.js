import { Op } from 'sequelize';
import AuditLog from '../models/AuditLog.js';
import IPWhitelist from '../models/IPWhitelist.js';
import { User } from '../modules/models/index.js';
import logger from '../config/logger.js';

class SecurityService {
  constructor() {
    this.suspiciousPatterns = [
      { pattern: /password/i, severity: 'high' },
      { pattern: /admin/i, severity: 'medium' },
      { pattern: /delete/i, severity: 'medium' },
      { pattern: /drop/i, severity: 'critical' },
      { pattern: /truncate/i, severity: 'critical' },
      { pattern: /<script>/i, severity: 'high' }
    ];

    this.loginAttempts = new Map(); // userId -> { count, lastAttempt }
    this.blockedIPs = new Set();
  }

  // ===== AUDIT LOGGING =====

  async logAction(userId, action, options = {}) {
    try {
      const {
        entityType,
        entityId,
        changes = {},
        metadata = {},
        ipAddress,
        userAgent,
        organizationId,
        severity = 'low',
        status = 'success',
        errorMessage
      } = options;

      const auditLog = await AuditLog.create({
        userId,
        action,
        entityType,
        entityId,
        changes,
        metadata,
        ipAddress,
        userAgent,
        organizationId,
        severity,
        status,
        errorMessage
      });

      // Detectar atividade suspeita
      await this.detectSuspiciousActivity(auditLog);

      return auditLog;
    } catch (error) {
      logger.error('Erro ao criar audit log:', error);
      // Não lançar erro para não quebrar a funcionalidade principal
    }
  }

  async getAuditLogs(organizationId, filters = {}) {
    try {
      const {
        userId,
        action,
        entityType,
        severity,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = filters;

      const where = { organizationId };

      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (entityType) where.entityType = entityType;
      if (severity) where.severity = severity;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      const { rows: logs, count } = await AuditLog.findAndCountAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        logs,
        total: count,
        hasMore: count > (offset + limit)
      };
    } catch (error) {
      logger.error('Erro ao buscar audit logs:', error);
      throw error;
    }
  }

  // ===== IP WHITELIST =====

  async checkIPWhitelist(ip, organizationId) {
    try {
      // Se não há whitelist, permitir tudo
      const hasWhitelist = await IPWhitelist.count({
        where: { organizationId, isActive: true }
      });

      if (hasWhitelist === 0) return true;

      const whitelist = await IPWhitelist.findOne({
        where: {
          organizationId,
          isActive: true,
          [Op.or]: [
            { ipAddress: ip },
            { ipAddress: { [Op.like]: `${ip.split('.').slice(0, 3).join('.')}.%` } }
          ],
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        }
      });

      return whitelist !== null;
    } catch (error) {
      logger.error('Erro ao verificar whitelist:', error);
      return false;
    }
  }

  async addToWhitelist(ipAddress, organizationId, options = {}) {
    try {
      const {
        description,
        expiresAt,
        createdById
      } = options;

      const whitelist = await IPWhitelist.create({
        ipAddress,
        organizationId,
        description,
        expiresAt,
        createdById
      });

      await this.logAction(createdById, 'ip_whitelist_added', {
        entityType: 'IPWhitelist',
        entityId: whitelist.id,
        metadata: { ipAddress },
        organizationId,
        severity: 'medium'
      });

      return whitelist;
    } catch (error) {
      logger.error('Erro ao adicionar IP na whitelist:', error);
      throw error;
    }
  }

  async removeFromWhitelist(id, organizationId, userId) {
    try {
      const whitelist = await IPWhitelist.findOne({
        where: { id, organizationId }
      });

      if (!whitelist) {
        throw new Error('IP não encontrado na whitelist');
      }

      await whitelist.update({ isActive: false });

      await this.logAction(userId, 'ip_whitelist_removed', {
        entityType: 'IPWhitelist',
        entityId: whitelist.id,
        metadata: { ipAddress: whitelist.ipAddress },
        organizationId,
        severity: 'medium'
      });

      return whitelist;
    } catch (error) {
      logger.error('Erro ao remover IP da whitelist:', error);
      throw error;
    }
  }

  // ===== THREAT DETECTION =====

  async detectSuspiciousActivity(auditLog) {
    try {
      let isSuspicious = false;
      let reasons = [];

      // 1. Verificar padrões suspeitos
      const content = JSON.stringify(auditLog.changes) + JSON.stringify(auditLog.metadata);
      
      for (const { pattern, severity } of this.suspiciousPatterns) {
        if (pattern.test(content)) {
          isSuspicious = true;
          reasons.push(`Padrão suspeito detectado: ${pattern.source}`);
          
          if (severity === 'critical') {
            await this.alertSecurityTeam(auditLog, 'Padrão crítico detectado');
          }
        }
      }

      // 2. Verificar tentativas de login falhadas
      if (auditLog.action === 'login_failed') {
        const key = auditLog.userId || auditLog.ipAddress;
        const attempts = this.loginAttempts.get(key) || { count: 0 };
        
        attempts.count++;
        attempts.lastAttempt = new Date();
        this.loginAttempts.set(key, attempts);

        if (attempts.count >= 5) {
          isSuspicious = true;
          reasons.push('Múltiplas tentativas de login falhadas');
          
          if (attempts.count >= 10) {
            this.blockedIPs.add(auditLog.ipAddress);
            await this.alertSecurityTeam(auditLog, 'IP bloqueado por tentativas excessivas');
          }
        }
      }

      // 3. Verificar ações críticas
      const criticalActions = ['user_deleted', 'org_deleted', 'bulk_delete', 'permission_escalation'];
      if (criticalActions.includes(auditLog.action)) {
        isSuspicious = true;
        reasons.push('Ação crítica executada');
        await this.alertSecurityTeam(auditLog, 'Ação crítica detectada');
      }

      // 4. Verificar horário não usual
      const hour = new Date(auditLog.createdAt).getHours();
      if (hour < 6 || hour > 22) {
        isSuspicious = true;
        reasons.push('Atividade fora do horário usual');
      }

      if (isSuspicious) {
        await this.createSecurityAlert(auditLog, reasons);
      }

      return { isSuspicious, reasons };
    } catch (error) {
      logger.error('Erro ao detectar atividade suspeita:', error);
    }
  }

  async createSecurityAlert(auditLog, reasons) {
    // Criar alerta de segurança
    logger.warn('ALERTA DE SEGURANÇA:', {
      auditLogId: auditLog.id,
      userId: auditLog.userId,
      action: auditLog.action,
      reasons,
      ipAddress: auditLog.ipAddress
    });

    // Aqui você pode implementar notificações via email, Slack, etc.
  }

  async alertSecurityTeam(auditLog, message) {
    logger.error('ALERTA CRÍTICO DE SEGURANÇA:', {
      message,
      auditLogId: auditLog.id,
      userId: auditLog.userId,
      action: auditLog.action,
      ipAddress: auditLog.ipAddress
    });

    // Implementar notificação para equipe de segurança
  }

  // ===== RATE LIMITING =====

  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    const attempts = this.loginAttempts.get(ip);
    if (attempts) {
      attempts.count = 0;
    }
  }

  resetLoginAttempts(userId) {
    this.loginAttempts.delete(userId);
  }

  // ===== SESSION MANAGEMENT =====

  async logSession(userId, sessionId, options = {}) {
    const {
      action = 'session_created',
      ipAddress,
      userAgent,
      organizationId
    } = options;

    return await this.logAction(userId, action, {
      entityType: 'Session',
      entityId: sessionId,
      metadata: { sessionId },
      ipAddress,
      userAgent,
      organizationId,
      severity: 'low'
    });
  }

  async getActiveSessions(userId, organizationId) {
    try {
      const sessions = await AuditLog.findAll({
        where: {
          userId,
          organizationId,
          action: 'session_created',
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          }
        },
        order: [['created_at', 'DESC']]
      });

      return sessions;
    } catch (error) {
      logger.error('Erro ao buscar sessões ativas:', error);
      throw error;
    }
  }

  // ===== DATA ENCRYPTION =====

  encryptSensitiveData(data, algorithm = 'aes-256-gcm') {
    // Implementar encriptação de dados sensíveis
    // Usando crypto do Node.js
    return data; // Placeholder
  }

  decryptSensitiveData(encryptedData, algorithm = 'aes-256-gcm') {
    // Implementar decriptação
    return encryptedData; // Placeholder
  }

  // ===== SECURITY ANALYTICS =====

  async getSecurityAnalytics(organizationId, startDate, endDate) {
    try {
      const totalLogs = await AuditLog.count({
        where: {
          organizationId,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const criticalEvents = await AuditLog.count({
        where: {
          organizationId,
          severity: 'critical',
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const failedLogins = await AuditLog.count({
        where: {
          organizationId,
          action: 'login_failed',
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const topActions = await AuditLog.findAll({
        where: {
          organizationId,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['action'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 10
      });

      const topUsers = await AuditLog.findAll({
        where: {
          organizationId,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          'user_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['user_id'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 10,
        include: [{
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }]
      });

      return {
        totalLogs,
        criticalEvents,
        failedLogins,
        topActions: topActions.map(a => ({
          action: a.action,
          count: parseInt(a.get('count'))
        })),
        topUsers: topUsers.map(u => ({
          user: u.user,
          count: parseInt(u.get('count'))
        }))
      };
    } catch (error) {
      logger.error('Erro em security analytics:', error);
      throw error;
    }
  }

  // ===== COMPLIANCE =====

  async exportAuditLogsForCompliance(organizationId, startDate, endDate, format = 'json') {
    try {
      const logs = await AuditLog.findAll({
        where: {
          organizationId,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }],
        order: [['created_at', 'ASC']]
      });

      if (format === 'csv') {
        return this.convertToCSV(logs);
      }

      return logs;
    } catch (error) {
      logger.error('Erro ao exportar audit logs:', error);
      throw error;
    }
  }

  convertToCSV(logs) {
    const headers = ['ID', 'User', 'Action', 'Entity', 'IP', 'Timestamp', 'Severity', 'Status'];
    const rows = logs.map(log => [
      log.id,
      log.user?.name || 'N/A',
      log.action,
      `${log.entityType}:${log.entityId}`,
      log.ipAddress,
      log.createdAt,
      log.severity,
      log.status
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}

export default new SecurityService();
