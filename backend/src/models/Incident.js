import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Incident = sequelize.define('Incident', {
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
      'investigating',
      'identified',
      'monitoring',
      'resolved',
      'postmortem'
    ),
    defaultValue: 'investigating'
  },
  impact: {
    type: DataTypes.ENUM(
      'none',
      'minor',
      'major',
      'critical'
    ),
    defaultValue: 'minor'
  },
  affectedServices: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array de IDs dos serviços afetados'
  },
  updates: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array de atualizações do incidente'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  identifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  postmortemAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  postmortemBody: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rootCause: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preventiveMeasures: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notifySubscribers: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  affectedUsers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número estimado de usuários afetados'
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
  resolvedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'incidents',
  timestamps: true,
  underscored: true
});

export default Incident;
