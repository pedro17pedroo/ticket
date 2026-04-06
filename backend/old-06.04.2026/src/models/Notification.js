import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Destinatário
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'recipient_id',
    comment: 'ID do usuário que recebe a notificação'
  },
  
  recipientType: {
    type: DataTypes.ENUM('organization', 'client'),
    allowNull: false,
    field: 'recipient_type',
    comment: 'Tipo do destinatário: organization_user ou client_user'
  },
  
  // Organização (multi-tenant)
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id'
  },
  
  // Tipo e conteúdo da notificação
  type: {
    type: DataTypes.ENUM(
      'ticket_created',
      'ticket_assigned',
      'ticket_updated',
      'ticket_status_changed',
      'ticket_priority_changed',
      'ticket_comment',
      'ticket_approved',
      'ticket_rejected',
      'ticket_resolved',
      'ticket_closed',
      'ticket_reopened',
      'ticket_transferred',
      'ticket_merged',
      'ticket_sla_warning',
      'ticket_sla_breach',
      'service_request_created',
      'service_request_approved',
      'service_request_rejected',
      'hours_bank_updated',
      'asset_assigned',
      'mention'
    ),
    allowNull: false,
    comment: 'Tipo de notificação'
  },
  
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Título da notificação'
  },
  
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Mensagem da notificação'
  },
  
  // Dados relacionados
  relatedEntityType: {
    type: DataTypes.ENUM('ticket', 'service_request', 'comment', 'hours_bank', 'asset'),
    allowNull: true,
    field: 'related_entity_type',
    comment: 'Tipo de entidade relacionada'
  },
  
  relatedEntityId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'related_entity_id',
    comment: 'ID da entidade relacionada'
  },
  
  // Metadata adicional
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Dados adicionais (ex: ticketNumber, oldStatus, newStatus)'
  },
  
  // URL de ação
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'action_url',
    comment: 'URL para ação relacionada'
  },
  
  // Status
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se a notificação foi lida'
  },
  
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
    comment: 'Data/hora em que foi lida'
  },
  
  // E-mail
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_sent',
    comment: 'Se o e-mail foi enviado'
  },
  
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'email_sent_at',
    comment: 'Data/hora em que o e-mail foi enviado'
  },
  
  // Autor da ação que gerou a notificação
  actorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'actor_id',
    comment: 'ID do usuário que causou a notificação'
  },
  
  actorType: {
    type: DataTypes.ENUM('organization', 'client', 'system'),
    allowNull: true,
    field: 'actor_type',
    comment: 'Tipo do autor da ação'
  },
  
  actorName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'actor_name',
    comment: 'Nome do autor (denormalizado para performance)'
  }
  
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['recipient_id', 'recipient_type']
    },
    {
      fields: ['organization_id']
    },
    {
      fields: ['read']
    },
    {
      fields: ['type']
    },
    {
      fields: ['related_entity_type', 'related_entity_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default Notification;
