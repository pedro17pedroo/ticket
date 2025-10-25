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
    allowNull: false,
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
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    // created, updated, status_changed, assigned, transferred, priority_changed, etc.
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
    allowNull: true,
    // Descrição legível da mudança
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    // Metadados adicionais (IP, user agent, etc.)
  }
}, {
  tableName: 'ticket_history',
  timestamps: true,
  indexes: [
    { fields: ['ticket_id'] },
    { fields: ['user_id'] },
    { fields: ['organization_id'] },
    { fields: ['action'] },
    { fields: ['created_at'] }
  ]
});

export default TicketHistory;
