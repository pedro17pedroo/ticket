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
    type: DataTypes.ENUM(
      'blocks',
      'blocked_by',
      'relates_to',
      'duplicates',
      'duplicated_by',
      'parent_of',
      'child_of',
      'precedes',
      'follows',
      'caused_by',
      'causes'
    ),
    defaultValue: 'relates_to'
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'ticket_relationships',
  timestamps: true,
  underscored: true
});

export default TicketRelationship;
