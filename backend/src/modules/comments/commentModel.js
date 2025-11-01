import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true, // Temporariamente nullable para migração
    field: 'organization_id',
    comment: 'Organização do comentário (para isolamento multi-tenant)'
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'comments',
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['ticket_id'] },
    { fields: ['user_id'] },
    { fields: ['created_at'] },
    { fields: ['organization_id', 'ticket_id'] }
  ]
});

export default Comment;
