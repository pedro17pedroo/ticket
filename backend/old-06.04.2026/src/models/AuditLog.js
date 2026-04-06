import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => require('crypto').randomUUID()
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Ação realizada (create, update, delete, login, etc)'
  },
  entityType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'entity_type',
    comment: 'Tipo da entidade afetada'
  },
  entityId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'entity_id',
    comment: 'ID da entidade afetada'
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'user_id',
    comment: 'ID do usuário que realizou a ação'
  },
  userEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'user_email',
    comment: 'Email do usuário'
  },
  userName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'user_name',
    comment: 'Nome do usuário'
  },
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'session_id',
    comment: 'ID da sessão'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  oldValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'old_values',
    comment: 'Valores antigos (before)'
  },
  newValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'new_values',
    comment: 'Valores novos (after)'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Metadados adicionais'
  },
  module: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Módulo do sistema'
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Endpoint da API'
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Método HTTP'
  },
  success: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'true',
    comment: 'Se a ação foi bem-sucedida'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Razão da ação'
  },
  riskLevel: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'low',
    field: 'risk_level',
    comment: 'Nível de risco'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'audit_logs',
  timestamps: false, // We're managing created_at manually
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['entity_type', 'entity_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default AuditLog;
