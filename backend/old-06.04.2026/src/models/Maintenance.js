import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Maintenance = sequelize.define('Maintenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'scheduled',
      'in_progress',
      'completed',
      'cancelled'
    ),
    defaultValue: 'scheduled'
  },
  affectedServices: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array de IDs dos serviços afetados'
  },
  scheduledStartAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  scheduledEndAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  actualStartAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualEndAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expectedDowntime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tempo esperado de inatividade em minutos'
  },
  actualDowntime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tempo real de inatividade em minutos'
  },
  maintenanceType: {
    type: DataTypes.ENUM(
      'routine',
      'upgrade',
      'emergency',
      'security',
      'infrastructure',
      'database',
      'other'
    ),
    defaultValue: 'routine'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notifySubscribers: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationsSent: {
    type: DataTypes.JSON,
    defaultValue: {
      '24h': false,
      '1h': false,
      'start': false,
      'end': false
    }
  },
  updates: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array de atualizações durante a manutenção'
  },
  completionNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  completedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'maintenances',
  timestamps: true,
  underscored: true
});

export default Maintenance;
