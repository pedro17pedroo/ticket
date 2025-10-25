import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'ticket_created',
      'ticket_assigned',
      'ticket_updated',
      'ticket_status_changed',
      'ticket_priority_changed',
      'ticket_transferred',
      'ticket_merged',
      'comment_added',
      'comment_mentioned',
      'sla_warning',
      'sla_breached',
      'resolution_updated'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['organization_id'] },
    { fields: ['is_read'] },
    { fields: ['created_at'] },
    { fields: ['type'] },
    { fields: ['ticket_id'] }
  ]
});

export default Notification;
