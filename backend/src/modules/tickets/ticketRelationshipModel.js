import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const TicketRelationship = sequelize.define('TicketRelationship', {
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
  relatedTicketId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  relationshipType: {
    type: DataTypes.ENUM('related', 'duplicate', 'blocks', 'blocked_by', 'parent', 'child'),
    defaultValue: 'related'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ticket_relationships',
  timestamps: true
});

export default TicketRelationship;
