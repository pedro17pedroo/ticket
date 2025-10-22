import AuditLog from '../modules/audit/auditSchema.js';
import logger from '../config/logger.js';

// Middleware para registrar ações de auditoria
export const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      // Salvar log de auditoria
      if (req.user && res.statusCode < 400) {
        try {
          await AuditLog.create({
            organizationId: req.user.organizationId,
            userId: req.user.id,
            userName: req.user.name,
            action,
            entityType,
            entityId: data?.id || data?.data?.id || req.params.id,
            changes: {
              body: req.body,
              params: req.params,
              query: req.query
            },
            metadata: {
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent')
            }
          });
        } catch (error) {
          logger.error('Erro ao salvar log de auditoria:', error);
        }
      }

      return originalJson(data);
    };

    next();
  };
};

// Função auxiliar para buscar logs
export const getAuditLogs = async (filters = {}) => {
  const {
    organizationId,
    userId,
    action,
    entityType,
    startDate,
    endDate,
    limit = 100,
    skip = 0
  } = filters;

  const query = {};

  if (organizationId) query.organizationId = organizationId;
  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return await AuditLog
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};
