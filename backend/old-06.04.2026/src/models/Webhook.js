import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Webhook = sequelize.define('Webhook', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  events: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Lista de eventos que disparam o webhook'
    /*
    [
      'ticket.created',
      'ticket.updated',
      'ticket.resolved',
      'comment.created',
      'user.created',
      'sla.violated'
    ]
    */
  },
  headers: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Headers customizados para a requisição'
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Secret para assinar a requisição (HMAC)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  retryEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  timeout: {
    type: DataTypes.INTEGER,
    defaultValue: 30000,
    comment: 'Timeout em milissegundos'
  },
  lastTriggeredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  successCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failureCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'webhooks',
  timestamps: true,
  underscored: true
});

export default Webhook;
