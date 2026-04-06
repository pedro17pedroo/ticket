import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TicketMention = sequelize.define('TicketMention', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tickets',
      key: 'id'
    }
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id'
    },
    comment: 'ID do comentário onde ocorreu a mention (null se foi no ticket)'
  },
  mentionedUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Usuário mencionado'
  },
  mentionedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Usuário que mencionou'
  },
  context: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Trecho do texto onde ocorreu a mention'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ticket_mentions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['mentioned_user_id', 'is_read']
    },
    {
      fields: ['ticket_id']
    }
  ]
});

export default TicketMention;
