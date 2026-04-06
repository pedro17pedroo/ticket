import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const TimeTracking = sequelize.define('TimeTracking', {
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
      model: 'users',
      key: 'id'
    }
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pausedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalPausedTime: {
    type: DataTypes.INTEGER, // em segundos
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('running', 'paused', 'stopped'),
    defaultValue: 'running'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Tempo total em segundos (calculado ao parar)
  totalSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Auto-consumido na bolsa ao concluir ticket
  autoConsumed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hoursBankId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'hours_banks',
      key: 'id'
    }
  }
}, {
  tableName: 'time_tracking',
  timestamps: true
});

export default TimeTracking;
