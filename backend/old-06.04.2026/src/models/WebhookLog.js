import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const WebhookLog = sequelize.define('WebhookLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  webhookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Webhooks',
      key: 'id'
    }
  },
  event: {
    type: DataTypes.STRING,
    allowNull: false
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: false
  },
  responseStatus: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  responseBody: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    comment: 'Duração em milissegundos'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'retrying'),
    defaultValue: 'pending'
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
  tableName: 'webhook_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['webhook_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default WebhookLog;
