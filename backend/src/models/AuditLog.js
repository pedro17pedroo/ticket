import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Usuário que realizou a ação'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Ação realizada (create, update, delete, login, etc)'
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo da entidade afetada'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID da entidade afetada'
  },
  changes: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Mudanças realizadas (before/after)'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Metadados adicionais'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'low'
  },
  status: {
    type: DataTypes.ENUM('success', 'failure', 'pending'),
    defaultValue: 'success'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
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
      fields: ['organization_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default AuditLog;
