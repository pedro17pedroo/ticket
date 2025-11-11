import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

const TicketHistory = sequelize.define('TicketHistory', {
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
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM(
      'created',
      'updated',
      'status_changed',
      'priority_changed',
      'assigned',
      'commented',
      'attachment_added',
      'tag_added',
      'tag_removed',
      'relationship_added',
      'relationship_removed'
    ),
    allowNull: false
  },
  field: {
    type: DataTypes.STRING,
    allowNull: true,
    // Campo que foi alterado: status, priority, assignee, department, etc.
  },
  oldValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('oldValue');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('oldValue', value ? JSON.stringify(value) : null);
    }
  },
  newValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('newValue');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('newValue', value ? JSON.stringify(value) : null);
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ticket_history',
  timestamps: false,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['ticket_id'] },
    { fields: ['user_id'] },
    { fields: ['action'] },
    { fields: ['created_at'] }
  ]
});

export default TicketHistory;
