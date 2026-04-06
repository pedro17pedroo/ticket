import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Destinatário (pode ser organization_user ou client_user)
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'recipient_id',
    comment: 'ID do usuário que recebe'
  },
  recipientType: {
    type: DataTypes.ENUM('organization', 'client'),
    allowNull: false,
    field: 'recipient_type',
    comment: 'Tipo: organization ou client'
  },
  // Manter userId para compatibilidade
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
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
      'ticket_approved',
      'ticket_rejected',
      'ticket_resolved',
      'ticket_closed',
      'ticket_reopened',
      'comment_added',
      'comment_mentioned',
      'sla_warning',
      'sla_breached',
      'resolution_updated',
      'service_request_created',
      'service_request_approved',
      'service_request_rejected'
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
  },
  // Campos de e-mail
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_sent'
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'email_sent_at'
  },
  emailError: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'email_error'
  },
  // Autor da ação
  actorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'actor_id'
  },
  actorType: {
    type: DataTypes.ENUM('organization', 'client', 'system'),
    allowNull: true,
    field: 'actor_type'
  },
  actorName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'actor_name'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['recipient_id', 'recipient_type'] },
    { fields: ['organization_id'] },
    { fields: ['is_read'] },
    { fields: ['email_sent'] },
    { fields: ['created_at'] },
    { fields: ['type'] },
    { fields: ['ticket_id'] },
    { fields: ['actor_id'] }
  ]
});

export default Notification;
