import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TicketRelationship = sequelize.define('TicketRelationship', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sourceTicketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tickets',
      key: 'id'
    }
  },
  targetTicketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tickets',
      key: 'id'
    }
  },
  relationshipType: {
    type: DataTypes.ENUM(
      'parent_of',       // Ticket pai
      'child_of',        // Ticket filho
      'blocks',          // Bloqueia outro ticket
      'blocked_by',      // É bloqueado por outro ticket
      'relates_to',      // Relacionado a
      'duplicates',      // Duplica outro ticket
      'duplicated_by',   // É duplicado por outro ticket
      'caused_by',       // Causado por
      'causes',          // Causa outro problema
      'follows',         // Segue outro ticket
      'precedes'         // Precede outro ticket
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição opcional da relação'
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'ticket_relationships',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['source_ticket_id']
    },
    {
      fields: ['target_ticket_id']
    },
    {
      fields: ['relationship_type']
    }
  ]
});

export default TicketRelationship;
