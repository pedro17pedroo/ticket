import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const TimeEntry = sequelize.define('TimeEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ticket_id',
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'organization_users',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.DATE,
    field: 'end_time'
  },
  duration: {
    type: DataTypes.INTEGER,
    field: 'duration',
    comment: 'Duration in seconds'
  },
  billable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'billable'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'True if timer is currently running'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'running',
    field: 'status',
    comment: 'Timer status: running, paused, or stopped'
  },
  totalPausedTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_paused_time',
    comment: 'Total paused time in seconds'
  },
  pauseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'pause_count',
    comment: 'Number of times timer was paused'
  },
  lastPauseAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_pause_at',
    comment: 'Timestamp when timer was last paused'
  },
  lastResumeAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_resume_at',
    comment: 'Timestamp when timer was last resumed'
  }
}, {
  tableName: 'time_entries',
  timestamps: true,
  underscored: true
});

export default TimeEntry;
