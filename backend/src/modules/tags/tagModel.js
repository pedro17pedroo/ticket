import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(7), // hex color #RRGGBB
    defaultValue: '#3B82F6'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tags',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['organization_id', 'name']
    }
  ]
});

// Tabela intermediária Ticket-Tag (many-to-many)
export const TicketTag = sequelize.define('TicketTag', {
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
  tagId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id'
    }
  }
}, {
  tableName: 'ticket_tags',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['ticket_id', 'tag_id']
    }
  ]
});

export default { Tag, TicketTag };
