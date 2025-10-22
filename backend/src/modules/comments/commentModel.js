import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'comments',
  indexes: [
    { fields: ['ticket_id'] },
    { fields: ['user_id'] },
    { fields: ['created_at'] }
  ]
});

export default Comment;
